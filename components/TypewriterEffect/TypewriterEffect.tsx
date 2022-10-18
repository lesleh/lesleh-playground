import clsx from "clsx";
import { useEffect, useState } from "react";
import typewriterKeySound from "../../assets/typewriter-key2.mp3";
import { Blink } from "../Blink";

export function TypewriterEffect({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [textToShow, setTextToShow] = useState("");

  const preloadedSound = new Audio(typewriterKeySound);

  useEffect(() => {
    let i = 0;
    let timeout: NodeJS.Timeout;
    const callback = () => {
      if (i > text.length) {
        clearTimeout(timeout);
        return;
      }
      setTextToShow(text.slice(0, i));
      ++i;
      new Audio(typewriterKeySound).play();
      timeout = setTimeout(callback, 80);
    };
    callback();
    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <div className={clsx("font-special-elite", className)}>
      {textToShow}
      <Blink>|</Blink>
    </div>
  );
}
