"use client";

import { useMachine } from "@xstate/react";
import { Fragment } from "react";
import { lightsOutMachine } from "../../_machines/lightsOutMachine";
import { Light } from "../Light/Light";
import clsx from "clsx";

const VALUE_LABELS = {
  idle: "Idle",
  playing: "Playing",
  won: "You won!",
  randomizing: "Randomizing",
  solving: "Solving",
};

export function LightsOut() {
  const [current, send] = useMachine(lightsOutMachine);
  const solution = current.context.solution;

  function cellIsInSolution(row: number, col: number) {
    return solution.some(([solutionRow, solutionCol]) => {
      return solutionRow === row && solutionCol === col;
    });
  }

  return (
    <div className="h-full grid" role="main" aria-label="Lights Out Game">
      <div
        className="grid grid-cols-5 gap-4 w-max h-max mx-auto mt-6"
        role="group"
        aria-label="Game Board"
      >
        <div
          className="col-span-5 text-2xl text-center grid items-center justify-center"
          role="status"
          aria-live="polite"
        >
          {VALUE_LABELS[current.value as keyof typeof VALUE_LABELS]}
          {current.matches("won") || current.matches("playing") ? (
            <span
              className="text-base text-gray-500"
              aria-label={`${current.context.moveCount} ${
                current.context.moveCount === 1 ? "move" : "moves"
              } made`}
            >
              {current.context.moveCount}{" "}
              {current.context.moveCount === 1 ? "move" : "moves"}
            </span>
          ) : null}
        </div>
        {current.matches("playing") && (
          <div className="col-span-5">
            <label>
              <input
                type="checkbox"
                checked={current.context.showSolution}
                onChange={(e) =>
                  send({ type: "TOGGLE_SHOW_SOLUTION", show: e.target.checked })
                }
              />{" "}
              Show solution
            </label>
          </div>
        )}
        {current.context.board.map((row, rowIndex) => (
          <Fragment key={rowIndex}>
            {row.map((light, columnIndex) => (
              <Light
                className={clsx({
                  "border-solid border-black border-2":
                    cellIsInSolution(rowIndex, columnIndex) &&
                    current.context.showSolution,
                })}
                key={`${rowIndex}-${columnIndex}`}
                onClick={() => {
                  send({
                    type: "TOGGLE_LIGHT",
                    row: rowIndex,
                    col: columnIndex,
                  });
                }}
                isOn={light === true}
                isPlaying={current.matches("playing")}
                aria-label={`Light at row ${rowIndex + 1}, column ${
                  columnIndex + 1
                }`}
                aria-checked={light}
                role="switch"
                disabled={!current.matches("playing")}
              />
            ))}
          </Fragment>
        ))}
        {current.matches("idle") && (
          <button
            type="button"
            className="block bg-rose-500 text-white p-2 rounded col-span-5"
            onClick={() => send({ type: "START" })}
            aria-label="Start new game"
          >
            Start
          </button>
        )}
        {current.matches("playing") && false && (
          <button
            type="button"
            className="block bg-rose-500 text-white p-2 rounded col-span-5"
            onClick={() => send({ type: "SOLVE" })}
            aria-label="Show solution"
          >
            Solve
          </button>
        )}
        {current.matches("won") && (
          <button
            type="button"
            className="block bg-rose-500 text-white p-2 rounded col-span-5"
            onClick={() => send({ type: "RESET" })}
            aria-label="Start new game"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
