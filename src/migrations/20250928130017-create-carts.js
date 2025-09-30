"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("carts", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      sessionId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "sessions",
          key: "sessionId",
        },
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER, // Changed from STRING to INTEGER
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      items: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalItems: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lastUpdated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("carts", ["sessionId"]);
    await queryInterface.addIndex("carts", ["userId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("carts");
  },
};
