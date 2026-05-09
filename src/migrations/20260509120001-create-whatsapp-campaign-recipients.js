"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("whatsapp_campaign_recipients", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      campaignId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "whatsapp_campaigns",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      deliveryStatus: {
        type: Sequelize.ENUM("PENDING", "SENT", "DELIVERED", "READ", "FAILED"),
        defaultValue: "PENDING",
      },
      metaMessageId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("whatsapp_campaign_recipients");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_whatsapp_campaign_recipients_deliveryStatus";'
    );
  },
};
