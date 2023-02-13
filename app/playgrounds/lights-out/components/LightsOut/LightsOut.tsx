"use client";

import { useMachine } from "@xstate/react";
import { Fragment } from "react";
import { lightsOutMachine } from "../../machines/lightsOutMachine";
import { Light } from "../Light/Light";

export function LightsOut() {
  const [current, send] = useMachine(lightsOutMachine);

  return (
    <div>
      <div className="inline-grid m-4 justify-center grid-cols-5 grid-rows-5 gap-4">
        {current.context.grid.map((row, rowIndex) => (
          <Fragment key={rowIndex}>
            {row.map((light, columnIndex) => (
              <Light
                key={`${rowIndex}-${columnIndex}`}
                onClick={() => {
                  if (current.matches("playing")) {
                    send("TOGGLE", {
                      coordinates: {
                        row: rowIndex,
                        col: columnIndex,
                      },
                    });
                  }
                }}
                isOn={light !== 0}
                isPlaying={current.matches("playing")}
              />
            ))}
          </Fragment>
        ))}
      </div>
      {current.matches("won") && <div className="text-4xl">You won!</div>}
    </div>
  );
}
