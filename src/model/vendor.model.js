"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Vendor = sequelize.define(
    "Vendor",
    {
      vendor_id: {
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

      store_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },

      store_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      store_logo: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },

      total_sales: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          isInt: true,
        },
      },

      rating: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: true,
        validate: {
          min: 0,
          max: 5,
          isDecimal: true,
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
      tableName: "vendors",
      timestamps: false,
      underscored: true,

      indexes: [
        { fields: ["user_id"] },
        { fields: ["rating"] },
        { fields: ["total_sales"] },
      ],

      hooks: {
        beforeUpdate: (vendor) => {
          vendor.updated_at = new Date();
        },
      },
    }
  );

  return Vendor;
};
