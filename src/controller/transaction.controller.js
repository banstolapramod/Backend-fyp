"use strict";

const { Transaction, sequelize } = require("../models");

/**
 * Create a transaction
 * (usually after payment confirmation)
 */
exports.createTransaction = async (req, res) => {
  const { order_id, payment_id, transaction_status } = req.body;

  const t = await sequelize.transaction();
  try {
    const transaction = await Transaction.create(
      {
        order_id,
        payment_id,
        transaction_status,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json(transaction);
  } catch (error) {
    await t.rollback();
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Get all transactions
 * (admin use)
 */
exports.getAllTransactions = async (_req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [["transaction_date", "DESC"]],
    });

    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get transaction by ID
 */
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.json(transaction);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get transactions by order ID
 */
exports.getTransactionsByOrder = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { order_id: req.params.orderId },
      order: [["transaction_date", "DESC"]],
    });

    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update transaction status
 * (used by payment webhooks / admin)
 */
exports.updateTransactionStatus = async (req, res) => {
  const { transaction_status } = req.body;

  try {
    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    transaction.transaction_status = transaction_status;
    await transaction.save();

    return res.json(transaction);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
