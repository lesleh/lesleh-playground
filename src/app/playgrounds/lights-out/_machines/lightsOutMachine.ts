import { createMachine, assign, type StateValue } from "xstate";

type LightsOutContext = {
  board: boolean[][];
  randomizeCount: number;
};

type LightsOutEvents =
  | { type: "TOGGLE_LIGHT"; row: number; col: number }
  | { type: "RESET" }
  | { type: "RANDOMIZE" }
  | { type: "RANDOM_TOGGLE" };

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

  for (let i = 0; i < 10; i++) {
    const row = Math.floor(Math.random() * 5);
    const col = Math.floor(Math.random() * 5);
    board = togglePositions(board, row, col);
  }

  return board;
};

export const lightsOutMachine = createMachine(
  {
    types: {} as {
      context: LightsOutContext;
      events: LightsOutEvents;
      value: "playing" | "won" | "randomizing";
    },
    id: "lightsOut",
    initial: "playing",
    context: {
      board: initializeBoard(),
      randomizeCount: 0,
    },
    states: {
      playing: {
        on: {
          TOGGLE_LIGHT: [
            {
              target: "won",
              guard: "isWon",
              actions: "toggleLight",
            },
            {
              target: "playing",
              guard: "isNotWon",
              actions: "toggleLight",
            },
          ],
          RESET: {
            actions: "resetBoard",
          },
          RANDOMIZE: {
            target: "randomizing",
            actions: "clearBoard",
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
            },
          ],
        },
      },
      won: {
        on: {
          RESET: {
            target: "playing",
            actions: "resetBoard",
          },
        },
      },
    },
  },
  {
    actions: {
      toggleLight: assign(({ context, event }) => {
        if (event.type !== "TOGGLE_LIGHT") return context;
        const { row, col } = event;
        return {
          ...context,
          board: togglePositions(context.board, row, col),
        };
      }),
      resetBoard: assign(() => ({
        board: initializeBoard(),
        randomizeCount: 0,
      })),
      clearBoard: assign(() => ({
        board: Array(5)
          .fill(null)
          .map(() => Array(5).fill(false)),
        randomizeCount: 0,
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
    },
  },
);
