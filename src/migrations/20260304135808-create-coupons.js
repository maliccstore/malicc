"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    CREATE TYPE "enum_coupons_discounttype" AS ENUM (
    'PERCENTAGE',
    'FIXED'
  );
`);

    await queryInterface.createTable("coupons", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      discountType: {
        type: "enum_coupons_discounttype",
        allowNull: false,
      },

      discountValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      maxDiscount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },

      minOrderValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },

      usageLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      perUserLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      validFrom: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      validUntil: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addColumn("orders", "couponId", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    await queryInterface.addConstraint("orders", {
      fields: ["couponId"],
      type: "foreign key",
      name: "fk_orders_couponId",
      references: {
        table: "coupons",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    await queryInterface.addIndex("orders", ["couponId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("orders", "fk_orders_couponId");
    await queryInterface.removeColumn("orders", "couponId");

    await queryInterface.dropTable("coupons");

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_coupons_discounttype";
    `);
  },
};
