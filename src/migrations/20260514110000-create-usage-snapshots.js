"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("usage_snapshots", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true,
        comment: "Calendar date this snapshot represents (YYYY-MM-DD)",
      },
      storageBytes: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: "Total bytes in public/uploads/ at last measurement",
      },
      bandwidthBytes: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: "Estimated bytes served as HTTP responses today",
      },
      whatsappMessages: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "WhatsApp template messages successfully sent today",
      },
      ordersCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Orders that transitioned to PAID status today",
      },
      productCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Total active products at time of last snapshot flush",
      },
      syncedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: "When this snapshot was acknowledged by malicc-hq. NULL = pending.",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Index on syncedAt for efficient "find unsynced" queries
    await queryInterface.addIndex("usage_snapshots", ["syncedAt"], {
      name: "idx_usage_snapshots_synced_at",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("usage_snapshots");
  },
};
