"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Category = sequelize.define(
    "Category",
    {
      category_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // secure UUID
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: "categories",
      timestamps: false, // we manually manage timestamps
      underscored: true,

      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
      ],

      hooks: {
        beforeUpdate: (category) => {
          category.updated_at = new Date();
        },
      },
    }
  );

  return Category;
};
