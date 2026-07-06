// The hand-authored reference stride: target hip/knee angles over one gait
// cycle. This is what "walking" *means* to the fitness function - controllers
// are rewarded for tracking it while covering ground, which is what finally
// stopped the optimiser inventing scoots and drags (no reward tweak ever
// defined the shape of a gait; this does).
//
// The cycle is authored as a FOOT PATH and turned into joint angles with
// two-segment IK, so ground contact is kinematically consistent: during
// stance (~60% of the cycle) the foot slides straight back along the floor
// at a fixed hip height, during swing it lifts and reaches forward. Authoring
// joint sinusoids directly was tried first and failed - at stride extremes a
// near-straight leg is too short to reach the floor, so the walker went
// airborne and fell.

// Fraction of the cycle spent in stance (foot on the ground).
export const STANCE_END = 0.5;
// Hip height the stance leg maintains (leg segments are 0.4 + 0.4; a touch
// of knee bend keeps the reach real across the whole stride - at the stride
// extremes the hip->foot distance must stay comfortably under 0.8).
export const HIP_HEIGHT = 0.72;
// Stride length: how far the foot travels along the ground per step.
export const STRIDE = 0.44;
// Peak foot lift during swing.
export const FOOT_LIFT = 0.14;
// Whole foot path shifted fore/aft of the hip. Slightly aft keeps the body's
// weight a touch ahead of the feet, which is what drives the walk forward
// (walking is controlled falling; a forward offset made it drift backward).
export const FOOT_FORWARD = -0.06;
// Leg segment length (matches FIXED_MORPH's legs).
const SEG = 0.4;

export interface JointTargets {
  hip: number; // thigh angle from vertical, + = forward
  knee: number; // knee fold from straight, - = heel back
}

// Where the foot should be relative to the hip (x forward, y up) at a phase
// in [0, 1). Phase 0 is heel-strike: foot planted a half-stride ahead. `amp`
// scales the stride and lift: 0 stands still in the crouch, 1 is the full
// stride (used to ramp the gait in from standing).
function footPath(p: number, amp: number): { x: number; y: number } {
  if (p < STANCE_END) {
    const u = p / STANCE_END;
    return { x: (STRIDE * (0.5 - u) + FOOT_FORWARD) * amp, y: -HIP_HEIGHT };
  }
  const u = (p - STANCE_END) / (1 - STANCE_END);
  return {
    x: (STRIDE * (u - 0.5) + FOOT_FORWARD) * amp,
    y: -HIP_HEIGHT + FOOT_LIFT * Math.sin(Math.PI * u) * amp,
  };
}

// Two-segment IK, knee pointing forward like a human's: thigh sits half the
// fold angle ahead of the hip->foot line, shank the same behind it.
export function referencePose(phase: number, amp = 1): JointTargets {
  const p = phase - Math.floor(phase);
  const { x, y } = footPath(p, amp);
  const r = Math.min(Math.hypot(x, y), 2 * SEG * 0.995);
  const phi = Math.atan2(x, -y); // hip->foot direction, from straight down
  const beta = Math.acos(r / (2 * SEG));
  return { hip: phi + beta, knee: -2 * beta };
}
