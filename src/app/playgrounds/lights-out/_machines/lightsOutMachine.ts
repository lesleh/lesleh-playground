import { createMachine, assign, type StateValue } from "xstate";

type LightsOutContext = {
  board: boolean[][];
  randomizeCount: number;
  solution: Array<[number, number]>;
  solutionIndex: number;
  moveCount: number;
  showSolution: boolean;
};

type LightsOutEvents =
  | { type: "START" }
  | { type: "TOGGLE_LIGHT"; row: number; col: number }
  | { type: "RESET" }
  | { type: "RANDOMIZE" }
  | { type: "RANDOM_TOGGLE" }
  | { type: "SOLVE" }
  | { type: "TOGGLE_SHOW_SOLUTION"; show: boolean };

const togglePositions = (board: boolean[][], row: number, col: number) => {
  const newBoard = board.map((r) => [...r]);
  const positions = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  positions.forEach(([r, c]) => {
    if (r >= 0 && r < 5 && c >= 0 && c < 5) {
      newBoard[r][c] = !newBoard[r][c];
    }
  });
  return newBoard;
};

const initializeBoard = () => {
  let board = Array(5)
    .fill(null)
    .map(() => Array(5).fill(false));
  return board;
};

const findSolution = (board: boolean[][]) => {
  // Convert board to linear system
  const n = 25; // 5x5 board
  const matrix: number[][] = [];
  const vector: number[] = [];

  // Create coefficient matrix and result vector
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const row = new Array(25).fill(0);
      // Set coefficients for current position and adjacent positions
      const pos = i * 5 + j;
      row[pos] = 1;
      if (i > 0) row[(i - 1) * 5 + j] = 1;
      if (i < 4) row[(i + 1) * 5 + j] = 1;
      if (j > 0) row[i * 5 + (j - 1)] = 1;
      if (j < 4) row[i * 5 + (j + 1)] = 1;
      matrix.push(row);
      vector.push(board[i][j] ? 1 : 0);
    }
  }

  // Gaussian elimination mod 2
  for (let i = 0; i < n; i++) {
    // Find pivot
    let pivot = -1;
    for (let j = i; j < n; j++) {
      if (matrix[j][i] === 1) {
        pivot = j;
        break;
      }
    }
    if (pivot === -1) continue;

    // Swap rows if necessary
    if (pivot !== i) {
      [matrix[i], matrix[pivot]] = [matrix[pivot], matrix[i]];
      [vector[i], vector[pivot]] = [vector[pivot], vector[i]];
    }

    // Eliminate column
    for (let j = 0; j < n; j++) {
      if (i !== j && matrix[j][i] === 1) {
        for (let k = i; k < n; k++) {
          matrix[j][k] = matrix[j][k] ^ matrix[i][k]; // XOR operation
        }
        vector[j] = vector[j] ^ vector[i];
      }
    }
  }

  // Convert solution back to moves
  const solution: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    if (vector[i] === 1) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      solution.push([row, col]);
    }
  }

  return solution;
};

export const lightsOutMachine = createMachine(
  {
    types: {} as {
      context: LightsOutContext;
      events: LightsOutEvents;
      value: "idle" | "playing" | "won" | "randomizing" | "solving";
    },
    id: "lightsOut",
    initial: "idle",
    context: {
      board: initializeBoard(),
      randomizeCount: 0,
      solution: [],
      solutionIndex: 0,
      moveCount: 0,
      showSolution: false,
    },
    states: {
      idle: {
        on: {
          START: "randomizing",
        },
      },
      playing: {
        on: {
          TOGGLE_SHOW_SOLUTION: {
            actions: "toggleShowSolution",
          },
          TOGGLE_LIGHT: [
            {
              target: "won",
              guard: "isWon",
              actions: ["toggleLight", "resetSolution"],
            },
            {
              target: "playing",
              guard: "isNotWon",
              actions: ["toggleLight", "prepareSolution"],
            },
          ],
          RANDOMIZE: {
            target: "randomizing",
            actions: "clearBoard",
          },
          SOLVE: {
            target: "solving",
            actions: "prepareSolution",
          },
        },
      },
      randomizing: {
        after: {
          100: [
            {
              target: "randomizing",
              guard: "isStillRandomizing",
              actions: "randomToggle",
              reenter: true,
            },
            {
              target: "playing",
              actions: "prepareSolution",
            },
          ],
        },
      },
      solving: {
        after: {
          200: [
            {
              target: "solving",
              guard: "hasMoreMoves",
              actions: "executeNextMove",
              reenter: true,
            },
            {
              target: "won",
              actions: "resetSolution",
            },
          ],
        },
      },
      won: {
        entry: () => {
          import("canvas-confetti").then((module) => {
            const confetti = module.default;
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          });
        },
        on: {
          RESET: {
            target: "randomizing",
            actions: "clearBoard",
          },
        },
      },
    },
  },
  {
    actions: {
      toggleShowSolution: assign(({ context, event }) => {
        console.log("toggleShowSolution", event);
        if (event.type !== "TOGGLE_SHOW_SOLUTION") return context;
        return {
          ...context,
          showSolution: event.show,
        };
      }),
      toggleLight: assign(({ context, event }) => {
        if (event.type !== "TOGGLE_LIGHT") return context;
        const { row, col } = event;
        return {
          ...context,
          board: togglePositions(context.board, row, col),
          moveCount: context.moveCount + 1,
        };
      }),
      clearBoard: assign(() => ({
        board: Array(5)
          .fill(null)
          .map(() => Array(5).fill(false)),
        randomizeCount: 0,
        moveCount: 0,
      })),
      randomToggle: assign(({ context }) => {
        const row = Math.floor(Math.random() * 5);
        const col = Math.floor(Math.random() * 5);
        return {
          ...context,
          board: togglePositions(context.board, row, col),
          randomizeCount: context.randomizeCount + 1,
        };
      }),
      prepareSolution: assign(({ context }) => ({
        ...context,
        solution: findSolution(context.board),
        solutionIndex: 0,
      })),
      resetSolution: assign(({ context }) => ({
        ...context,
        solution: [],
        solutionIndex: 0,
      })),
      executeNextMove: assign(({ context }) => {
        const [row, col] = context.solution[context.solutionIndex];
        return {
          ...context,
          board: togglePositions(context.board, row, col),
          solutionIndex: context.solutionIndex + 1,
          moveCount: context.moveCount + 1,
        };
      }),
    },
    guards: {
      isWon: ({ context, event }) => {
        if (event.type !== "TOGGLE_LIGHT") return false;
        const { row, col } = event;
        const newBoard = togglePositions(context.board, row, col);
        return newBoard.every((row) => row.every((cell) => !cell));
      },
      isNotWon: ({ context, event }) => {
        if (event.type !== "TOGGLE_LIGHT") return true;
        const { row, col } = event;
        const newBoard = togglePositions(context.board, row, col);
        return !newBoard.every((row) => row.every((cell) => !cell));
      },
      isStillRandomizing: ({ context }) => context.randomizeCount < 10,
      hasMoreMoves: ({ context }) =>
        context.solutionIndex < context.solution.length,
    },
  },
);
