// A walking robot, simulated with a real 2D rigid-body engine (planck.js /
// Box2D). The body is a FIXED bilaterally-symmetric two-legged humanoid (torso,
// head, two matched legs, two matched arms); what's learned is its controller,
// a small per-limb neural policy run once per limb each tick. Joints are
// motorised revolutes with angle limits (real actuators), contacts and friction
// are engine-solved on a solid ground box, and parts self-collide. A PD "active
// balance" holds the torso upright so the optimiser can focus on the leg gait.
// Fitness is forward distance covered with a foot planted.

import { Box, RevoluteJoint, Vec2, World, type Body } from "planck";
import { cloneNetwork, createNetwork, forward, netFromWeights, type Network } from "./nn";

// Shared per-limb controller. Inputs: this limb's two joint angles, its
// foot-contact flag, sin/cos of its phase clock, and the torso tilt. Outputs:
// the two joint motor commands. Fixed shape, so the optimiser works on a plain
// weight vector.
export const CTRL_SHAPE = [6, 10, 2];

// Simulation in metres (Box2D likes human-scale units); the renderer scales up.
const DT = 1 / 60;
const VEL_ITERS = 10;
const POS_ITERS = 6;
const PHASE_FREQ = 0.16;
const STALE_TICKS = 150;
const TAU = Math.PI * 2;
// Active balance: PD torque holds the torso upright (like a real biped's trunk
// stabiliser). Gains are firm enough to stay vertical but calm enough not to
// tear the joints apart.
const BALANCE_KP = 18;
const BALANCE_KD = 4;
const FALL_ANGLE = 1.4; // safety cull if it ends up near-horizontal
const MOTOR_SPEED = 5; // rad/s the controller can command
const LEG_TORQUE = 14;
const ARM_TORQUE = 4;
export const LIMB_HALF_W = 0.045;
export const TORSO_HALF_W = 0.08;
const DENSITY = 1;
const FOOT_FRICTION = 0.9;

export interface LimbGene {
  attach: number; // < 0.5 = leg (at hip), else arm (at shoulder)
  dir: number; // splay: -1 back, +1 forward
  upperLen: number;
  lowerLen: number;
  phase: number; // gait phase offset [0,1)
  strength: number; // motor-torque multiplier
}

export interface Morphology {
  torsoLen: number;
  headSize: number;
  limbs: LimbGene[];
}

export interface Genome {
  morph: Morphology;
  net: Network;
}

// The one body everyone shares: a symmetric biped. Legs matched (antiphase),
// arms matched, arms weaker than legs. Order: back leg, front leg, back arm,
// front arm.
export const FIXED_MORPH: Morphology = {
  torsoLen: 0.5,
  headSize: 0.2,
  limbs: [
    { attach: 0.1, dir: -0.15, upperLen: 0.4, lowerLen: 0.4, phase: 0, strength: 1.2 },
    { attach: 0.1, dir: 0.15, upperLen: 0.4, lowerLen: 0.4, phase: 0.5, strength: 1.2 },
    { attach: 0.9, dir: -0.25, upperLen: 0.3, lowerLen: 0.25, phase: 0.25, strength: 0.6 },
    { attach: 0.9, dir: 0.25, upperLen: 0.3, lowerLen: 0.25, phase: 0.75, strength: 0.6 },
  ],
};

// Build a genome (fixed body + a controller) from a flat weight vector.
export function genomeFromWeights(weights: number[]): Genome {
  return { morph: FIXED_MORPH, net: netFromWeights(CTRL_SHAPE, weights) };
}

// A random controller on the fixed body (seeds the optimiser / used in tests).
export function randomGenome(rand: () => number): Genome {
  return { morph: FIXED_MORPH, net: createNetwork(CTRL_SHAPE, rand) };
}

export function cloneGenome(g: Genome): Genome {
  return { morph: g.morph, net: cloneNetwork(g.net) };
}

// Runtime handles the controller/renderer need for one limb.
interface LimbRuntime {
  hip: RevoluteJoint;
  knee: RevoluteJoint;
  upper: Body;
  lower: Body;
  upperLen: number;
  lowerLen: number;
  footLocalX: number;
  isLeg: boolean;
  phase: number;
  index: number;
}

