
// models/application.model.ts
import { Model, DataTypes, Sequelize } from 'sequelize';
import { RateLimitConfig } from '../app.service';

const sequelize = new Sequelize('sqlite::memory:'); // For testing, use a real DB in production

export class Application extends Model {
  public id!: number;
  public appId!: string;
  public userId!: string;
  public baseUrl!: string;
  public rateLimitConfig!: RateLimitConfig;
}

Application.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  appId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  baseUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rateLimitConfig: {
    type: DataTypes.JSON,
    allowNull: false,
  }
}, {
  sequelize,
  tableName: 'applications'
});