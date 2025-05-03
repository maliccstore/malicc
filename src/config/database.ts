import { Sequelize } from "sequelize";
import appConfig from "./index";

const sequelize = new Sequelize({
  database: appConfig.DB_NAME,
  username: appConfig.DB_USER,
  password: appConfig.DB_PASSWORD,
  host: appConfig.DB_HOST,
  port: appConfig.DB_PORT,
  dialect: "postgres",
  logging: console.log,
});

export default sequelize;
