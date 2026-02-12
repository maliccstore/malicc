"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "fulfillmentStatus", {
      type: Sequelize.ENUM(
        "UNFULFILLED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "RETURNED",
      ),
      allowNull: false,
      defaultValue: "UNFULFILLED",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("orders", "fulfillmentStatus");

    // ⚠️ Important for Postgres:
    // ENUM types are not auto-dropped
    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_orders_fulfillmentStatus";',
      );
    }
  },
};
