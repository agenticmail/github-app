export type JobHandler<T> = (job: T) => Promise<void>;
export type JobErrorHandler<T> = (error: unknown, job: T) => void;

export class InMemoryQueue<T> {
  private readonly queue: T[] = [];
  private processing = false;

  constructor(
    private readonly handler: JobHandler<T>,
    private readonly onError?: JobErrorHandler<T>,
  ) {}

  push(job: T): void {
    this.queue.push(job);
    void this.drain();
  }

  private async drain(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const job = this.queue.shift();
        if (!job) continue;

        try {
          await this.handler(job);
        } catch (error) {
          this.onError?.(error, job);
        }
      }
    } finally {
      this.processing = false;
    }
  }
}
