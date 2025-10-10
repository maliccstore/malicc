import { Sequelize } from "sequelize-typescript"; // ← Change import
import appConfig from "./index";
import { Product } from "../models/ProductModel";
import User from "../models/UserModel";
import { Session } from "../models/Session";
import { Cart } from "../models/Cart";
import { Inventory } from "../models/Inventory";

const sequelize = new Sequelize({
  database: appConfig.DB_NAME,
  username: appConfig.DB_USER,
  password: appConfig.DB_PASSWORD,
  host: appConfig.DB_HOST,
  port: appConfig.DB_PORT,
  dialect: "postgres",
  logging: console.log,
  models: [Product, User, Session, Cart, Inventory], // ← Add models here
});

export default sequelize;
