function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs tasks with bounded concurrency AND a minimum delay between each
 * worker's requests. Discovered necessary via real testing, in two stages:
 *
 * 1. Firing all provider x query requests via a single Promise.all trips
 *    Vercel AI Gateway's free-tier rate limit even for models that succeed
 *    reliably one at a time — concurrency limiting alone (no delay) was the
 *    first fix.
 * 2. That wasn't sufficient either: a real corpus:run showed a business
 *    probed *later* in the same run failing on every single provider —
 *    including Anthropic, which had just succeeded 4/4 on the business
 *    probed first. That's the signature of a per-minute quota exhausting
 *    partway through a burst, not a per-provider restriction — concurrency
 *    caps how many requests are in-flight at once, but says nothing about
 *    the rate they're *started* at. delayMs paces request starts, trading
 *    wall-clock time for reliability without spending more credit on
 *    retries that were always going to fail.
 */
export async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  delayMs = 0,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const current = nextIndex++;
      results[current] = await tasks[current]();
      if (delayMs > 0 && nextIndex < tasks.length) {
        await sleep(delayMs);
      }
    }
  }

  const workerCount = Math.max(1, Math.min(limit, tasks.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
