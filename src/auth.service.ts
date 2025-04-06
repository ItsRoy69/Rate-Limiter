import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from './models/user.model';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  
  async registerUser(email: string, password: string): Promise<{ apiKey: string }> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = uuidv4();
    
    await User.create({
      email,
      password: hashedPassword,
      apiKey
    });
    
    return { apiKey };
  }
  
  async validateApiKey(apiKey: string): Promise<boolean> {
    const user = await User.findOne({ where: { apiKey } });
    return !!user;
  }
  
  generateToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: '7d' });
  }
}