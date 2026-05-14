'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Rename bannerImage to bannerImageUrl
    await queryInterface.renameColumn('whatsapp_campaigns', 'bannerImage', 'bannerImageUrl');

    // Add new fields
    await queryInterface.addColumn('whatsapp_campaigns', 'headline', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('whatsapp_campaigns', 'offerMessage', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('whatsapp_campaigns', 'ctaUrl', {
      type: Sequelize.STRING(1000),
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('whatsapp_campaigns', 'ctaUrl');
    await queryInterface.removeColumn('whatsapp_campaigns', 'offerMessage');
    await queryInterface.removeColumn('whatsapp_campaigns', 'headline');
    await queryInterface.renameColumn('whatsapp_campaigns', 'bannerImageUrl', 'bannerImage');
  }
};
