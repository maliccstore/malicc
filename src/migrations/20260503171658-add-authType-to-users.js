"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "authType", {
      type: Sequelize.ENUM("OTP", "PASSWORD", "BOTH"),
      allowNull: false,
      defaultValue: "OTP", // existing users stay OTP
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "authType");

    // cleanup enum (important for Postgres)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_authType";',
    );
  },
};
