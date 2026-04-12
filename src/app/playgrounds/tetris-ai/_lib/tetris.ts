const ROWS = 20;
const COLS = 10;

// Piece matrices from tetris-gymnasium (exact match for model compatibility)
// Order: I(id=2), O(id=3), T(id=4), S(id=5), Z(id=6), J(id=7), L(id=8)
// Each piece has 4 rotations (original, CW, 180, CCW)
const TETROMINOES: boolean[][][][] = [
  // I (id=2)
  [
    [[false,false,false,false],[true,true,true,true],[false,false,false,false],[false,false,false,false]],
    [[false,true,false,false],[false,true,false,false],[false,true,false,false],[false,true,false,false]],
    [[false,false,false,false],[false,false,false,false],[true,true,true,true],[false,false,false,false]],
    [[false,false,true,false],[false,false,true,false],[false,false,true,false],[false,false,true,false]],
  ],
  // O (id=3)
  [
    [[true,true],[true,true]],
    [[true,true],[true,true]],
    [[true,true],[true,true]],
    [[true,true],[true,true]],
  ],
  // T (id=4)
  [
    [[false,true,false],[true,true,true],[false,false,false]],
    [[false,true,false],[true,true,false],[false,true,false]],
    [[false,false,false],[true,true,true],[false,true,false]],
    [[false,true,false],[false,true,true],[false,true,false]],
  ],
  // S (id=5)
  [
    [[false,true,true],[true,true,false],[false,false,false]],
    [[true,false,false],[true,true,false],[false,true,false]],
    [[false,false,false],[false,true,true],[true,true,false]],
    [[false,true,false],[false,true,true],[false,false,true]],
  ],
  // Z (id=6)
  [
    [[true,true,false],[false,true,true],[false,false,false]],
    [[false,true,false],[true,true,false],[true,false,false]],
    [[false,false,false],[true,true,false],[false,true,true]],
    [[false,false,true],[false,true,true],[false,true,false]],
  ],
  // J (id=7)
  [
    [[true,false,false],[true,true,true],[false,false,false]],
    [[false,true,false],[false,true,false],[true,true,false]],
    [[false,false,false],[true,true,true],[false,false,true]],
    [[false,true,true],[false,true,false],[false,true,false]],
  ],
  // L (id=8)
  [
    [[false,false,true],[true,true,true],[false,false,false]],
    [[true,true,false],[false,true,false],[false,true,false]],
    [[false,false,false],[true,true,true],[true,false,false]],
    [[false,true,false],[false,true,false],[false,true,true]],
  ],
];

export { ROWS, COLS, TETROMINOES };

export interface Placement {
  pieceIdx: number;
  rotation: number;
  col: number;
  row: number;
  features: [number, number, number, number]; // lines, holes, bumpiness, height
}

export class TetrisGame {
  board: number[][]; // 0 = empty, 1-7 = piece color
  currentPiece: number;
  nextPiece: number;
  score: number;
  linesCleared: number;
  piecesPlaced: number;
  gameOver: boolean;

  constructor() {
    this.board = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    this.currentPiece = Math.floor(Math.random() * 7);
    this.nextPiece = Math.floor(Math.random() * 7);
    this.score = 0;
    this.linesCleared = 0;
    this.piecesPlaced = 0;
    this.gameOver = false;
  }

  private collision(piece: boolean[][], col: number, row: number): boolean {
    for (let r = 0; r < piece.length; r++) {
      for (let c = 0; c < piece[r].length; c++) {
        if (!piece[r][c]) continue;
        const boardR = row + r;
        const boardC = col + c;
        if (boardR < 0 || boardR >= ROWS || boardC < 0 || boardC >= COLS) return true;
        if (this.board[boardR][boardC] !== 0) return true;
      }
    }
    return false;
  }

  getValidPlacements(): Placement[] {
    const placements: Placement[] = [];
    const seen = new Set<string>();
    const rotations = TETROMINOES[this.currentPiece];

    for (let rot = 0; rot < 4; rot++) {
      const piece = rotations[rot];
      const pieceH = piece.length;
      const pieceW = piece[0].length;

      for (let col = -2; col <= COLS; col++) {
        if (this.collision(piece, col, 0)) continue;

        // Drop to lowest valid row
        let row = 0;
        while (!this.collision(piece, col, row + 1)) row++;

        // Simulate placement
        const boardCopy = this.board.map((r) => [...r]);
        for (let r = 0; r < pieceH; r++) {
          for (let c = 0; c < pieceW; c++) {
            if (piece[r][c]) {
              boardCopy[row + r][col + c] = this.currentPiece + 1;
            }
          }
        }

        // Clear lines
        let lines = 0;
        const cleaned: number[][] = [];
        for (let r = 0; r < ROWS; r++) {
          if (boardCopy[r].every((c) => c !== 0)) {
            lines++;
          } else {
            cleaned.push(boardCopy[r]);
          }
        }
        const resultBoard = [
          ...Array.from({ length: ROWS - cleaned.length }, () => new Array(COLS).fill(0)),
          ...cleaned,
        ];

        // Deduplicate
        const key = resultBoard.flat().join(",");
        if (seen.has(key)) continue;
        seen.add(key);

        const features = computeFeatures(resultBoard, lines);
        placements.push({
          pieceIdx: this.currentPiece,
          rotation: rot,
          col,
          row,
          features,
        });
      }
    }

    return placements;
  }

  executePlacement(placement: Placement): number {
    const piece = TETROMINOES[this.currentPiece][placement.rotation];

    // Place piece
    for (let r = 0; r < piece.length; r++) {
      for (let c = 0; c < piece[r].length; c++) {
        if (piece[r][c]) {
          this.board[placement.row + r][placement.col + c] = this.currentPiece + 1;
        }
      }
    }

    // Clear lines
    let lines = 0;
    const cleaned: number[][] = [];
    for (let r = 0; r < ROWS; r++) {
      if (this.board[r].every((c) => c !== 0)) {
        lines++;
      } else {
        cleaned.push(this.board[r]);
      }
    }
    if (lines > 0) {
      this.board = [
        ...Array.from({ length: ROWS - cleaned.length }, () => new Array(COLS).fill(0)),
        ...cleaned,
      ];
    }

    this.linesCleared += lines;
    this.piecesPlaced++;
    this.score += 1 + lines * lines * 10;

    // Next piece
    this.currentPiece = this.nextPiece;
    this.nextPiece = Math.floor(Math.random() * 7);

    // Check game over
    const nextPlacements = this.getValidPlacements();
    if (nextPlacements.length === 0) {
      this.gameOver = true;
    }

    return lines;
  }
}

function computeFeatures(
  board: number[][],
  linesCleared: number
): [number, number, number, number] {
  const heights = new Array(COLS).fill(0);
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c] !== 0) {
        heights[c] = ROWS - r;
        break;
      }
    }
  }

  let holes = 0;
  for (let c = 0; c < COLS; c++) {
    let found = false;
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c] !== 0) found = true;
      else if (found) holes++;
    }
  }

  let bumpiness = 0;
  for (let c = 0; c < COLS - 1; c++) {
    bumpiness += Math.abs(heights[c] - heights[c + 1]);
  }

  const totalHeight = heights.reduce((a, b) => a + b, 0);

  return [linesCleared, holes, bumpiness, totalHeight];
}
