"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("coupon_usages", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      couponId: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      orderId: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      usedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
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

    await queryInterface.addConstraint("coupon_usages", {
      fields: ["couponId"],
      type: "foreign key",
      name: "fk_coupon_usage_coupon",
      references: {
        table: "coupons",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("coupon_usages", {
      fields: ["userId"],
      type: "foreign key",
      name: "fk_coupon_usage_user",
      references: {
        table: "users",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("coupon_usages", {
      fields: ["orderId"],
      type: "foreign key",
      name: "fk_coupon_usage_order",
      references: {
        table: "orders",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    await queryInterface.addIndex(
      "coupon_usages",
      ["couponId", "userId", "orderId"],
      {
        unique: true,
        name: "unique_coupon_user_order",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("coupon_usages");
  },
};
