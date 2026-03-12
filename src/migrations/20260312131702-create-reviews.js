"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the ENUM type for status
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_reviews_status" AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create the reviews table
    await queryInterface.createTable("reviews", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reviewText: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: "enum_reviews_status",
        allowNull: false,
        defaultValue: "pending",
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

    // 3. Add CHECK constraint for rating
    await queryInterface.addConstraint("reviews", {
      fields: ["rating"],
      type: "check",
      name: "reviews_rating_check",
      where: {
        rating: {
          [Sequelize.Op.between]: [1, 5],
        },
      },
    });

    // 4. Add UNIQUE constraint for (userId, productId)
    await queryInterface.addConstraint("reviews", {
      fields: ["userId", "productId"],
      type: "unique",
      name: "reviews_userId_productId_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Drop the table
    await queryInterface.dropTable("reviews");

    // 2. Drop the ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_reviews_status";
    `);
  },
};
