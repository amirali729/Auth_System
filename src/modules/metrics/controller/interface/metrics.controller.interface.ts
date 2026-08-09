import type { NextFunction, Request, Response } from 'express';
import type {
  ApiKeyMetricsResult,
  ApplicationMetricsResult,
  AuthMetricsResult,
  OAuthMetricsResult,
  OrganizationMetricsResult,
  WebhookMetricsResult,
} from '../../types/metrics.types.js';

export interface IMetricsController {
  auth(req: Request, res: Response, next: NextFunction): Promise<AuthMetricsResult>;

  oauth(req: Request, res: Response, next: NextFunction): Promise<OAuthMetricsResult>;

  applications(req: Request, res: Response, next: NextFunction): Promise<ApplicationMetricsResult>;

  apiKeys(req: Request, res: Response, next: NextFunction): Promise<ApiKeyMetricsResult>;

  webhooks(req: Request, res: Response, next: NextFunction): Promise<WebhookMetricsResult>;

  organizations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<OrganizationMetricsResult>;
}
