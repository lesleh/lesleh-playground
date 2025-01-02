import { assign, createMachine } from "xstate";

type NumberGuessingGameContext = {
  guesses: number[];
  numberToGuess: number;
  lastGuessStatus: "low" | "high" | "correct" | undefined;
};

type NumberGuessingGameEvent =
  | { type: "START" }
  | { type: "GUESS"; value: number }
  | { type: "RESET" };

export const numberGuessingGameMachine = createMachine(
  {
    types: {} as {
      context: NumberGuessingGameContext;
      events: NumberGuessingGameEvent;
    },
    id: "numberGuessingGame",
    initial: "idle",
    context: {
      guesses: [],
      numberToGuess: Math.floor(Math.random() * 100) + 1,
      lastGuessStatus: undefined,
    },
    states: {
      idle: {
        on: {
          START: "starting",
        },
      },
      starting: {
        entry: "startGame",
        always: "playing",
      },
      playing: {
        on: {
          GUESS: [
            {
              guard: "isCorrectGuess",
              target: "won",
              actions: "addGuess",
            },
            {
              target: "playing",
              actions: "addGuess",
            },
          ],
          RESET: {
            target: "idle",
            actions: "resetGame",
          },
        },
      },
      won: {
        on: {
          RESET: {
            target: "idle",
            actions: "resetGame",
          },
        },
      },
    },
  },
  {
    actions: {
      resetGame: assign({
        guesses: [],
        numberToGuess: () => Math.floor(Math.random() * 100) + 1,
        lastGuessStatus: undefined,
      }),
      startGame: assign({
        numberToGuess: (context) => Math.floor(Math.random() * 101),
        lastGuessStatus: undefined,
      }),
      addGuess: assign({
        guesses: ({ context, event }) => {
          if (event.type === "GUESS") {
            return [...context.guesses, event.value];
          }
          return context.guesses;
        },
        lastGuessStatus: ({ context, event }) => {
          if (event.type === "GUESS") {
            if (event.value < context.numberToGuess) {
              return "low";
            }
            if (event.value > context.numberToGuess) {
              return "high";
            }
            return "correct";
          }
          return undefined;
        },
      }),
      addLastGuessStatus: assign({
        lastGuessStatus: ({ context, event }) => {
          if (event.type === "GUESS") {
            if (event.value < context.numberToGuess) {
              return "low";
            }
            if (event.value > context.numberToGuess) {
              return "high";
            }
            return "correct";
          }
          return undefined;
        },
      }),
    },
    guards: {
      isCorrectGuess: ({ context, event }) => {
        if (event.type === "GUESS") {
          return event.value === context.numberToGuess;
        }
        return false;
      },
    },
  },
);

export default numberGuessingGameMachine;
