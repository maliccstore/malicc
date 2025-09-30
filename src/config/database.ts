import { Sequelize } from "sequelize-typescript"; // ← Change import
import appConfig from "./index";
import { Product } from "../models/Product";
import User from "../models/UserModel";
import { Session } from "../models/Session";
import { Cart } from "../models/Cart";

const sequelize = new Sequelize({
  database: appConfig.DB_NAME,
  username: appConfig.DB_USER,
  password: appConfig.DB_PASSWORD,
  host: appConfig.DB_HOST,
  port: appConfig.DB_PORT,
  dialect: "postgres",
  logging: console.log,
  models: [Product, User, Session, Cart], // ← Add models here
});

export default sequelize;
