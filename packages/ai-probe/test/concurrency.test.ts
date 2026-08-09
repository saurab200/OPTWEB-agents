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

  it("paces each worker's requests by delayMs (regression: concurrency alone didn't prevent quota exhaustion mid-run)", async () => {
    const starts: number[] = [];
    const tasks = Array.from({ length: 4 }, () => async () => {
      starts.push(Date.now());
      return null;
    });
    const t0 = Date.now();
    await runWithConcurrencyLimit(tasks, 1, 40); // single worker: fully serial, easy to assert spacing
    const gaps = starts.slice(1).map((t, i) => t - starts[i]);
    for (const gap of gaps) {
      expect(gap).toBeGreaterThanOrEqual(35); // small tolerance below 40ms for timer jitter
    }
    expect(Date.now() - t0).toBeGreaterThanOrEqual(35 * (tasks.length - 1));
  });

  it("does not pace when delayMs is 0 (default, backward compatible)", async () => {
    const tasks = Array.from({ length: 5 }, () => () => Promise.resolve(1));
    const t0 = Date.now();
    await runWithConcurrencyLimit(tasks, 5);
    expect(Date.now() - t0).toBeLessThan(20);
  });
});
