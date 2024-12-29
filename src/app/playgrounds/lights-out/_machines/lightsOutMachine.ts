import { createMachine, assign, type StateValue } from "xstate";

type LightsOutContext = {
  board: boolean[][];
};

type LightsOutEvents =
  | { type: "TOGGLE_LIGHT"; row: number; col: number }
  | { type: "RESET" };

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
  const board = Array(5)
    .fill(null)
    .map(() => Array(5).fill(true));
  return board;
};

export const lightsOutMachine = createMachine(
  {
    types: {} as {
      context: LightsOutContext;
      events: LightsOutEvents;
      value: "playing" | "won";
    },
    id: "lightsOut",
    initial: "playing",
    context: {
      board: initializeBoard(),
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
          board: togglePositions(context.board, row, col),
        };
      }),
      resetBoard: assign(() => ({
        board: initializeBoard(),
      })),
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
    },
  },
);
