import axios, { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import { ApplicationService } from './app.service';
import { RateLimiterService } from './rate-limiter.service';
import { QueueManager } from './queue-manager.service';

export class ProxyController {
  constructor(
    private appService: ApplicationService,
    private rateLimiter: RateLimiterService,
    private queueManager: QueueManager
  ) {}
  
  async handleProxyRequest(req: Request, res: Response): Promise<void> {
    const appId = req.params.appId;
    
    const app = await this.appService.getApplication(appId);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const canMakeRequest = await this.rateLimiter.canMakeRequest(appId);
    
    if (canMakeRequest) {
      await this.forwardRequest(req, res, app.baseUrl);
    } else {
      const timeUntilAvailable = this.rateLimiter.getTimeUntilAvailable(appId);
      res.setHeader('X-RateLimit-Reset', String(Date.now() + timeUntilAvailable));
      res.setHeader('X-Queue-Position', '1');
      
      try {
        const result = await this.queueManager.enqueueRequest(appId, req);
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: 'Failed to process queued request' });
      }
    }
  }
  
  private async forwardRequest(req: Request, res: Response, baseUrl: string): Promise<void> {
    try {
      const path = req.path.replace(`/apis/${req.params.appId}`, '');
      const targetUrl = `${baseUrl}${path}`;
      
      const headers: Record<string, string> = {};
      
      Object.entries(req.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'host' && value !== undefined) {
          headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
        }
      });
      
      const config: AxiosRequestConfig = {
        method: req.method,
        url: targetUrl,
        headers,
        data: req.body,
        params: req.query,
        responseType: 'stream'
      };
      
      const response = await axios(config);
      
      res.status(response.status);
      
      Object.keys(response.headers).forEach(key => {
        res.setHeader(key, response.headers[key]);
      });
      
      response.data.pipe(res);
    } catch (error: any) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: 'Failed to proxy request' });
      }
    }
  }
}