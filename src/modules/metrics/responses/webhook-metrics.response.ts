export class WebhookMetricsResponse {
  constructor(
    public readonly totalWebhooks: number,
    public readonly activeWebhooks: number,
    public readonly disabledWebhooks: number,
    public readonly deliveriesByStatus: {
      pending: number;
      delivering: number;
      delivered: number;
      failed: number;
      dead_letter: number;
    },
    public readonly deliveriesLast24h: number,
    /** delivered / (delivered + failed + dead_letter) over the last 24h. Null when there were no terminal deliveries in that window. */
    public readonly successRateLast24h: number | null,
  ) {}
}
