import sequelize from "./config/database";
import User from "./models/UserModel";
import { Product } from "./models/ProductModel";
import { Event } from "./models/Event";
import { startEventDispatcherJob } from "./events";

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "Connection to the database has been established successfully."
    );

    // For Development Only
    //await sequelize.sync({ force: true });

    // Sync all models
    await User.sync({ alter: true });
    await Product.sync({ alter: true });
    await Event.sync({ alter: true });
    console.log("All models were synchronized successfully.");

    // Start the Event Dispatcher Worker
    startEventDispatcherJob();

  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

syncDatabase();

