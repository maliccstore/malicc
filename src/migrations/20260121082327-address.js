"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable("addresses", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      addressLine1: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      addressLine2: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      postalCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      country: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "IN",
      },

      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("addresses");
  },
};
