"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CartItem = sequelize.define(
    "CartItem",
    {
      cart_item_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      cart_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "cart",
          key: "cart_id",
        },
        onDelete: "CASCADE",
      },

      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "products",
          key: "product_id",
        },
        onDelete: "CASCADE",
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          isInt: true,
        },
      },
    },
    {
      tableName: "cart_items",
      timestamps: false,
      underscored: true,

      indexes: [
        {
          unique: true,
          fields: ["cart_id", "product_id"],
          name: "uq_cart_items_cart_product",
        },
      ],
    }
  );

  return CartItem;
};
