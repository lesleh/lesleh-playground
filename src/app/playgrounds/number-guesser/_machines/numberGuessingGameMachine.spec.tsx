import { createActor } from "xstate";
import { numberGuessingGameMachine } from "./numberGuessingGameMachine";

describe("NumberGuessingGameMachine", () => {
  let actor: ReturnType<typeof createActor>;

  afterEach(() => {
    actor?.stop();
  });

  it("should transition from idle to playing when started", () => {
    actor = createActor(numberGuessingGameMachine).start();
    expect(actor.getSnapshot().value).toBe("idle");

    actor.send({ type: "START" });
    expect(actor.getSnapshot().value).toBe("playing");
  });

  it("should handle incorrect guesses", () => {
    actor = createActor(numberGuessingGameMachine).start();
    actor.send({ type: "START" });

    actor.send({ type: "GUESS", value: 50 });
    expect(actor.getSnapshot().value).toBe("playing");
    expect(actor.getSnapshot().context.guesses).toHaveLength(1);
  });

  it("should handle correct guess and transition to won state", () => {
    actor = createActor(numberGuessingGameMachine).start();
    actor.send({ type: "START" });

    const targetNumber = actor.getSnapshot().context.numberToGuess;
    actor.send({ type: "GUESS", value: targetNumber });
    expect(actor.getSnapshot().value).toBe("won");
  });

  it("should reset the game state", () => {
    actor = createActor(numberGuessingGameMachine).start();
    actor.send({ type: "START" });
    actor.send({ type: "GUESS", value: 50 });
    actor.send({ type: "RESET" });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.guesses).toHaveLength(0);
  });

  it("should track number of attempts", () => {
    actor = createActor(numberGuessingGameMachine).start();
    actor.send({ type: "START" });

    actor.send({ type: "GUESS", value: 1 });
    actor.send({ type: "GUESS", value: 2 });
    actor.send({ type: "GUESS", value: 3 });

    expect(actor.getSnapshot().context.guesses).toHaveLength(3);
  });
});
