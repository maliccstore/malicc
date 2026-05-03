'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addConstraint("products", {
      fields: ["sku"],
      type: "unique",
      name: "products_sku_unique_constraint",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint("products", "products_sku_unique_constraint");
  }
};
