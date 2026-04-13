/**
 * Minimal MLP implementation for training and inference.
 * No dependencies — just matrix math.
 */

export class MLP {
  weights: Float64Array[];
  biases: Float64Array[];
  layerSizes: number[];

  constructor(layerSizes: number[]) {
    this.layerSizes = layerSizes;
    this.weights = [];
    this.biases = [];

    for (let i = 0; i < layerSizes.length - 1; i++) {
      const fanIn = layerSizes[i];
      const fanOut = layerSizes[i + 1];
      // Xavier initialization
      const scale = Math.sqrt(2.0 / fanIn);
      const w = new Float64Array(fanIn * fanOut);
      for (let j = 0; j < w.length; j++) w[j] = (Math.random() * 2 - 1) * scale;
      this.weights.push(w);
      this.biases.push(new Float64Array(fanOut));
    }
  }

  forward(input: number[]): number {
    let x = Float64Array.from(input);

    for (let layer = 0; layer < this.weights.length; layer++) {
      const w = this.weights[layer];
      const b = this.biases[layer];
      const inSize = this.layerSizes[layer];
      const outSize = this.layerSizes[layer + 1];
      const y = new Float64Array(outSize);

      for (let o = 0; o < outSize; o++) {
        let sum = b[o];
        for (let i = 0; i < inSize; i++) {
          sum += x[i] * w[i * outSize + o];
        }
        // ReLU for hidden layers, linear for output
        y[o] = layer < this.weights.length - 1 ? Math.max(0, sum) : sum;
      }
      x = y;
    }

    return x[0];
  }

  forwardBatch(inputs: number[][]): number[] {
    return inputs.map((input) => this.forward(input));
  }

  /**
   * Train on a single sample. Returns the loss.
   * Uses simple gradient descent with backprop.
   */
  trainStep(input: number[], target: number, lr: number): number {
    // Forward pass — store activations
    const activations: Float64Array[] = [Float64Array.from(input)];
    const preActivations: Float64Array[] = [];

    let x = activations[0];
    for (let layer = 0; layer < this.weights.length; layer++) {
      const w = this.weights[layer];
      const b = this.biases[layer];
      const inSize = this.layerSizes[layer];
      const outSize = this.layerSizes[layer + 1];
      const pre = new Float64Array(outSize);
      const post = new Float64Array(outSize);

      for (let o = 0; o < outSize; o++) {
        let sum = b[o];
        for (let i = 0; i < inSize; i++) sum += x[i] * w[i * outSize + o];
        pre[o] = sum;
        post[o] = layer < this.weights.length - 1 ? Math.max(0, sum) : sum;
      }
      preActivations.push(pre);
      activations.push(post);
      x = post;
    }

    const prediction = x[0];
    const loss = (prediction - target) ** 2;

    // Backward pass
    let delta = new Float64Array([2 * (prediction - target)]);

    for (let layer = this.weights.length - 1; layer >= 0; layer--) {
      const inSize = this.layerSizes[layer];
      const outSize = this.layerSizes[layer + 1];
      const act = activations[layer];
      const w = this.weights[layer];
      const b = this.biases[layer];

      // Apply ReLU derivative for hidden layers
      if (layer < this.weights.length - 1) {
        const pre = preActivations[layer];
        for (let o = 0; o < outSize; o++) {
          if (pre[o] <= 0) delta[o] = 0;
        }
      }

      // Compute gradients and propagate
      const nextDelta = new Float64Array(inSize);
      for (let i = 0; i < inSize; i++) {
        let grad = 0;
        for (let o = 0; o < outSize; o++) {
          const dw = act[i] * delta[o];
          w[i * outSize + o] -= lr * dw;
          grad += w[i * outSize + o] * delta[o];
        }
        nextDelta[i] = grad;
      }

      for (let o = 0; o < outSize; o++) {
        b[o] -= lr * delta[o];
      }

      delta = nextDelta;
    }

    return loss;
  }

  serialize(): string {
    return JSON.stringify({
      layerSizes: this.layerSizes,
      weights: this.weights.map((w) => Array.from(w)),
      biases: this.biases.map((b) => Array.from(b)),
    });
  }

  static deserialize(json: string): MLP {
    const data = JSON.parse(json);
    const mlp = new MLP(data.layerSizes);
    mlp.weights = data.weights.map((w: number[]) => Float64Array.from(w));
    mlp.biases = data.biases.map((b: number[]) => Float64Array.from(b));
    return mlp;
  }
}
