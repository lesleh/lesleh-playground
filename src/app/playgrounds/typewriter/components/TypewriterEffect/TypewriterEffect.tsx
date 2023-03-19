import clsx from "clsx";
import { useEffect, useState } from "react";
import typewriterKeySound from "../../assets/typewriter-key2.mp3";
import { Blink } from "../Blink";
import { TypewriterEffectProps } from "./types";

function delay(ms: number, signal?: AbortSignal) {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

function useTypedText(texts: string[], silent = false) {
  const [typedText, setTypedText] = useState("");
  useEffect(() => {
    let controller = new AbortController();
    async function write(text: string) {
      for (let i = 0; i < text.length; i++) {
        if (controller.signal.aborted) {
          return;
        }
        setTypedText(text.substring(0, i + 1));
        if (!silent) {
          const audio = new Audio(typewriterKeySound);
          audio.play();
        }
        await delay(100, controller.signal);
      }
    }

    async function erase(text: string) {
      for (let i = text.length; i >= 0; i--) {
        if (controller.signal.aborted) {
          return;
        }
        setTypedText(text.substring(0, i));
        await delay(75, controller.signal);
      }
    }
    async function work() {
      for (const text of texts) {
        await write(text);
        await delay(1000);
        await erase(text);
      }
    }

    work();
    return () => {
      controller.abort();
    };
  }, [texts]);
  return typedText;
}

export function TypewriterEffect({
  texts,
  silent = false,
  className,
}: TypewriterEffectProps): JSX.Element {
  const [textToShow, setTextToShow] = useState("");

  if (!silent) {
    const preloadedSound = new Audio(typewriterKeySound);
    preloadedSound.load();
  }

  const typedText = useTypedText(texts, silent);

  return (
    <div className={clsx("font-special-elite", className)}>
      {typedText}
      <Blink>|</Blink>
    </div>
  );
}
