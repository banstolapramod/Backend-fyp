"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      transaction_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "orders",
          key: "order_id",
        },
        onDelete: "CASCADE",
      },

      payment_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "payments",
          key: "payment_id",
        },
        onDelete: "CASCADE",
      },

      transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      transaction_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: "transactions",
      timestamps: false,
      underscored: true,

      indexes: [
        { fields: ["order_id"] },
        { fields: ["payment_id"] },
        { fields: ["transaction_status"] },
      ],
    }
  );

  return Transaction;
};
