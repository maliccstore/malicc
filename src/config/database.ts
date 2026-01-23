import { Sequelize } from "sequelize-typescript";
import appConfig from "./index";
import { Product } from "../models/ProductModel";
import User from "../models/UserModel";
import { Session } from "../models/Session";
import { Cart } from "../models/Cart";
import { Inventory } from "../models/Inventory";
import { CartItem } from "../models/CartItem";
import { Category } from "../models/Category";
import Address from "../models/Address";
import { Order } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import { Transaction } from "../models/Transaction";

const sequelize = new Sequelize({
  database: appConfig.DB_NAME,
  username: appConfig.DB_USER,
  password: appConfig.DB_PASSWORD,
  host: appConfig.DB_HOST,
  port: appConfig.DB_PORT,
  dialect: "postgres",
  logging: console.log,
  models: [
    Product,
    User,
    Session,
    Cart,
    Inventory,
    CartItem,
    Category,
    Address,
    Order,
    OrderItem,
    Transaction,
  ],
});

export default sequelize;
