// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useMachine } from "@xstate/react";
import { numberGuessingGameMachine } from "../../_machines/numberGuessingGameMachine";

const NumberGuesser = () => {
  const [userGuess, setUserGuess] = useState("");
  const [state, send] = useMachine(numberGuessingGameMachine);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = parseInt(userGuess);
    if (!isNaN(guess)) {
      send({ type: "GUESS", value: guess });
      setUserGuess("");
    }
  };

  return (
    <div className="grid items-center justify-center h-full">
      <div className="p-7 m-3 md:border md:border-solid md:border-gray-200 md: rounded-lg md:shadow-md">
        <h1 className="text-2xl font-bold mb-4">
          Number Guesser (between 1 and 100)
        </h1>

        {state.matches("idle") && (
          <button
            onClick={() => send({ type: "START" })}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Start Game
          </button>
        )}

        {(state.matches("playing") || state.matches("won")) && (
          <div className="space-y-4">
            <div>Previous guesses: {state.context.guesses.join(", ")}</div>

            {state.matches("playing") && (
              <form onSubmit={handleSubmit} className="flex items-stretch">
                <input
                  type="number"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  className="border rounded flex-grow p-2"
                  min="1"
                  max="100"
                />
                <button
                  disabled={userGuess === ""}
                  type="submit"
                  className="disabled:bg-neutral-500 bg-green-500 text-white px-4 py-2 rounded ml-2"
                >
                  Guess
                </button>
              </form>
            )}

            {state.context.lastGuessStatus && state.matches("playing") && (
              <div>Your guess was too {state.context.lastGuessStatus}!</div>
            )}

            {state.matches("won") && (
              <div className="text-green-500 font-bold">
                Congratulations! You won in {state.context.guesses.length}{" "}
                guesses!
              </div>
            )}

            <button
              onClick={() => send({ type: "RESET" })}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Reset Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { NumberGuesser };
