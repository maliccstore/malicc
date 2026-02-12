"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_orders_status" AS ENUM (
        'CREATED',
        'PAYMENT_PENDING',
        'PAID',
        'FULFILLED',
        'CANCELLED',
        'FAILED'
      );
    `);
    await queryInterface.createTable("orders", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      sessionId: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      status: {
        type: "enum_orders_status",
        allowNull: false,
        defaultValue: "CREATED",
      },

      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      tax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      shipping: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      currency: {
        type: Sequelize.ENUM("INR", "USD", "EUR"),
        allowNull: false,
        defaultValue: "INR",
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orders");
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_orders_status";
    `);
  },
};
