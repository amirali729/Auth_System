import type { SessionResponse } from '../../session/responses/session.response.js';

export class AdminSessionListResponse {
  constructor(
    public readonly userId: string,
    public readonly sessions: SessionResponse[],
  ) {}
}
