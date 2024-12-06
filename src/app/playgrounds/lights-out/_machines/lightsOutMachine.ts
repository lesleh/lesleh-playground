import { createMachine } from "xstate";

function createRandomBoard(rows: number, cols: number) {
  const grid = [] as number[][];
  for (let i = 0; i < rows; i++) {
    grid.push([]);
    for (let j = 0; j < cols; j++) {
      grid[i].push(Math.round(Math.random()));
    }
  }
  return grid;
}

export const lightsOutMachine = createMachine({
  predictableActionArguments: true,
  id: "lightsOut",
  initial: "playing",
  context: {
    grid: createRandomBoard(5, 5),
  },
  states: {
    playing: {
      on: {
        TOGGLE: {
          actions: (ctx, event) => {
            const { row, col } = event.coordinates;
            const newGrid = [...ctx.grid];
            newGrid[row][col] = newGrid[row][col] === 0 ? 1 : 0;

            // toggle the lights above
            if (row - 1 >= 0) {
              newGrid[row - 1][col] = newGrid[row - 1][col] === 0 ? 1 : 0;
            }

            // toggle the lights below
            if (row + 1 < ctx.grid.length) {
              newGrid[row + 1][col] = newGrid[row + 1][col] === 0 ? 1 : 0;
            }

            // toggle the lights to the left
            if (col - 1 >= 0) {
              newGrid[row][col - 1] = newGrid[row][col - 1] === 0 ? 1 : 0;
            }

            // toggle the lights to the right
            if (col + 1 < ctx.grid[0].length) {
              newGrid[row][col + 1] = newGrid[row][col + 1] === 0 ? 1 : 0;
            }

            return {
              ...ctx,
              grid: newGrid,
            };
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
        return ctx.grid.every((row) => row.every((light) => light === 0));
      },
    },
  ],
});
