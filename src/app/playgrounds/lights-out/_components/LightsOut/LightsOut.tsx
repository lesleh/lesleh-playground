"use client";

import { useMachine } from "@xstate/react";
import { Fragment } from "react";
import { lightsOutMachine } from "../../_machines/lightsOutMachine";
import { Light } from "../Light/Light";

const VALUE_LABELS = {
  idle: "Idle",
  playing: "Playing",
  won: "You won!",
  randomizing: "Randomizing",
  solving: "Solving",
};

export function LightsOut() {
  const [current, send] = useMachine(lightsOutMachine);

  return (
    <div className="h-full grid">
      <div className="grid grid-cols-5 gap-4 w-max h-max mx-auto mt-6">
        <div className="col-span-5 text-2xl text-center grid items-center justify-center">
          {VALUE_LABELS[current.value as keyof typeof VALUE_LABELS]}
          {current.matches("won") || current.matches("playing") ? (
            <span className="text-base text-gray-500">
              {current.context.moveCount}{" "}
              {current.context.moveCount === 1 ? "move" : "moves"}
            </span>
          ) : null}
        </div>
        {current.context.board.map((row, rowIndex) => (
          <Fragment key={rowIndex}>
            {row.map((light, columnIndex) => (
              <Light
                className="rounded"
                key={`${rowIndex}-${columnIndex}`}
                onClick={() => {
                  if (current.matches("playing")) {
                    send({
                      type: "TOGGLE_LIGHT",
                      row: rowIndex,
                      col: columnIndex,
                    });
                  }
                }}
                isOn={light === true}
                isPlaying={current.matches("playing")}
              />
            ))}
          </Fragment>
        ))}
        {current.matches("idle") && (
          <button
            type="button"
            className="block bg-rose-500 text-white p-2 rounded col-span-5"
            onClick={() => send({ type: "START" })}
          >
            Start
          </button>
        )}
        {current.matches("playing") && false && (
          <button
            type="button"
            className="block bg-rose-500 text-white p-2 rounded col-span-5"
            onClick={() => send({ type: "SOLVE" })}
          >
            Solve
          </button>
        )}
        {current.matches("won") && (
          <button
            type="button"
            className="block bg-rose-500 text-white p-2 rounded col-span-5"
            onClick={() => send({ type: "RESET" })}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
