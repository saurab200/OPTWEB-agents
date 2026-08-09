import { describe, expect, it } from "vitest";
import { runWithConcurrencyLimit } from "../src/concurrency.js";

describe("runWithConcurrencyLimit", () => {
  it("returns results in the original task order regardless of completion order", async () => {
    const tasks = [
      () => new Promise<number>((r) => setTimeout(() => r(1), 30)),
      () => new Promise<number>((r) => setTimeout(() => r(2), 10)),
      () => new Promise<number>((r) => setTimeout(() => r(3), 20)),
    ];
    const results = await runWithConcurrencyLimit(tasks, 3);
    expect(results).toEqual([1, 2, 3]);
  });

  it("never exceeds the concurrency limit at any point in time", async () => {
    let active = 0;
    let maxActive = 0;
    const tasks = Array.from({ length: 10 }, (_, i) => async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return i;
    });
    await runWithConcurrencyLimit(tasks, 3);
    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it("handles an empty task list", async () => {
    const results = await runWithConcurrencyLimit([], 3);
    expect(results).toEqual([]);
  });

  it("handles a limit larger than the task count", async () => {
    const tasks = [() => Promise.resolve("a"), () => Promise.resolve("b")];
    const results = await runWithConcurrencyLimit(tasks, 10);
    expect(results).toEqual(["a", "b"]);
  });
});
