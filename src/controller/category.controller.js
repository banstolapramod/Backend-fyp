"use strict";

const { Category } = require("../models");

/**
 * Create a new category
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await Category.create({
      name,
      description,
    });

    return res.status(201).json(category);
  } catch (error) {
    // Handle unique constraint error
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Category already exists" });
    }

    return res.status(400).json({ error: error.message });
  }
};

/**
 * Get all categories
 */
exports.getAllCategories = async (_req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["created_at", "DESC"]],
    });

    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get category by ID
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.json(category);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update category
 */
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.update({
      name: name ?? category.name,
      description: description ?? category.description,
    });

    return res.json(category);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Category name already exists" });
    }

    return res.status(400).json({ error: error.message });
  }
};

/**
 * Delete category
 */
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.destroy({
      where: { category_id: req.params.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.json({ message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
