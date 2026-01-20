"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Cart = sequelize.define(
    "Cart",
    {
      cart_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // secure UUID
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
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
        defaultValue: 1,
        validate: {
          min: 1,
          isInt: true,
        },
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
      tableName: "cart",
      timestamps: false,
      underscored: true,

      indexes: [
        {
          unique: true,
          fields: ["user_id", "product_id"],
          name: "uq_cart_user_product",
        },
        { fields: ["user_id"] },
        { fields: ["product_id"] },
      ],

      hooks: {
        beforeUpdate: (cart) => {
          cart.updated_at = new Date();
        },
      },
    }
  );

  return Cart;
};
