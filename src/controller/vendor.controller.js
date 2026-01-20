"use strict";

const { Vendor } = require("../models");

/**
 * Create vendor profile
 * (usually when a user becomes a vendor)
 */
exports.createVendor = async (req, res) => {
  try {
    const {
      user_id,
      store_name,
      store_description,
      store_logo,
    } = req.body;

    const vendor = await Vendor.create({
      user_id,
      store_name,
      store_description,
      store_logo,
    });

    return res.status(201).json(vendor);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Get all vendors
 */
exports.getAllVendors = async (_req, res) => {
  try {
    const vendors = await Vendor.findAll({
      order: [["created_at", "DESC"]],
    });

    return res.json(vendors);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get vendor by ID
 */
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    return res.json(vendor);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get vendor by user ID
 */
exports.getVendorByUserId = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      where: { user_id: req.params.userId },
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found for this user" });
    }

    return res.json(vendor);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update vendor profile
 */
exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const {
      store_name,
      store_description,
      store_logo,
      rating,
      total_sales,
    } = req.body;

    await vendor.update({
      store_name: store_name ?? vendor.store_name,
      store_description: store_description ?? vendor.store_description,
      store_logo: store_logo ?? vendor.store_logo,
      rating: rating ?? vendor.rating,
      total_sales: total_sales ?? vendor.total_sales,
    });

    return res.json(vendor);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Delete vendor
 */
exports.deleteVendor = async (req, res) => {
  try {
    const deleted = await Vendor.destroy({
      where: { vendor_id: req.params.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    return res.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
