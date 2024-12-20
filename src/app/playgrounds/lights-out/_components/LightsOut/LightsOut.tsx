"use client";

import { useMachine } from "@xstate/react";
import { Fragment } from "react";
import { lightsOutMachine } from "../../_machines/lightsOutMachine";
import { Light } from "../Light/Light";

export function LightsOut() {
  const [current, send] = useMachine(lightsOutMachine);

  return (
    <div className="h-full grid">
      <div className="grid justify-center grid-cols-5 grid-rows-5 gap-4 w-max h-max m-auto">
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
