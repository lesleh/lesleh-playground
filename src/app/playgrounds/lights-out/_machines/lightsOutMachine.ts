import { createMachine } from "xstate";

class LightsOutBoard {
  grid: number[][];

  constructor() {
    this.grid = this.#createBoard();
    this.toggleLight(2, 2);
  }

  #createBoard() {
    const grid = [] as number[][];
    for (let i = 0; i < 5; i++) {
      grid.push([]);
      for (let j = 0; j < 5; j++) {
        grid[i][j] = 0;
      }
    }
    return grid;
  }

  #isInBounds(row: number, col: number) {
    return (
      row >= 0 &&
      row < this.grid.length &&
      col >= 0 &&
      col < this.grid[0].length
    );
  }

  #createToggleList(row: number, col: number) {
    const toggleList = [] as [number, number][];
    const directions = [
      [0, 0],
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];

    for (const [rowOffset, colOffset] of directions) {
      const newRow = row + rowOffset;
      const newCol = col + colOffset;

      if (this.#isInBounds(newRow, newCol)) {
        toggleList.push([newRow, newCol]);
      }
    }

    return toggleList;
  }

  randomize() {
    this.grid = this.#createBoard();
    for (let i = 0; i < 10; i++) {
      const row = Math.floor(Math.random() * 5);
      const col = Math.floor(Math.random() * 5);
      this.toggleLight(row, col);
    }
  }

  toggleLight(row: number, col: number) {
    const toggleList = this.#createToggleList(row, col);
    for (const [row, col] of toggleList) {
      this.grid[row][col] = this.grid[row][col] === 0 ? 1 : 0;
    }
  }

  get isWon() {
    return this.grid.every((row) => row.every((light) => light === 0));
  }
}

export const lightsOutMachine = createMachine({
  predictableActionArguments: true,
  id: "lightsOut",
  initial: "playing",
  context: {
    grid: new LightsOutBoard(),
  },
  states: {
    playing: {
      on: {
        RANDOMIZE: {
          actions: (ctx) => {
            ctx.grid = new LightsOutBoard();
            ctx.grid.randomize();
          },
        },
        TOGGLE: {
          actions: (ctx, event) => {
            const { row, col } = event.coordinates;
            ctx.grid.toggleLight(row, col);
          },
        },
      },
    },
    won: {
      type: "final",
    },
  },
  always: [
    {
      target: "won",
      cond: (ctx) => {
        return ctx.grid.isWon;
      },
    },
  ],
});