export interface Walker {
  genome: Genome;
  world: World;
  torso: Body;
  torsoLen: number;
  headSize: number;
  limbs: LimbRuntime[];
  grounded: boolean[];
  contact: number[]; // per-limb grounded-tick count, for the two-leg balance
  startX: number;
  maxX: number; // furthest torso x, any means, for the camera
  prevX: number; // torso x last tick, for per-tick grounded displacement
  dist: number; // raw forward distance covered with a foot planted
  ticks: number;
  alive: boolean;
  stale: number;
  fitness: number; // dist scaled by how evenly the two legs share the load
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// A rigid segment body spanning world points a->b.
function segment(world: World, ax: number, ay: number, bx: number, by: number, halfW: number): Body {
  const len = Math.hypot(bx - ax, by - ay) || 0.01;
  const body = world.createDynamicBody({
    position: Vec2((ax + bx) / 2, (ay + by) / 2),
    angle: Math.atan2(by - ay, bx - ax),
  });
  body.createFixture({ shape: new Box(len / 2, halfW), density: DENSITY, friction: 0.4 });
  return body;
}

function revolute(
  world: World,
  a: Body,
  b: Body,
  anchorX: number,
  anchorY: number,
  torque: number,
  lo: number,
  hi: number,
): RevoluteJoint {
  return world.createJoint(
    new RevoluteJoint(
      {
        enableMotor: true,
        motorSpeed: 0,
        maxMotorTorque: torque,
        enableLimit: true,
        lowerAngle: lo,
        upperAngle: hi,
        collideConnected: false,
      },
      a,
      b,
      Vec2(anchorX, anchorY),
    ),
  )!;
}

// Build the whole robot (its own world) standing on the floor at originX.
export function createWalker(genome: Genome, originX: number): Walker {
  const g = genome.morph;
  const world = new World({ gravity: Vec2(0, -10) });

  // Thick solid ground box (top at y=0), so a fast foot can't tunnel through.
  const ground = world.createBody();
  ground.createFixture({
    shape: new Box(320, 5, Vec2(originX, -5), 0),
    friction: FOOT_FRICTION,
    userData: { ground: true },
  });

  const legReach = Math.max(...g.limbs.filter((l) => l.attach < 0.5).map((l) => l.upperLen + l.lowerLen));
  const hipY = legReach * 0.95;
  const hipX = originX;
  const shoulderY = hipY + g.torsoLen;

  const torso = segment(world, hipX, hipY, hipX, shoulderY, TORSO_HALF_W);
  // Head is a rigid fixture on top of the torso (local +x is up the spine).
  torso.createFixture({
    shape: new Box(g.headSize * 0.5, g.headSize * 0.5, Vec2(g.torsoLen / 2 + g.headSize * 0.5, 0), 0),
    density: DENSITY * 0.6,
  });

  const limbs: LimbRuntime[] = [];
  g.limbs.forEach((lg, index) => {
    const isLeg = lg.attach < 0.5;
    const ax = hipX;
    const ay = isLeg ? hipY : shoulderY;
    const splay = lg.dir * 0.4;
    const dx = Math.sin(splay);
    const dy = -Math.cos(splay);
    const kneeX = ax + dx * lg.upperLen;
    const kneeY = ay + dy * lg.upperLen;
    const footX = kneeX + dx * lg.lowerLen;
    const footY = kneeY + dy * lg.lowerLen;

    const upper = segment(world, ax, ay, kneeX, kneeY, LIMB_HALF_W);
    const lower = segment(world, kneeX, kneeY, footX, footY, LIMB_HALF_W);
    lower.createFixture({
      shape: new Box(0.06, 0.03, Vec2(lg.lowerLen / 2, 0), 0),
      density: DENSITY,
      friction: FOOT_FRICTION,
      userData: { foot: index },
    });

    const torque = (isLeg ? LEG_TORQUE : ARM_TORQUE) * lg.strength;
    const hip = revolute(world, torso, upper, ax, ay, torque, -1.3, 1.3);
    const knee = revolute(world, upper, lower, kneeX, kneeY, torque, -2.2, isLeg ? 0.2 : 2.2);
    limbs.push({
      hip,
      knee,
      upper,
      lower,
      upperLen: lg.upperLen,
      lowerLen: lg.lowerLen,
      footLocalX: lg.lowerLen / 2,
      isLeg,
      phase: lg.phase,
      index,
    });
  });

  return {
    genome,
    world,
    torso,
    torsoLen: g.torsoLen,
    headSize: g.headSize,
    limbs,
    grounded: g.limbs.map(() => false),
    contact: g.limbs.map(() => 0),
    startX: torso.getPosition().x,
    maxX: torso.getPosition().x,
    prevX: torso.getPosition().x,
    dist: 0,
    ticks: 0,
    alive: true,
    stale: 0,
    fitness: 0,
  };
}

function updateContacts(walker: Walker): void {
  for (let i = 0; i < walker.grounded.length; i++) walker.grounded[i] = false;
  for (let c = walker.world.getContactList(); c; c = c.getNext()) {
    if (!c.isTouching()) continue;
    const ua = c.getFixtureA().getUserData() as { foot?: number; ground?: boolean } | null;
    const ub = c.getFixtureB().getUserData() as { foot?: number; ground?: boolean } | null;
    const foot = ua?.foot != null ? ua.foot : ub?.foot != null ? ub.foot : null;
    const ground = ua?.ground || ub?.ground;
    if (foot != null && ground) walker.grounded[foot] = true;
  }
}

function muscleAngle(j: RevoluteJoint): number {
  return j.getJointAngle();
}

// Advance one walker by a tick: run the policy per limb into the joint motors,
// hold the torso upright, step the physics, then score grounded forward travel.
export function stepWalker(walker: Walker): void {
  if (!walker.alive) return;
  walker.ticks += 1;
  // Torso built hip->shoulder, so a vertical torso reads +PI/2; tilt is relative
  // to that upright, wrapped to [-PI, PI].
  const raw = walker.torso.getAngle() - Math.PI / 2;
  const tilt = Math.atan2(Math.sin(raw), Math.cos(raw));
  const clock = walker.ticks * PHASE_FREQ;
  const net = walker.genome.net;
  const inputs = new Array(CTRL_SHAPE[0]);

  for (const limb of walker.limbs) {
    inputs[0] = clamp(muscleAngle(limb.hip) / 1.5, -1, 1);
    inputs[1] = clamp(muscleAngle(limb.knee) / 2, -1, 1);
    inputs[2] = walker.grounded[limb.index] ? 1 : -1;
    inputs[3] = Math.sin(clock + limb.phase * TAU);
    inputs[4] = Math.cos(clock + limb.phase * TAU);
    inputs[5] = clamp(tilt / 1.5, -1, 1);
    const [h, k] = forward(net, inputs);
    limb.hip.setMotorSpeed(h * MOTOR_SPEED);
    limb.knee.setMotorSpeed(k * MOTOR_SPEED);
  }

  walker.torso.applyTorque(-BALANCE_KP * tilt - BALANCE_KD * walker.torso.getAngularVelocity());

  walker.world.step(DT, VEL_ITERS, POS_ITERS);
  updateContacts(walker);

  // Tally per-leg ground time (for the balance factor below).
  for (const l of walker.limbs) if (l.isLeg && walker.grounded[l.index]) walker.contact[l.index] += 1;

  const x = walker.torso.getPosition().x;
  const dx = x - walker.prevX;
  walker.prevX = x;
  if (x > walker.maxX) walker.maxX = x;
  const footDown = walker.limbs.some((l) => l.isLeg && walker.grounded[l.index]);
  if (footDown && dx > 0) {
    walker.dist += dx;
    walker.stale = 0;
  } else {
    walker.stale += 1;
    if (walker.stale > STALE_TICKS) walker.alive = false;
  }

  // Fitness = distance scaled by how evenly the two legs share ground time.
  // balance = 4LR/(L+R)^2 is 1 when both legs work equally, ~0 when one leg does
  // everything, so dragging along on a single leg stops paying.
  const legs = walker.limbs.filter((l) => l.isLeg);
  const lc = walker.contact[legs[0].index];
  const rc = walker.contact[legs[1].index];
  const tot = lc + rc;
  const balance = tot > 0 ? (4 * lc * rc) / (tot * tot) : 0;
  walker.fitness = walker.dist * balance;

  if (Math.abs(tilt) > FALL_ANGLE) walker.alive = false;
}
