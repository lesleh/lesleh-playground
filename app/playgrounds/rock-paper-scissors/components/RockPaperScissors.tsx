"use client";

import React, { useState } from "react";

const options = ["rock", "paper", "scissors"] as const;
type Option = typeof options[number];
const colors = {
  rock: "text-rose-500",
  paper: "text-blue-500",
  scissors: "text-green-500",
};

const Option = ({ option }: { option: keyof typeof colors }) => (
  <span className={`text-9xl ${colors[option]}`}>{option}</span>
);

const isValidOption = (option: string): option is Option =>
  options.includes(option as Option);

const RockPaperScissors = () => {
  // State to store the user's selection and the computer's selection
  const [userSelection, setUserSelection] = useState("");
  const [computerSelection, setComputerSelection] = useState("");

  // Function to randomly select "rock", "paper", or "scissors" for the computer
  const generateComputerSelection = () => {
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  };

  // Function to handle the user's selection
  const handleSelection = (selection: string) => {
    setUserSelection(selection);
    setComputerSelection(generateComputerSelection());
  };

  // Function to determine the winner based on the user's and computer's selections
  const determineWinner = (user: Option, computer: Option) => {
    if (user === computer) {
      return "It's a tie!";
    } else if (
      (user === "rock" && computer === "scissors") ||
      (user === "paper" && computer === "rock") ||
      (user === "scissors" && computer === "paper")
    ) {
      return "You win!";
    } else {
      return "The computer wins!";
    }
  };

  if (!isValidOption(userSelection)) return null;
  if (!isValidOption(computerSelection)) return null;

  return (
    <div>
      <h1>Rock, Paper, Scissors</h1>
      <p>
        {userSelection ? (
          <>
            You chose <Option option={userSelection as any} /> and the computer
            chose <Option option={computerSelection as any} />.{" "}
            {determineWinner(userSelection, computerSelection)}
          </>
        ) : (
          "Make your selection to play the game."
        )}
      </p>
      <button
        className="inline-block p-3 text-rose-500 border-solid border-rose-500 border-2 mr-3"
        onClick={() => handleSelection("rock")}
      >
        Rock
      </button>
      <button
        className="inline-block p-3 text-blue-500 border-solid border-blue-500 border-2 mr-3"
        onClick={() => handleSelection("paper")}
      >
        Paper
      </button>
      <button
        className="inline-block p-3 text-green-500 border-solid border-green-500 border-2 mr-3"
        onClick={() => handleSelection("scissors")}
      >
        Scissors
      </button>
    </div>
  );
};

export { RockPaperScissors };
