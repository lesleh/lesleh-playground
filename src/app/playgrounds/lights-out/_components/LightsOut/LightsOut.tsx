"use client";

import { useMachine } from "@xstate/react";
import { Fragment } from "react";
import { lightsOutMachine } from "../../_machines/lightsOutMachine";
import { Light } from "../Light/Light";

export function LightsOut() {
  const [current, send] = useMachine(lightsOutMachine);

  return (
    <div className="h-full grid">
      <div className="grid justify-center grid-cols-5 grid-rows-7 gap-4 w-max h-max m-auto">
        <div className="col-span-5 text-2xl text-center grid items-center justify-center">
          {current.matches("won") && "You won!"}
        </div>
        {current.context.board.map((row, rowIndex) => (
          <Fragment key={rowIndex}>
            {row.map((light, columnIndex) => (
              <Light
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
        {current.matches("playing") && (
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
