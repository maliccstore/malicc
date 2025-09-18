"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "username", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("users", "email", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.removeColumn("users", "password");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "username", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn("users", "email", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("users", "password", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
