'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    const table = await queryInterface.describeTable('reviews');

    if (!table.createdAt) {
      await queryInterface.addColumn('reviews', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      });
    }

    if (!table.updatedAt) {
      await queryInterface.addColumn('reviews', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      });
    }

  },

  async down(queryInterface, Sequelize) {

    const table = await queryInterface.describeTable('reviews');

    if (table.createdAt) {
      await queryInterface.removeColumn('reviews', 'createdAt');
    }

    if (table.updatedAt) {
      await queryInterface.removeColumn('reviews', 'updatedAt');
    }

  }
};