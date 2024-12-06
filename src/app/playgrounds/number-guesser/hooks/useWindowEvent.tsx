import { useRef, useEffect } from "react";

interface EventHandler<T = {}> {
  (event: T): void;
}

export function useWindowEvent<
  K extends keyof HTMLElementEventMap,
  H extends HTMLElementEventMap[K],
>(key: K, handler: EventHandler<H>, elem: HTMLElement): void;
export function useWindowEvent<
  K extends keyof WindowEventMap,
  H extends WindowEventMap[K],
>(key: K, handler: EventHandler<H>, elem?: Window): void;
export function useWindowEvent(
  eventName: string,
  handler: EventHandler,
  element: Window | HTMLElement = window,
) {
  const handlerRef = useRef<EventHandler>(undefined);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener: EventHandler = (event) => handlerRef.current?.(event);
    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}
