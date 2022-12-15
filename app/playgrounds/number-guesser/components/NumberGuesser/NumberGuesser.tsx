// @ts-nocheck
"use client";

import React, { useState } from "react";

const NumberGuesser = () => {
  // State to store the correct number and the user's guess
  const [correctNumber, setCorrectNumber] = useState(undefined);
  const [userGuess, setUserGuess] = useState("");

  function setCorrectNumberToGuess() {
    setCorrectNumber(Math.floor(Math.random() * 100) + 1);
  }

  function resetCorrectNumberToGuess() {
    setCorrectNumber(undefined);
  }

  // State to store the status message
  const [status, setStatus] = useState("Make a guess!");

  // Function to handle the user's guess
  const handleGuess = (event) => {
    event.preventDefault();

    // Update the status message based on the user's guess
    if (userGuess < correctNumber) {
      setStatus("Your guess is too low.");
    } else if (userGuess > correctNumber) {
      setStatus("Your guess is too high.");
    } else {
      setStatus("Correct! Click the button below to play again.");
    }
  };

  if (!correctNumber)
    return (
      <button
        type="button"
        onClick={setCorrectNumberToGuess}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Start game
      </button>
    );

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">
        Number Guesser {userGuess} {correctNumber}
      </h1>
      <p className="mb-4">{status}</p>
      {userGuess !== correctNumber ? (
        <form onSubmit={handleGuess}>
          <label className="block mb-2">
            Your guess:
            <input
              type="number"
              value={userGuess}
              onChange={(event) => setUserGuess(event.target.value)}
              className="form-input mt-1 block w-full"
            />
          </label>
          <input
            type="submit"
            value="Guess"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          />
        </form>
      ) : (
        <button
          onClick={resetCorrectNumberToGuess}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Play again
        </button>
      )}
    </div>
  );
};

export { NumberGuesser };
