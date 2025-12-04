import {
  applyDiscount,
  getWishlistedUsers,
  notifyUsers
} from '../../models/Discount.js';

export async function setDiscount(req, res, next) {
  try {
    const { productId, discountRate } = req.body;

    if (!productId || !discountRate) {
      return res.status(400).json({ message: 'productId and discountRate are required' });
    }

    // 1) Update product price
    const updatedProduct = await applyDiscount(productId, discountRate);

    // 2) Find impacted users
    const wishlistedUsers = await getWishlistedUsers(productId);

    // 3) Notify them
    await notifyUsers(wishlistedUsers, productId, discountRate);

    return res.json({
      message: 'Discount applied & users notified',
      product: updatedProduct,
      notifiedUsers: wishlistedUsers.length
    });

  } catch (err) {
    next(err);
  }
}
