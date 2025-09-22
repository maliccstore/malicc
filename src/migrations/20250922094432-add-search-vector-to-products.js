"use strict";

/** @type {import('sequelize-cli').Migration} */
// src/migrations/YYYYMMDDHHMMSS-add-search-vector-to-products.js

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the search_vector column
    await queryInterface.addColumn("products", "search_vector", {
      type: Sequelize.TSVECTOR,
      allowNull: true,
    });

    // Create a GIN index for faster search
    await queryInterface.sequelize.query(`
      CREATE INDEX products_search_vector_idx 
      ON products USING GIN(search_vector)
    `);

    // Update existing records with search vectors
    await queryInterface.sequelize.query(`
      UPDATE products 
      SET search_vector = to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove the index
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS products_search_vector_idx
    `);

    // Remove the column
    await queryInterface.removeColumn("products", "search_vector");
  },
};
