const WishlistModel = require('../model/wishlistModel');

// GET /api/wishlist
exports.getWishlist = async (req, res) => {
  try {
    const items = await WishlistModel.getItems(req.user.id);
    const productIds = items.map(i => i.product_id);
    res.json({ success: true, items, productIds, count: items.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch wishlist', details: err.message });
  }
};

// POST /api/wishlist/toggle
exports.toggleWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, error: 'product_id is required' });

    const already = await WishlistModel.isInWishlist(req.user.id, product_id);
    if (already) {
      await WishlistModel.removeItem(req.user.id, product_id);
      return res.json({ success: true, action: 'removed', message: 'Removed from favourites' });
    } else {
      await WishlistModel.addItem(req.user.id, product_id);
      return res.json({ success: true, action: 'added', message: 'Added to favourites' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update wishlist', details: err.message });
  }
};

// DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  try {
    const removed = await WishlistModel.removeItem(req.user.id, req.params.productId);
    if (!removed) return res.status(404).json({ success: false, error: 'Item not in wishlist' });
    res.json({ success: true, message: 'Removed from favourites' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove from wishlist', details: err.message });
  }
};
