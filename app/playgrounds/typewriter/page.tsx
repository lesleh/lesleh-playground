"use client";

import { useState } from "react";
import { Link } from "../../../components/Link";
import { Paragraph } from "../../../components/Paragraph";
import { TypewriterEffect } from "./components/TypewriterEffect";

export default function Typewriter() {
  const [showText, setShowText] = useState(false);
  const [silent, setSilent] = useState(true);
  return (
    <div className="p-10">
      <Paragraph>
        <Link href="/">Back</Link>
      </Paragraph>
      <Paragraph>
        <label>
          <input
            type="checkbox"
            checked={silent}
            onChange={() => setSilent((prevSilent) => !prevSilent)}
          />{" "}
          Silent
        </label>
      </Paragraph>
      {showText ? (
        <TypewriterEffect
          className="text-9xl"
          texts={[
            "Knock Knock",
            "Who's there?",
            "Tank",
            "Tank who?",
            "You're welcome",
          ]}
          silent={silent}
        />
      ) : (
        <button
          className="font-special-elite border-solid border-red-700 border-2 px-3 py-2"
          onClick={() => setShowText(true)}
        >
          Show Text
        </button>
      )}
    </div>
  );
}
