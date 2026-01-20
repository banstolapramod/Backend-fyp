"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Wishlist = sequelize.define(
    "Wishlist",
    {
      wishlist_id: {
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
    },
    {
      tableName: "wishlist",
      timestamps: false,
      underscored: true,

      indexes: [
        {
          unique: true,
          fields: ["user_id", "product_id"],
          name: "uq_wishlist_user_product",
        },
        { fields: ["user_id"] },
        { fields: ["product_id"] },
      ],
    }
  );

  return Wishlist;
};
