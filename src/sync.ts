import sequelize from "./config/database";
//import User from "./models/User";

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "Connection to the database has been established successfully."
    );

    // For Development Only
    await sequelize.sync({ force: true });

    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  } finally {
    process.exit("0");
  }
};

syncDatabase();
