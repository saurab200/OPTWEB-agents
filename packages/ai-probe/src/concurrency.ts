/**
 * Runs tasks with bounded concurrency. Discovered necessary via real testing:
 * firing all provider x query requests via a single Promise.all triggers
 * Vercel AI Gateway's free-tier rate limiting even for models that succeed
 * reliably one at a time — see fixtures/scanner-style regression notes in
 * README. Limiting concurrency trades a slower probe() for a real signal
 * instead of a probe_confidence:"low" result full of rate-limit errors.
 */
export async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const current = nextIndex++;
      results[current] = await tasks[current]();
    }
  }

  const workerCount = Math.max(1, Math.min(limit, tasks.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
