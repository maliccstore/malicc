'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('whatsapp_campaigns', 'productId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('whatsapp_campaigns', 'bannerImage', {
      type: Sequelize.STRING(1000),
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('whatsapp_campaigns', 'productId');
    await queryInterface.removeColumn('whatsapp_campaigns', 'bannerImage');
  }
};
