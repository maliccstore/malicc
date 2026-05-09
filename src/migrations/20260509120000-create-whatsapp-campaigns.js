"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("whatsapp_campaigns", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      messageTemplate: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      messageType: {
        type: Sequelize.ENUM("PROMOTIONAL", "PRODUCT_ANNOUNCEMENT"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "SENDING", "COMPLETED", "FAILED"),
        defaultValue: "DRAFT",
      },
      totalRecipients: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      successfulCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      failedCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("whatsapp_campaigns");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_whatsapp_campaigns_messageType";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_whatsapp_campaigns_status";'
    );
  },
};
