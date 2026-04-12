import { Connect4, COLS } from "./game";
import { predict } from "./model";

class MCTSNode {
  game: Connect4;
  parent: MCTSNode | null;
  action: number | null;
  prior: number;
  children: MCTSNode[];
  visitCount: number;
  valueSum: number;

  constructor(
    game: Connect4,
    parent: MCTSNode | null = null,
    action: number | null = null,
    prior: number = 0
  ) {
    this.game = game;
    this.parent = parent;
    this.action = action;
    this.prior = prior;
    this.children = [];
    this.visitCount = 0;
    this.valueSum = 0;
  }

  get qValue(): number {
    if (this.visitCount === 0) return 0;
    return this.valueSum / this.visitCount;
  }

  isExpanded(): boolean {
    return this.children.length > 0;
  }

  selectChild(cPuct: number): MCTSNode {
    let totalVisits = 0;
    for (const c of this.children) totalVisits += c.visitCount;
    const sqrtTotal = Math.sqrt(totalVisits + 1);

    let bestScore = -Infinity;
    let bestChild = this.children[0];
    for (const child of this.children) {
      const q = -child.qValue;
      const u = cPuct * child.prior * sqrtTotal / (1 + child.visitCount);
      const score = q + u;
      if (score > bestScore) {
        bestScore = score;
        bestChild = child;
      }
    }
    return bestChild;
  }

  expand(policy: Float32Array): void {
    const legal = this.game.legalMoves();
    const masked = new Float32Array(COLS);
    let total = 0;
    for (const col of legal) {
      masked[col] = policy[col];
      total += policy[col];
    }
    if (total > 0) {
      for (const col of legal) masked[col] /= total;
    } else {
      for (const col of legal) masked[col] = 1 / legal.length;
    }

    for (const col of legal) {
      const childGame = this.game.copy();
      childGame.play(col);
      this.children.push(new MCTSNode(childGame, this, col, masked[col]));
    }
  }

  backpropagate(value: number): void {
    let node: MCTSNode | null = this;
    while (node !== null) {
      node.visitCount++;
      node.valueSum += value;
      value = -value;
      node = node.parent;
    }
  }
}

export async function mctsSearch(
  game: Connect4,
  numSimulations: number = 80,
  cPuct: number = 1.5
): Promise<{ policy: Float32Array; visits: Float32Array }> {
  const root = new MCTSNode(game.copy());

  const { policy } = await predict(root.game.encode());
  root.expand(policy);

  for (let i = 0; i < numSimulations; i++) {
    let node = root;

    while (node.isExpanded() && !node.game.isTerminal()) {
      node = node.selectChild(cPuct);
    }

    if (node.game.isTerminal()) {
      const winner = node.game.winner();
      const value = winner === null ? 0 : winner === node.game.currentPlayer ? 1 : -1;
      node.backpropagate(value);
      continue;
    }

    const result = await predict(node.game.encode());
    node.expand(result.policy);
    node.backpropagate(result.value);
  }

  const visits = new Float32Array(COLS);
  for (const child of root.children) {
    if (child.action !== null) visits[child.action] = child.visitCount;
  }

  let bestCol = 0;
  let bestVisits = 0;
  for (let c = 0; c < COLS; c++) {
    if (visits[c] > bestVisits) {
      bestVisits = visits[c];
      bestCol = c;
    }
  }
  const probs = new Float32Array(COLS);
  probs[bestCol] = 1;

  return { policy: probs, visits };
}
