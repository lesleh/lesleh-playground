// A walking robot, simulated with a real 2D rigid-body engine (planck.js /
// Box2D). The body is a FIXED bilaterally-symmetric two-legged humanoid (torso,
// head, two matched legs, two matched arms); what's learned is its controller,
// a small per-limb neural policy run once per limb each tick. Joints are
// motorised revolutes with angle limits driven in position mode: the policy
// outputs target angles and each motor servos toward its target. Body parts
// don't collide with each other (in a 2D side view the legs must cross every
// stride), only with the ground. A PD "active balance" holds the torso upright
// so the optimiser can focus on the leg gait.
// Fitness is imitation of a hand-authored reference stride (see gait.ts),
// multiplied by grounded forward distance - tracking the stride is the only
// way to score, and covering ground while doing it is the only way to score
// big, so scoots/drags/launches pay nothing.

import { Box, RevoluteJoint, Vec2, World, type Body } from "planck";
import { STRIDE, referencePose, type JointTargets } from "./gait";
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
const PHASE_FREQ = 0.11; // rad/tick of gait clock: one stride ~0.95s
const STALE_TICKS = 150;
const TAU = Math.PI * 2;
// Active balance: PD torque holds the torso upright (like a real biped's trunk
// stabiliser). Gains are firm enough to stay vertical but calm enough not to
// tear the joints apart.
// Damping is sized against the whole-body pendulum about the stance foot
// (I ~ 8 kg.m^2), not just the torso - underdamped gains let the gait pump a
// fore-aft rocking resonance that killed forward progress.
const BALANCE_KP = 80;
const BALANCE_KD = 25;
const FALL_ANGLE = 1.4; // safety cull if it ends up near-horizontal
const MOTOR_SPEED = 9; // rad/s cap on the joint servos (swing knees are quick)
const SERVO_GAIN = 8; // motor speed per radian of target error
const LEG_TORQUE = 60;
const ARM_TORQUE = 12;
// Imitation reward shaping: per-tick reward exp(-IMIT_SHARPNESS * mse) over the
// leg joints vs the reference pose, scaled so a full episode of perfect
// tracking is worth ~maxTicks/IMIT_SCALE points before the distance multiplier.
const IMIT_SHARPNESS = 4;
const IMIT_SCALE = 60;
// The first stride ramps in from standing so the initial pose change doesn't
// kick off the fore-aft rocking mode.
const RAMP_TICKS = 90;
// Raibert-style foot placement: the swing hip target is offset by the forward
// velocity error, so a too-slow body plants its next foot further back (and
// falls forward, accelerating) and a too-fast one plants ahead (braking).
// Without this the gravity-referenced hips are a perfect march-in-place
// stabiliser: they arrest every forward fall, including the one walking needs.
const RAIBERT_KV = 0.25; // rad of thigh per m/s of velocity error
const RAIBERT_MAX = 0.35;
// The speed the stride is authored for: two steps of STRIDE per gait cycle.
const TARGET_VX = (2 * STRIDE * 60 * PHASE_FREQ) / TAU;
export const LIMB_HALF_W = 0.045;
export const TORSO_HALF_W = 0.08;
// Human-ish mass (the whole robot lands around 13kg). Featherweight bodies
// with strong motors gave per-tick velocity jumps the solver couldn't
// integrate at 60Hz - joints blew straight through their limits.
const DENSITY = 30;
const FOOT_FRICTION = 0.9;
// All of a robot's own fixtures share a negative collision group: in a 2D
// sagittal view the legs MUST pass through each other every stride, so
// self-collision would make walking geometrically impossible. Ground contact
// is unaffected.
const SELF_GROUP = -1;

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
// arms matched and weaker, each arm counter-swinging its same-side leg (so it
// shares the opposite leg's phase). Order: back leg, front leg, back arm,
// front arm.
export const FIXED_MORPH: Morphology = {
  torsoLen: 0.5,
  headSize: 0.2,
  limbs: [
    { attach: 0.1, dir: -0.15, upperLen: 0.4, lowerLen: 0.4, phase: 0, strength: 1.2 },
    { attach: 0.1, dir: 0.15, upperLen: 0.4, lowerLen: 0.4, phase: 0.5, strength: 1.2 },
    { attach: 0.9, dir: -0.25, upperLen: 0.3, lowerLen: 0.25, phase: 0.5, strength: 0.6 },
    { attach: 0.9, dir: 0.25, upperLen: 0.3, lowerLen: 0.25, phase: 0, strength: 0.6 },
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
export interface LimbRuntime {
  hip: RevoluteJoint;
  knee: RevoluteJoint;
  upper: Body;
  lower: Body;
  upperLen: number;
  lowerLen: number;
  footLocalX: number;
  isLeg: boolean;
  phase: number;
  splay: number; // build-time lean from vertical; joint angle 0 = this pose
  index: number;
}

// Optional controller override: targets for one limb at a gait phase, with the
// hip given as a thigh angle from WORLD vertical (gravity-referenced, like a
// real robot's IMU-stabilised hips - stepWalker converts to joint space using
// the live torso tilt, which is what lets a stumbling walker plant its swing
// foot where the fall is going instead of where the torso points). Used to
// drive a body straight from the reference stride without going through a
// network.
export type LimbControl = (limb: LimbRuntime, phase01: number, amp: number) => JointTargets;

export interface Walker {
  genome: Genome;
  world: World;
  torso: Body;
  torsoLen: number;
  headSize: number;
  limbs: LimbRuntime[];
  grounded: boolean[];
  contact: number[]; // per-leg grounded-tick count (diagnostics)
  startX: number;
  maxX: number; // furthest torso x, any means, for the camera
  prevX: number; // torso x last tick, for per-tick grounded displacement
  dist: number; // raw forward distance covered with a foot planted
  imit: number; // accumulated per-tick reference-stride tracking reward
  ticks: number;
  alive: boolean;
  stale: number;
  fitness: number; // stride imitation scaled up by grounded distance
  control?: LimbControl; // bypass the network when set
}

// Drive a limb's joints straight from the reference stride (the "oracle"
// controller). Arms take a toned-down copy of the cycle: a modest counter-swing
// with a lightly bent elbow, instead of marching with leg-sized folds.
export function referenceControl(limb: LimbRuntime, phase01: number, amp = 1): JointTargets {
  const pose = referencePose(phase01, amp);
  if (limb.isLeg) return pose;
  return { hip: pose.hip * 0.55, knee: -0.35 + pose.knee * 0.3 };
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
  body.createFixture({
    shape: new Box(len / 2, halfW),
    density: DENSITY,
    friction: 0.4,
    filterGroupIndex: SELF_GROUP,
  });
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
    filterGroupIndex: SELF_GROUP,
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
      filterGroupIndex: SELF_GROUP,
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
      splay,
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
    imit: 0,
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

// Map a network's (-1, 1) outputs onto target angles: the hip as a thigh angle
// from world vertical, the knee spanning that joint's limit range.
function decodeTargets(limb: LimbRuntime, h: number, k: number): JointTargets {
  return {
    hip: h * 1.2,
    knee: limb.isLeg ? -1 + k * 1.2 : k * 2.2,
  };
}

// Advance one walker by a tick: run the policy per limb into the joint servos,
// hold the torso upright, step the physics, then score stride imitation and
// grounded forward travel.
export function stepWalker(walker: Walker): void {
  if (!walker.alive) return;
  walker.ticks += 1;
  // Torso built hip->shoulder, so a vertical torso reads +PI/2; tilt is relative
  // to that upright, wrapped to [-PI, PI].
  const raw = walker.torso.getAngle() - Math.PI / 2;
  const tilt = Math.atan2(Math.sin(raw), Math.cos(raw));
  const clock = walker.ticks * PHASE_FREQ;
  const amp = Math.min(1, walker.ticks / RAMP_TICKS);
  const vx = walker.torso.getLinearVelocity().x;
  const placement = clamp(RAIBERT_KV * (TARGET_VX * amp - vx), -RAIBERT_MAX, RAIBERT_MAX);
  const net = walker.genome.net;
  const inputs = new Array(CTRL_SHAPE[0]);
  let refErr = 0; // squared leg-joint error vs the reference stride

  for (const limb of walker.limbs) {
    const phase01 = clock / TAU + limb.phase - Math.floor(clock / TAU + limb.phase);
    let target: JointTargets;
    if (walker.control) {
      target = walker.control(limb, phase01, amp);
    } else {
      inputs[0] = clamp(limb.hip.getJointAngle() / 1.5, -1, 1);
      inputs[1] = clamp(limb.knee.getJointAngle() / 2, -1, 1);
      inputs[2] = walker.grounded[limb.index] ? 1 : -1;
      inputs[3] = Math.sin(phase01 * TAU);
      inputs[4] = Math.cos(phase01 * TAU);
      inputs[5] = clamp(tilt / 1.5, -1, 1);
      const [h, k] = forward(net, inputs);
      target = decodeTargets(limb, h, k);
    }
    // Hip targets are thigh-from-world-vertical; joint space subtracts the
    // build splay and the live torso tilt (gravity-referenced actuation), and
    // an airborne leg gets the Raibert placement offset. Clamped inside the
    // joint limits so a deep stumble can't wind the servo into the stops.
    const reflex = limb.isLeg && !walker.grounded[limb.index] ? -placement : 0;
    const toJoint = (hip: number) => clamp(hip - limb.splay - tilt + reflex, -1.25, 1.25);
    const hipJointTarget = toJoint(target.hip);
    const kneeJointTarget = clamp(target.knee, -2.15, limb.isLeg ? 0.15 : 2.15);
    limb.hip.setMotorSpeed(clamp(SERVO_GAIN * (hipJointTarget - limb.hip.getJointAngle()), -MOTOR_SPEED, MOTOR_SPEED));
    limb.knee.setMotorSpeed(clamp(SERVO_GAIN * (kneeJointTarget - limb.knee.getJointAngle()), -MOTOR_SPEED, MOTOR_SPEED));

    if (limb.isLeg) {
      const ref = referenceControl(limb, phase01, amp);
      const he = limb.hip.getJointAngle() - toJoint(ref.hip);
      const ke = limb.knee.getJointAngle() - ref.knee;
      refErr += he * he + ke * ke;
    }
  }

  walker.torso.applyTorque(-BALANCE_KP * tilt - BALANCE_KD * walker.torso.getAngularVelocity());

  walker.world.step(DT, VEL_ITERS, POS_ITERS);
  updateContacts(walker);

  // Tally per-leg ground time (diagnostics: a real gait alternates evenly).
  for (const l of walker.limbs) if (l.isLeg && walker.grounded[l.index]) walker.contact[l.index] += 1;

  // Per-tick imitation reward: 1 when both legs sit on the reference stride,
  // falling off smoothly as the pose drifts (4 leg joints in the mse).
  walker.imit += Math.exp((-IMIT_SHARPNESS * refErr) / 4);

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

  // Fitness = stride imitation, multiplied up by grounded forward distance.
  // Tracking the reference is the only source of reward (so there is a smooth
  // gradient from the first flailing generation), and covering ground while
  // tracking multiplies it (so slipping in place converges to a real walk).
  walker.fitness = (walker.imit / IMIT_SCALE) * (1 + walker.dist);

  if (Math.abs(tilt) > FALL_ANGLE) walker.alive = false;
}
