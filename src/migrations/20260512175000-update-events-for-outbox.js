"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Rename 'metadata' to 'payload'
    await queryInterface.renameColumn("events", "metadata", "payload");

    // 2. Add 'store_id' for multi-tenant support
    await queryInterface.addColumn("events", "store_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 3. Add 'sync_status' for outbox tracking
    await queryInterface.addColumn("events", "sync_status", {
      type: Sequelize.STRING, // Using STRING to simplify ENUM management in migrations
      allowNull: false,
      defaultValue: "PENDING",
    });

    // 4. Add 'retry_count' for exponential backoff
    await queryInterface.addColumn("events", "retry_count", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // 5. Add 'last_error' for troubleshooting
    await queryInterface.addColumn("events", "last_error", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // 6. Add 'updated_at' (missing in early migration)
    await queryInterface.addColumn("events", "updated_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    });

    // 7. Make 'session_id' nullable (it was strict in the original)
    await queryInterface.changeColumn("events", "session_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn("events", "payload", "metadata");
    await queryInterface.removeColumn("events", "store_id");
    await queryInterface.removeColumn("events", "sync_status");
    await queryInterface.removeColumn("events", "retry_count");
    await queryInterface.removeColumn("events", "last_error");
    await queryInterface.removeColumn("events", "updated_at");
    
    await queryInterface.changeColumn("events", "session_id", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
