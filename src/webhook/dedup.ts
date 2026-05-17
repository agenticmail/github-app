export class DeliveryDedupCache {
  private readonly values = new Map<string, number>();

  constructor(
    private readonly ttlMs = 5 * 60 * 1000,
    private readonly maxEntries = 5000,
  ) {}

  seen(deliveryId: string): boolean {
    this.prune();
    const now = Date.now();
    const existing = this.values.get(deliveryId);

    if (existing && now - existing < this.ttlMs) {
      return true;
    }

    this.values.set(deliveryId, now);
    this.enforceCap();
    return false;
  }

  size(): number {
    this.prune();
    return this.values.size;
  }

  private prune(): void {
    const cutoff = Date.now() - this.ttlMs;
    for (const [id, ts] of this.values.entries()) {
      if (ts < cutoff) this.values.delete(id);
    }
  }

  private enforceCap(): void {
    while (this.values.size > this.maxEntries) {
      const firstKey = this.values.keys().next().value;
      if (!firstKey) return;
      this.values.delete(firstKey);
    }
  }
}
