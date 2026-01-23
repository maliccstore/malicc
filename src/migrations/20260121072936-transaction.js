"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transactions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },

      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      paymentProvider: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      providerTransactionId: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "Stored in smallest currency unit (paise/cents)",
      },

      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM(
          "initiated",
          "authorized",
          "captured",
          "failed",
          "refunded",
        ),
        allowNull: false,
      },

      type: {
        type: Sequelize.ENUM("payment", "refund"),
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
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // Helpful indexes (performance + sanity)
    await queryInterface.addIndex("transactions", ["orderId"]);
    await queryInterface.addIndex("transactions", ["providerTransactionId"]);
    await queryInterface.addIndex("transactions", ["status"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("transactions");

    // ENUM cleanup (Postgres quirk)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_transactions_status";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_transactions_type";',
    );
  },
};
