export class OAuthMetricsResponse {
  constructor(
    public readonly totalClients: number,
    public readonly activeClients: number,
    public readonly revokedClients: number,
    public readonly accessTokensIssuedLast24h: number,
    public readonly activeAccessTokens: number,
    public readonly activeRefreshTokens: number,
    public readonly authorizationCodesIssuedLast24h: number,
    public readonly tokensRevokedLast24h: number,
  ) {}
}
