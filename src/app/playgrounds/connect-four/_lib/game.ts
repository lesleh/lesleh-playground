const ROWS = 6;
const COLS = 7;
const WIN_LENGTH = 4;

export { ROWS, COLS };

export class Connect4 {
  board: Int8Array;
  currentPlayer: 1 | -1;
  lastMove: number | null;

  constructor() {
    this.board = new Int8Array(ROWS * COLS);
    this.currentPlayer = 1;
    this.lastMove = null;
  }

  get(row: number, col: number): number {
    return this.board[row * COLS + col];
  }

  private set(row: number, col: number, value: number): void {
    this.board[row * COLS + col] = value;
  }

  copy(): Connect4 {
    const g = new Connect4();
    g.board = new Int8Array(this.board);
    g.currentPlayer = this.currentPlayer;
    g.lastMove = this.lastMove;
    return g;
  }

  legalMoves(): number[] {
    const moves: number[] = [];
    for (let c = 0; c < COLS; c++) {
      if (this.get(0, c) === 0) moves.push(c);
    }
    return moves;
  }

  play(col: number): void {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.get(row, col) === 0) {
        this.set(row, col, this.currentPlayer);
        this.lastMove = col;
        this.currentPlayer = (this.currentPlayer === 1 ? -1 : 1) as 1 | -1;
        return;
      }
    }
    throw new Error(`Column ${col} is full`);
  }

  isTerminal(): boolean {
    return this.winner() !== null || this.legalMoves().length === 0;
  }

  winner(): number | null {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - WIN_LENGTH; c++) {
        let s = 0;
        for (let i = 0; i < WIN_LENGTH; i++) s += this.get(r, c + i);
        if (s === WIN_LENGTH) return 1;
        if (s === -WIN_LENGTH) return -1;
      }
    }
    for (let r = 0; r <= ROWS - WIN_LENGTH; r++) {
      for (let c = 0; c < COLS; c++) {
        let s = 0;
        for (let i = 0; i < WIN_LENGTH; i++) s += this.get(r + i, c);
        if (s === WIN_LENGTH) return 1;
        if (s === -WIN_LENGTH) return -1;
      }
    }
    for (let r = 0; r <= ROWS - WIN_LENGTH; r++) {
      for (let c = 0; c <= COLS - WIN_LENGTH; c++) {
        let s = 0;
        for (let i = 0; i < WIN_LENGTH; i++) s += this.get(r + i, c + i);
        if (s === WIN_LENGTH) return 1;
        if (s === -WIN_LENGTH) return -1;
      }
    }
    for (let r = 0; r <= ROWS - WIN_LENGTH; r++) {
      for (let c = WIN_LENGTH - 1; c < COLS; c++) {
        let s = 0;
        for (let i = 0; i < WIN_LENGTH; i++) s += this.get(r + i, c - i);
        if (s === WIN_LENGTH) return 1;
        if (s === -WIN_LENGTH) return -1;
      }
    }
    return null;
  }

  winningCells(): [number, number][] | null {
    const check = (getPos: (i: number) => [number, number]): [number, number][] | null => {
      const positions: [number, number][] = [];
      let s = 0;
      for (let i = 0; i < WIN_LENGTH; i++) {
        const pos = getPos(i);
        positions.push(pos);
        s += this.get(pos[0], pos[1]);
      }
      if (s === WIN_LENGTH || s === -WIN_LENGTH) return positions;
      return null;
    };

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c <= COLS - WIN_LENGTH; c++) {
        const result = check((i) => [r, c + i]);
        if (result) return result;
      }
    for (let r = 0; r <= ROWS - WIN_LENGTH; r++)
      for (let c = 0; c < COLS; c++) {
        const result = check((i) => [r + i, c]);
        if (result) return result;
      }
    for (let r = 0; r <= ROWS - WIN_LENGTH; r++)
      for (let c = 0; c <= COLS - WIN_LENGTH; c++) {
        const result = check((i) => [r + i, c + i]);
        if (result) return result;
      }
    for (let r = 0; r <= ROWS - WIN_LENGTH; r++)
      for (let c = WIN_LENGTH - 1; c < COLS; c++) {
        const result = check((i) => [r + i, c - i]);
        if (result) return result;
      }
    return null;
  }

  encode(): Float32Array {
    const state = new Float32Array(2 * ROWS * COLS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = this.get(r, c);
        const idx = r * COLS + c;
        if (val === this.currentPlayer) state[idx] = 1;
        if (val === -this.currentPlayer) state[ROWS * COLS + idx] = 1;
      }
    }
    return state;
  }
}
