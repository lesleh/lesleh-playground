import { useState } from "react";
import { TypewriterEffect } from "../../../components/TypewriterEffect";

export default function Typewriter() {
  const [showText, setShowText] = useState(false);
  return (
    <div className="p-10">
      {showText ? (
        <TypewriterEffect className="text-9xl" text="Hello, World!" />
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
