import { v4 as uuidv4 } from 'uuid';
import { Application } from './models/application.model';

export interface RateLimitConfig {
  strategy: 'token-bucket' | 'leaky-bucket' | 'fixed-window';
  requestCount: number;
  timeWindow: number;
  tokenRefillRate?: number; 
  queueSize?: number;
}

export class ApplicationService {
  async registerApplication(
    userId: string,
    baseUrl: string,
    rateLimitConfig: RateLimitConfig
  ): Promise<{ appId: string }> {
    const appId = uuidv4();
    
    await Application.create({
      appId,
      userId,
      baseUrl,
      rateLimitConfig
    });
    
    return { appId };
  }
  
  async getApplication(appId: string): Promise<Application | null> {
    return Application.findOne({ where: { appId } });
  }
}