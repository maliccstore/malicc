"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop and recreate as Postgres doesn't support direct UUID -> INTEGER cast
    await queryInterface.removeColumn("events", "user_id");
    await queryInterface.addColumn("events", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("events", "user_id");
    await queryInterface.addColumn("events", "user_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },
};
