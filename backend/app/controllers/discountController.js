const Products = require('../models/products');
const Notifications = require('../models/notification');

module.exports.applyDiscount = async (req, res) => {
    try {
        const { productIds, discount } = req.body;

        if (!productIds || !discount)
            return res.status(400).json({ error: 'Missing fields' });

        // Update prices
        const updated = await Products.applyDiscount(productIds, discount);

        // Send notifications
        for (const p of updated) {
            const message = `Good news! The product "${p.name}" is now ${discount}% off!`;
            await Notifications.notifyWishlistUsers(p.product_id, message);
        }

        return res.json({
            success: true,
            message: "Discount applied and users notified",
            updatedProducts: updated
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};
