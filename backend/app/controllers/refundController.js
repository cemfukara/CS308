// backend/app/controllers/refundController.js
import { 
  createRefundRequest, 
  getPendingRefunds, 
  getRefundById, 
  updateRefundStatus, 
  getRefundByOrderItemId,
  getRefundedQuantityByOrderItemId 
} from '../../models/Refund.js';
import { updateOrderStatus } from '../../models/Order.js'; 
import { db } from '../config/db.js'; 
import { 
  sendRefundApprovedEmail,
  sendRefundRejectedEmail 
} from '../../utils/emailService.js';

// POST /api/refunds/request
export async function requestRefund(req, res) {
  try {
    const userId = req.user.user_id;
    const { orderId, orderItemId, quantity, reason } = req.body;

    console.log(`[Refund Request] User ${userId} requesting refund for Item ${orderItemId}`);

    // 1. Fetch Order & Item details to validate
    const [rows] = await db.query(
      `
      SELECT 
        o.order_id, o.user_id, o.status, o.order_date,
        oi.order_item_id, oi.quantity AS purchased_qty, oi.price_at_purchase
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = ? AND oi.order_item_id = ? AND o.user_id = ?
      `,
      [orderId, orderItemId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order item not found or does not belong to you.' });
    }

    const item = rows[0];

    // 2. Validate Status
    // Allow refund if delivered OR if currently in a partial refund state
    const validStatuses = ['delivered', 'refund request sent', 'refund accepted', 'refund rejected'];
    const currentStatus = item.status?.toLowerCase();
    
    if (!validStatuses.includes(currentStatus)) {
      return res.status(400).json({ message: `Refunds are not available for orders with status: ${item.status}` });
    }

    // 3. Validate Date (30 days)
    const orderDate = new Date(item.order_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (orderDate < thirtyDaysAgo) {
      return res.status(400).json({ message: 'Refund period (30 days) has expired.' });
    }

    // 4. Validate Quantity Logic (Partial Refunds)
    // Check how many have ALREADY been refunded/requested
    const currentRefundedQty = await getRefundedQuantityByOrderItemId(orderItemId);
    const availableQty = item.purchased_qty - currentRefundedQty;

    if (quantity > availableQty) {
      return res.status(400).json({ 
        message: `Cannot refund ${quantity} items. Only ${availableQty} remaining valid for refund.` 
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity.' });
    }

    // 5. Calculate Refund Amount
    const refundAmount = Number(item.price_at_purchase) * Number(quantity);

    // 6. Create Request
    await createRefundRequest({
      order_item_id: orderItemId,
      order_id: orderId,
      user_id: userId,
      quantity: Number(quantity),
      refund_amount: refundAmount,
      reason: reason || 'Customer request'
    });

    // 7. UPDATE ORDER STATUS
    // We update status to indicate activity
    await updateOrderStatus(orderId, 'Refund Request Sent');

    console.log(`[Refund Request] Success. Amount: ${refundAmount}`);
    res.status(201).json({ message: 'Refund request submitted successfully.' });

  } catch (err) {
    console.error('[Refund Request Error]', err);
    res.status(500).json({ message: 'Server error processing refund request.' });
  }
}

// GET /api/admin/refunds/pending
export async function getRefundsQueue(req, res) {
  try {
    console.log('[Refunds Queue] Fetching pending refunds...');
    const refunds = await getPendingRefunds();
    console.log(`[Refunds Queue] Found ${refunds.length} pending requests.`);
    res.json(refunds);
  } catch (err) {
    console.error('[Refunds Queue Error]', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/admin/refunds/:id/approve
export async function approveRefund(req, res) {
  try {
    const refundId = req.params.id;
    const smUserId = req.user.user_id; 

    console.log(`[Refund Approve] ID: ${refundId} by SM: ${smUserId}`);

    const refund = await getRefundById(refundId);
    if (!refund) return res.status(404).json({ message: 'Refund not found' });

    if (refund.status !== 'requested') {
      return res.status(400).json({ message: `Refund is already ${refund.status}` });
    }

    // 1. Update Refund Status
    await updateRefundStatus(refundId, 'approved', smUserId);

    // 2. Update ORDER Status
    await updateOrderStatus(refund.order_id, 'Refund Accepted');

    // 3. Fetch details for Stock Update & Email
    const [rows] = await db.query(
      `
      SELECT oi.product_id, p.name, u.email, o.user_id, o.shipping_address_encrypted
      FROM refunds r
      JOIN order_items oi ON r.order_item_id = oi.order_item_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON r.order_id = o.order_id
      JOIN users u ON r.user_id = u.user_id
      WHERE r.refund_id = ?
      `,
      [refundId]
    );

    const details = rows[0];

    // 4. Add Stock Back (Selective)
    await db.query(
      `UPDATE products SET quantity_in_stock = quantity_in_stock + ? WHERE product_id = ?`,
      [refund.quantity, details.product_id]
    );

    // 5. Send Email
    await sendRefundApprovedEmail(
      details.email, 
      refund.refund_amount, 
      'TRY', 
      details.name
    );

    res.json({ message: 'Refund approved, stock updated, and email sent.' });

  } catch (err) {
    console.error('[Refund Approve Error]', err);
    res.status(500).json({ message: 'Server error approving refund' });
  }
}

// PATCH /api/admin/refunds/:id/reject
export async function rejectRefund(req, res) {
  try {
    const refundId = req.params.id;
    const smUserId = req.user.user_id;

    console.log(`[Refund Reject] ID: ${refundId}`);

    const refund = await getRefundById(refundId);
    if (!refund) return res.status(404).json({ message: 'Refund not found' });

    if (refund.status !== 'requested') {
      return res.status(400).json({ message: `Refund is already ${refund.status}` });
    }

    // 1. Update Refund Status
    await updateRefundStatus(refundId, 'rejected', smUserId);

    // 2. Update ORDER Status
    await updateOrderStatus(refund.order_id, 'Refund Rejected');

    // 3. Fetch details for Email
    const [rows] = await db.query(
      `
      SELECT u.email, p.name AS product_name
      FROM refunds r
      JOIN order_items oi ON r.order_item_id = oi.order_item_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN users u ON r.user_id = u.user_id
      WHERE r.refund_id = ?
      `,
      [refundId]
    );

    // 4. Send Email if details found
    if (rows.length > 0) {
      await sendRefundRejectedEmail(rows[0].email, rows[0].product_name);
    }

    res.json({ message: 'Refund rejected.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error rejecting refund' });
  }
}