"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sessions", {
      sessionId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      guestId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      userRole: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cartItems: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      lastAccessed: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true,
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

    await queryInterface.addIndex("sessions", ["sessionId"]);
    await queryInterface.addIndex("sessions", ["userId"]);
    await queryInterface.addIndex("sessions", ["guestId"]);
    await queryInterface.addIndex("sessions", ["expiresAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sessions");
  },
};
