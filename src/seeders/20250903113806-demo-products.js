"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "products",
      [
        {
          id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          name: "Wireless Headphones",
          description:
            "High-quality wireless headphones with noise cancellation",
          price: 199.99,
          category: "electronics",
          imageUrl: [
            "https://example.com/headphones1.jpg",
            "https://example.com/headphones2.jpg",
          ],
          isActive: true,
          sku: "WH-1000XM4",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "b2c3d4e5-f6a7-890b-cdef-123456789012",
          name: "Organic Cotton T-Shirt",
          description: "Comfortable organic cotton t-shirt in various colors",
          price: 29.99,
          category: "clothing",
          imageUrl: ["https://example.com/tshirt1.jpg"],
          isActive: true,
          sku: "TS-ORG-001",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "c3d4e5f6-a7b8-90cd-ef12-345678901234",
          name: "Stainless Steel Water Bottle",
          description: "Eco-friendly stainless steel water bottle, 1L capacity",
          price: 24.99,
          category: "lifestyle",
          imageUrl: [
            "https://example.com/bottle1.jpg",
            "https://example.com/bottle2.jpg",
          ],
          isActive: true,
          sku: "WB-SS-1L",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("products", null, {});
  },
};
