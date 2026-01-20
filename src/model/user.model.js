"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      user_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // secure UUID
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 150],
        },
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },

      password_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      role: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "user",
        comment: "user | admin | vendor",
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: "users",
      timestamps: false,
      underscored: true,

      indexes: [
        { unique: true, fields: ["email"] },
        { fields: ["role"] },
        { fields: ["is_active"] },
      ],

      hooks: {
        beforeUpdate: (user) => {
          user.updated_at = new Date();
        },
      },
    }
  );

  return User;
};
