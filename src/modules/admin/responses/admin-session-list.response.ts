import type { SessionResponse } from '../../../../../Auth_System_updated (2)/Auth_System/src/modules/session/responses/session.response.js';

export class AdminSessionListResponse {
  constructor(
    public readonly userId: string,
    public readonly sessions: SessionResponse[],
  ) {}
}
