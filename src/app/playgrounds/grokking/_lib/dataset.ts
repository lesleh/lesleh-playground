// Every pair (a, b) with 0 <= a, b < p, labelled (a + b) mod p. Pair index is
// a * p + b, so the grid view can map straight from index to cell.
export interface Dataset {
  p: number;
  train: Int32Array;
  test: Int32Array;
  // 1 where the pair is in the training split, 0 otherwise. Indexed by pair.
  isTrain: Uint8Array;
}

export function label(pair: number, p: number): number {
  return (Math.floor(pair / p) + (pair % p)) % p;
}

export function makeDataset(p: number, trainFraction: number, rand: () => number): Dataset {
  const n = p * p;
  const order = new Int32Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = order[i];
    order[i] = order[j];
    order[j] = t;
  }
  const nTrain = Math.max(1, Math.min(n - 1, Math.round(n * trainFraction)));
  const train = order.slice(0, nTrain).sort();
  const test = order.slice(nTrain).sort();
  const isTrain = new Uint8Array(n);
  for (const i of train) isTrain[i] = 1;
  return { p, train, test, isTrain };
}
