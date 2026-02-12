"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_transactions_status" AS ENUM (
        'INITIATED',
        'SUCCESS',
        'FAILED',
        'PENDING'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_transactions_type" AS ENUM (
        'PAYMENT',
        'REFUND'
      );
    `);

    await queryInterface.createTable("transactions", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      paymentProvider: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      providerTransactionId: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
      },

      status: {
        type: "enum_transactions_status",
        allowNull: false,
      },

      type: {
        type: "enum_transactions_type",
        allowNull: false,
      },

      failureReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      providerResponse: {
        type: Sequelize.JSONB,
        allowNull: false,
      },

      idempotencyKey: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex("transactions", ["providerTransactionId"]);
    await queryInterface.addIndex("transactions", ["idempotencyKey"], {
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("transactions");

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_transactions_status";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_transactions_type";
    `);
  },
};
