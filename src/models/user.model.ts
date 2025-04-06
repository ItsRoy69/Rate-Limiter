import { Model, DataTypes, Sequelize } from 'sequelize';

const sequelize = new Sequelize('sqlite::memory:');

export class User extends Model {
  public id!: number;
  public email!: string;
  public password!: string;
  public apiKey!: string;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  }
}, {
  sequelize,
  tableName: 'users'
});