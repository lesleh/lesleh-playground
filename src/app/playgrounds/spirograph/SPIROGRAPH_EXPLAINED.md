# The Mathematics and Implementation of a Spirograph

## Introduction

A spirograph is a mesmerizing geometric drawing tool that creates intricate mathematical curves called **roulettes**. The classic toy spirograph uses plastic gears and wheels to create these patterns, but the underlying mathematics is beautifully elegant. This post explores both the mathematical theory behind spirographs and how they can be implemented in code.

## The Mathematical Foundation

### What is a Roulette?

A roulette is a curve traced by a point attached to a curve as it rolls along another curve. In the case of a spirograph, we have:
- A **fixed circle** with radius $R$ (the outer ring in the toy)
- A **rolling circle** with radius $r$ (the smaller gear)
- A **pen point** at distance $d$ from the center of the rolling circle

### Two Types of Spirograph Curves

#### 1. Hypotrochoid (Inside Mode)

When the smaller circle rolls **inside** the larger circle, we get a **hypotrochoid**. The parametric equations are:

$$
\begin{align}
x(t) &= (R - r) \cos(t) + d \cos\left(\frac{R - r}{r} t\right) \\
y(t) &= (R - r) \sin(t) - d \sin\left(\frac{R - r}{r} t\right)
\end{align}
$$

Where:
- $R$ is the radius of the fixed circle
- $r$ is the radius of the rolling circle
- $d$ is the distance from the center of the rolling circle to the pen
- $t$ is the parameter (angle in radians)

**Special case:** When $d = r$, the hypotrochoid becomes a **hypocycloid** (the pen is on the circumference of the rolling circle).

#### 2. Epitrochoid (Outside Mode)

When the smaller circle rolls **outside** the larger circle, we get an **epitrochoid**. The parametric equations are:

$$
\begin{align}
x(t) &= (R + r) \cos(t) - d \cos\left(\frac{R + r}{r} t\right) \\
y(t) &= (R + r) \sin(t) - d \sin\left(\frac{R + r}{r} t\right)
\end{align}
$$

**Special case:** When $d = r$, the epitrochoid becomes an **epicycloid**.

### Understanding the Mechanics

Let's break down what's happening:

1. **The rolling circle's center** moves along a circle of radius $k$:
   - For inside mode: $k = R - r$
   - For outside mode: $k = R + r$

2. **The rotation angle** of the rolling circle is $\phi = \frac{k}{r} t$
   - This accounts for how much the circle has rotated as it rolls

3. **The pen point** traces an offset from the rolling circle's center by distance $d$

### When Does the Pattern Close?

A spirograph pattern closes (returns to its starting point) after the rolling circle completes an integer number of rotations. The number of rotations needed is:

$$
\text{rotations} = \frac{r}{\gcd(R, r)}
$$

Where $\gcd(R, r)$ is the greatest common divisor of $R$ and $r$. 

**Example:**
- If $R = 105$ and $r = 70$, then $\gcd(105, 70) = 35$
- Rotations needed = $70 / 35 = 2$
- The pattern completes after 2 full rotations of the rolling circle

This means:
- If $\gcd(R, r) = 1$ (coprime), the pattern has many petals
- If $\gcd(R, r)$ is large, the pattern has fewer, larger petals

## The Implementation

### Core Algorithm Structure

The implementation follows these key steps:

1. **Calculate the parametric points** along the curve
2. **Determine when the pattern completes** using GCD
3. **Render the curve** progressively on a canvas

### 1. The Point Calculation Function

```typescript
const spiroPoint = (t: number, params: SpiroParams): Point => {
  const { mode, R, r, d } = params;

  if (mode === "inside") {
    const k = R - r;
    const cx = k * Math.cos(t);
    const cy = k * Math.sin(t);
    const phi = (k / r) * t;
    const x = cx + d * Math.cos(-phi);
    const y = cy + d * Math.sin(-phi);
    return { x, y };
  } else {
    const k = R + r;
    const cx = k * Math.cos(t);
    const cy = k * Math.sin(t);
    const phi = (k / r) * t;
    const x = cx - d * Math.cos(phi);
    const y = cy - d * Math.sin(phi);
    return { x, y };
  }
};
```

**Key observations:**
- `k` is the radius of the path that the rolling circle's center follows
- `(cx, cy)` is the position of the rolling circle's center at angle `t`
- `phi` is the rotation angle of the rolling circle itself
- The final point adds the pen offset from the circle's center

### 2. Determining the Complete Path

