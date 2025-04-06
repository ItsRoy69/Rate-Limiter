import { RateLimitConfig } from './app.service';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
}

export class RateLimiterService {
  private buckets: Map<string, TokenBucket> = new Map();
  
  initializeBucket(appId: string, config: RateLimitConfig): void {
    this.buckets.set(appId, {
      tokens: config.requestCount,
      lastRefill: Date.now(),
      capacity: config.requestCount,
      refillRate: config.requestCount / config.timeWindow
    });
  }
  
  async canMakeRequest(appId: string): Promise<boolean> {
    const bucket = this.buckets.get(appId);
    if (!bucket) return false;
    
    this.refillTokens(bucket);
    
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    
    return false;
  }
  
  private refillTokens(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * bucket.refillRate;
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }
  
  getTimeUntilAvailable(appId: string): number {
    const bucket = this.buckets.get(appId);
    if (!bucket || bucket.tokens >= 1) return 0;
    
    return (1 - bucket.tokens) / bucket.refillRate * 1000;
  }
}