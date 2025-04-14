import sequelize from "../config/database";

async function checkDatabaseConnection() {
  console.log("Checking the connectivity");
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1); // Exit process with failure
  }
}

export default checkDatabaseConnection;
