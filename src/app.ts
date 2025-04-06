import express from 'express';
import bodyParser from 'body-parser';
import { AuthService } from './auth.service';
import { ApplicationService } from './app.service';
import { RateLimiterService } from './rate-limiter.service';
import { QueueManager } from './queue-manager.service';
import { ProxyController } from './proxy.controller';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const authService = new AuthService();
const appService = new ApplicationService();
const rateLimiter = new RateLimiterService();
const queueManager = new QueueManager();
const proxyController = new ProxyController(appService, rateLimiter, queueManager);

const authenticateApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({ error: 'API key is required' });
      return;
    }
    
    const isValid = await authService.validateApiKey(apiKey);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    
    next();
  };

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.registerUser(email, password);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/apps', authenticateApiKey, async (req, res) => {
  try {
    const { baseUrl, rateLimitConfig } = req.body;
    const apiKey = req.headers['x-api-key'] as string;
    
    const userId = 'placeholder'; 
    const result = await appService.registerApplication(userId, baseUrl, rateLimitConfig);
    
    rateLimiter.initializeBucket(result.appId, rateLimitConfig);
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register application' });
  }
});

app.all('/apis/:appId/*', authenticateApiKey, (req, res) => {
  proxyController.handleProxyRequest(req, res);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;