```typescript
const computePath = (params: SpiroParams) => {
  const g = gcd(params.R, params.r);
  const turnsToComplete = params.r / g;
  const tMax = Math.PI * 2 * turnsToComplete;
  const n = 6000;
  const pts = new Array(n);

  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * tMax;
    pts[i] = spiroPoint(t, params);
  }
  return pts;
};
```

**Why this works:**
- We calculate how many full rotations are needed using the GCD
- `tMax = 2π * (r / gcd(R, r))` gives us the angle to complete the pattern
- We sample 6000 points evenly distributed across this range
- This ensures smooth curves even for complex patterns

### 3. The GCD Function

```typescript
const gcd = (a: number, b: number) => {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
};
```

This uses the **Euclidean algorithm** to find the greatest common divisor, which is crucial for determining when the pattern completes.

### 4. Rendering Multiple Spirographs

The implementation supports **multiple overlapping spirographs**, each with its own color and parameters:

```typescript
const allPaths = circles.map((circle) =>
  computePath({ mode, R, r: circle.r, d: circle.d })
);

circles.forEach((circle, idx) => {
  const pts = allPaths[idx];
  const count = Math.max(1, Math.ceil(progress * pts.length));

  ctx.lineWidth = 2.5 / view.scale;
  ctx.strokeStyle = circle.color;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < count; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
});
```

### 5. Visualizing the Mechanism

The "Show guide circles" feature reveals the underlying geometry:

```typescript
if (showCircles) {
  // Draw the large outer circle (R)
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  
  // For each rolling circle, calculate its current position
  const k = mode === "inside" ? R - circle.r : R + circle.r;
  const cx = k * Math.cos(t);
  const cy = k * Math.sin(t);
  
  // Draw the rolling circle at its current position
  ctx.arc(cx, cy, circle.r, 0, Math.PI * 2);
  
  // Draw a line from center to pen point
  ctx.moveTo(cx, cy);
  ctx.lineTo(cur.x, cur.y);
}
```

This visualization helps users understand:
- How the rolling circle moves along its path
- Where the pen point is relative to the circle's center
- Why different parameters create different patterns

## Interesting Parameter Relationships

### Petal Count

The number of "petals" or cusps in a spirograph is related to:

$$
\text{petals} = \frac{R}{\gcd(R, r)}
$$

### Symmetry

When $R$ and $r$ are coprime (their GCD is 1), the pattern fills the entire annulus before completing.

### Distance Parameter $d$

- When $d = 0$: the pen is at the center of the rolling circle, creating a simple circle
- When $d = r$: the pen is on the circumference (classic hypocycloid/epicycloid)
- When $d > r$: the pen extends beyond the circle, creating loops and complex shapes

## Performance Considerations

### Point Sampling

The implementation uses 6000 points per curve. This is a balance between:
- **Smoothness**: More points = smoother curves
- **Performance**: Fewer points = faster rendering

For typical spirographs, 6000 points provides excellent visual quality without performance issues.

### Canvas Scaling

The implementation uses device pixel ratio scaling to ensure crisp rendering on high-DPI displays:

```typescript
const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
canvas.width = Math.round(rect.width * dpr);
canvas.height = Math.round(rect.height * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```

### Auto-Centering

The viewport automatically centers on all curves by:
1. Computing the bounding box of all points
2. Calculating the optimal scale to fit everything with padding
3. Transforming the canvas coordinate system

This ensures patterns of any size are properly displayed.

## Conclusion

Spirographs are a perfect example of how simple mathematical rules can create extraordinary complexity. The parametric equations for hypotrochoids and epitrochoids are surprisingly straightforward, yet they produce an infinite variety of beautiful patterns.

The implementation demonstrates how mathematical theory translates directly into code:
- Parametric equations become functions
- GCD determines pattern completion
- Canvas transformations handle rendering

By exposing the underlying circles and mechanisms, we can see the mathematics in action—the rolling circles, the pen offset, and how these simple motions combine to create intricate geometric art.

## Further Exploration

Want to dive deeper? Try:

1. **Experiment with the GCD**: Try parameters where $\gcd(R, r) = 1$ vs. larger values
2. **Extreme values**: Set $d$ much larger than $r$ to create wild loops
3. **Multiple circles**: Layer several spirographs with different colors
4. **Animation**: Adjust the progress slider to watch the patterns form

The beauty of spirographs lies in their predictability and their mystery—we know exactly what creates them, yet their patterns still surprise and delight us.
