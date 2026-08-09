import type { NextFunction, Request, Response } from 'express';
import type { IMetricsService } from '../service/interface/metrics.service.interface.js';
import type {
  ApiKeyMetricsResult,
  ApplicationMetricsResult,
  AuthMetricsResult,
  OAuthMetricsResult,
  OrganizationMetricsResult,
  WebhookMetricsResult,
} from '../types/metrics.types.js';
import type { IMetricsController } from './interface/metrics.controller.interface.js';

export class MetricsController implements IMetricsController {
  constructor(private readonly service: IMetricsService) {}

  async auth(_req: Request, _res: Response, _next: NextFunction): Promise<AuthMetricsResult> {
    return this.service.getAuthMetrics();
  }

  async oauth(_req: Request, _res: Response, _next: NextFunction): Promise<OAuthMetricsResult> {
    return this.service.getOAuthMetrics();
  }

  async applications(
    _req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<ApplicationMetricsResult> {
    return this.service.getApplicationMetrics();
  }

  async apiKeys(_req: Request, _res: Response, _next: NextFunction): Promise<ApiKeyMetricsResult> {
    return this.service.getApiKeyMetrics();
  }

  async webhooks(
    _req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<WebhookMetricsResult> {
    return this.service.getWebhookMetrics();
  }

  async organizations(
    _req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<OrganizationMetricsResult> {
    return this.service.getOrganizationMetrics();
  }
}
