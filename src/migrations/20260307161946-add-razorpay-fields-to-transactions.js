"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("transactions", "razorpayOrderId", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("transactions", "razorpayPaymentId", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("transactions", "razorpaySignature", {
      type: Sequelize.STRING(512),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("transactions", "razorpayOrderId");
    await queryInterface.removeColumn("transactions", "razorpayPaymentId");
    await queryInterface.removeColumn("transactions", "razorpaySignature");
  },
};
