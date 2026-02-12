'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'addressId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'addresses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('orders', 'shippingAddress', {
      type: Sequelize.JSON,
      allowNull: true
    });

    await queryInterface.addColumn('orders', 'paymentMethod', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('orders', 'shippingMethod', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Rename shipping to shippingFee if it exists
    const tableInfo = await queryInterface.describeTable('orders');
    if (tableInfo.shipping) {
      await queryInterface.renameColumn('orders', 'shipping', 'shippingFee');
    } else if (!tableInfo.shippingFee) {
      await queryInterface.addColumn('orders', 'shippingFee', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'addressId');
    await queryInterface.removeColumn('orders', 'shippingAddress');
    await queryInterface.removeColumn('orders', 'paymentMethod');
    await queryInterface.removeColumn('orders', 'shippingMethod');

    const tableInfo = await queryInterface.describeTable('orders');
    if (tableInfo.shippingFee) {
      await queryInterface.renameColumn('orders', 'shippingFee', 'shipping');
    }
  }
};
