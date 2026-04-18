const pool = require('../config/db');

const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.10');

// ── SHARED HELPER ─────────────────────────────────────────────────
// Calculate earnings for a vendor from delivered orders
async function calcVendorEarnings(vendorId) {
  // Total revenue from delivered orders containing vendor's products
  const revenueResult = await pool.query(
    `SELECT COALESCE(SUM(oi.subtotal), 0) as gross_revenue
     FROM order_items oi
     JOIN orders o ON o.order_id = oi.order_id
     JOIN products p ON p.product_id = oi.product_id
     WHERE p.vendor_id = $1
       AND o.order_status = 'delivered'
       AND o.payment_status = 'paid'`,
    [vendorId]
  );

  const grossRevenue = parseFloat(revenueResult.rows[0].gross_revenue);
  const commissionAmount = grossRevenue * COMMISSION_RATE;
  const netEarnings = grossRevenue - commissionAmount;

  // Total already paid out
  const paidResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total_paid
     FROM vendor_payouts WHERE vendor_id = $1`,
    [vendorId]
  );
  const totalPaid = parseFloat(paidResult.rows[0].total_paid);
  const pendingPayout = netEarnings - totalPaid;

  return {
    gross_revenue: grossRevenue,
    commission_rate: COMMISSION_RATE,
    commission_amount: commissionAmount,
    net_earnings: netEarnings,
    total_paid: totalPaid,
    pending_payout: Math.max(0, pendingPayout)
  };
}

// ── ADMIN ENDPOINTS ───────────────────────────────────────────────

// GET /api/payouts/admin/summary
// Returns earnings summary for all vendors
exports.getAdminPayoutSummary = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });

    // Get all approved vendors
    const vendors = await pool.query(
      `SELECT user_id, name, email FROM users
       WHERE role = 'vendor' AND vendor_status = 'approved' AND is_active = true
       ORDER BY name`
    );

    const summary = await Promise.all(vendors.rows.map(async (vendor) => {
      const earnings = await calcVendorEarnings(vendor.user_id);
      const lastPayout = await pool.query(
        `SELECT created_at, amount FROM vendor_payouts
         WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [vendor.user_id]
      );
      return {
        vendor_id: vendor.user_id,
        vendor_name: vendor.name,
        vendor_email: vendor.email,
        ...earnings,
        last_payout_date: lastPayout.rows[0]?.created_at || null,
        last_payout_amount: lastPayout.rows[0]?.amount || 0
      };
    }));

    const totalPlatformRevenue = summary.reduce((s, v) => s + v.commission_amount, 0);
    const totalPendingPayouts = summary.reduce((s, v) => s + v.pending_payout, 0);

    res.json({
      success: true,
      commission_rate: COMMISSION_RATE,
      platform_revenue: totalPlatformRevenue,
      total_pending_payouts: totalPendingPayouts,
      vendors: summary
    });
  } catch (err) {
    console.error('GET ADMIN PAYOUT SUMMARY ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch payout summary', details: err.message });
  }
};

// GET /api/payouts/admin/vendor/:vendorId
// Detailed payout history for a specific vendor
exports.getVendorPayoutHistory = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });

    const { vendorId } = req.params;
    const earnings = await calcVendorEarnings(vendorId);

    const payouts = await pool.query(
      `SELECT vp.payout_id, vp.amount, vp.commission_amount, vp.note, vp.created_at,
              u.name as paid_by_name
       FROM vendor_payouts vp
       LEFT JOIN users u ON u.user_id = vp.paid_by
       WHERE vp.vendor_id = $1
       ORDER BY vp.created_at DESC`,
      [vendorId]
    );

    res.json({ success: true, earnings, payouts: payouts.rows });
  } catch (err) {
    console.error('GET VENDOR PAYOUT HISTORY ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch payout history', details: err.message });
  }
};

// POST /api/payouts/admin/pay/:vendorId
// Admin marks a manual payout as done
exports.recordPayout = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });

    const { vendorId } = req.params;
    const { amount, note } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }

    const earnings = await calcVendorEarnings(vendorId);
    const commissionOnPayout = parseFloat(amount) * COMMISSION_RATE;

    const result = await pool.query(
      `INSERT INTO vendor_payouts (vendor_id, amount, commission_amount, note, paid_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [vendorId, parseFloat(amount), commissionOnPayout, note || null, req.user.id]
    );

    console.log(`✅ Admin ${req.user.email} recorded payout of ${amount} to vendor ${vendorId}`);

    res.json({
      success: true,
      message: `Payout of Rs. ${(parseFloat(amount) * 100).toFixed(2)} recorded successfully`,
      payout: result.rows[0],
      remaining_pending: Math.max(0, earnings.pending_payout - parseFloat(amount))
    });
  } catch (err) {
    console.error('RECORD PAYOUT ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to record payout', details: err.message });
  }
};

// ── VENDOR ENDPOINTS ──────────────────────────────────────────────

// GET /api/payouts/vendor/earnings
// Vendor sees their own earnings summary
exports.getMyEarnings = async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ success: false, error: 'Vendor only' });

    const earnings = await calcVendorEarnings(req.user.id);

    const payouts = await pool.query(
      `SELECT payout_id, amount, commission_amount, note, created_at
       FROM vendor_payouts WHERE vendor_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    // Monthly breakdown
    const monthly = await pool.query(
      `SELECT
         DATE_TRUNC('month', o.created_at) as month,
         COALESCE(SUM(oi.subtotal), 0) as gross,
         COALESCE(SUM(oi.subtotal), 0) * $1 as commission,
         COALESCE(SUM(oi.subtotal), 0) * (1 - $1) as net
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       JOIN products p ON p.product_id = oi.product_id
       WHERE p.vendor_id = $2
         AND o.order_status = 'delivered'
         AND o.payment_status = 'paid'
       GROUP BY DATE_TRUNC('month', o.created_at)
       ORDER BY month DESC
       LIMIT 6`,
      [COMMISSION_RATE, req.user.id]
    );

    res.json({
      success: true,
      commission_rate: COMMISSION_RATE,
      earnings,
      payouts: payouts.rows,
      monthly_breakdown: monthly.rows
    });
  } catch (err) {
    console.error('GET MY EARNINGS ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch earnings', details: err.message });
  }
};
