"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Product = sequelize.define(
    "Product",
    {
      product_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      vendor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "vendors",
          key: "vendor_id",
        },
        onDelete: "CASCADE",
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      brand: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      category_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "categories",
          key: "category_id",
        },
        onDelete: "SET NULL",
      },

      size: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          isDecimal: true,
        },
      },

      stock_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          isInt: true,
        },
      },

      images: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "products",
      timestamps: false,
      underscored: true,

      indexes: [
        { fields: ["vendor_id"] },
        { fields: ["category_id"] },
        { fields: ["price"] },
        { fields: ["stock_quantity"] },
      ],

      hooks: {
        beforeUpdate: (product) => {
          product.updated_at = new Date();
        },
      },
    }
  );

  return Product;
};
