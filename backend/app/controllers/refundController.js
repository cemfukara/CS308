// backend/app/controllers/refundController.js
import {
  createRefundRequest,
  getPendingRefunds,
  getRefundById,
  updateRefundStatus,
  getRefundByOrderItemId,
  getRefundedQuantityByOrderItemId,
} from '../../models/Refund.js';
import { updateOrderStatus } from '../../models/Order.js';
import { db } from '../config/db.js';
import {
  sendRefundApprovedEmail,
  sendRefundRejectedEmail,
} from '../../utils/emailService.js';

import logger from '../../utils/logger.js';

// POST /api/refunds/request
export async function requestRefund(req, res) {
  try {
    const userId = req.user.user_id;
    const { orderId, orderItemId, quantity, reason } = req.body;

    logger.info('Refund request initiated', {
      userId,
      orderId,
      orderItemId,
      quantity,
    });

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
      logger.warn('Refund request failed: order item not found', {
        userId,
        orderId,
        orderItemId,
      });
      return res
        .status(404)
        .json({ message: 'Order item not found or does not belong to you.' });
    }

    const item = rows[0];

    const validStatuses = [
      'delivered',
      'refund request sent',
      'refund accepted',
      'refund rejected',
    ];

    const currentStatus = item.status?.toLowerCase();
    if (!validStatuses.includes(currentStatus)) {
      logger.warn('Refund request rejected due to invalid order status', {
        userId,
        orderId,
        status: item.status,
      });
      return res.status(400).json({
        message: `Refunds are not available for orders with status: ${item.status}`,
      });
    }

    const orderDate = new Date(item.order_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (orderDate < thirtyDaysAgo) {
      logger.warn('Refund request expired (30-day limit)', {
        userId,
        orderId,
      });
      return res
        .status(400)
        .json({ message: 'Refund period (30 days) has expired.' });
    }

    const currentRefundedQty =
      await getRefundedQuantityByOrderItemId(orderItemId);
    const availableQty = item.purchased_qty - currentRefundedQty;

    if (quantity <= 0 || quantity > availableQty) {
      logger.warn('Invalid refund quantity requested', {
        userId,
        orderItemId,
        requested: quantity,
        available: availableQty,
      });
      return res.status(400).json({
        message: `Cannot refund ${quantity} items. Only ${availableQty} remaining valid for refund.`,
      });
    }

    const refundAmount = Number(item.price_at_purchase) * Number(quantity);

    await createRefundRequest({
      order_item_id: orderItemId,
      order_id: orderId,
      user_id: userId,
      quantity: Number(quantity),
      refund_amount: refundAmount,
      reason: reason || 'Customer request',
    });

    await updateOrderStatus(orderId, 'Refund Request Sent');

    logger.info('Refund request created successfully', {
      userId,
      orderId,
      orderItemId,
      refundAmount,
    });

    res.status(201).json({ message: 'Refund request submitted successfully.' });
  } catch (err) {
    logger.error('Refund request processing failed', {
      userId: req.user?.user_id ?? null,
      error: err,
    });
    res
      .status(500)
      .json({ message: 'Server error processing refund request.' });
  }
}

// GET /api/admin/refunds/pending
export async function getRefundsQueue(req, res) {
  try {
    logger.info('Fetching pending refunds queue', {
      actor: req.user?.user_id,
    });

    const refunds = await getPendingRefunds();

    logger.info('Pending refunds fetched', {
      count: refunds.length,
    });

    res.json(refunds);
  } catch (err) {
    logger.error('Failed to fetch refund queue', { error: err });
    res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/admin/refunds/:id/approve
export async function approveRefund(req, res) {
  try {
    const refundId = req.params.id;
    const smUserId = req.user.user_id;

    logger.info('Refund approval initiated', {
      refundId,
      approvedBy: smUserId,
    });

    const refund = await getRefundById(refundId);
    if (!refund) {
      logger.warn('Refund not found for approval', { refundId });
      return res.status(404).json({ message: 'Refund not found' });
    }

    if (refund.status !== 'requested') {
      logger.warn('Refund approval rejected: invalid state', {
        refundId,
        status: refund.status,
      });
      return res
        .status(400)
        .json({ message: `Refund is already ${refund.status}` });
    }

    await updateRefundStatus(refundId, 'approved', smUserId);
    await updateOrderStatus(refund.order_id, 'Refund Accepted');

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

    await db.query(
      `UPDATE products SET quantity_in_stock = quantity_in_stock + ? WHERE product_id = ?`,
      [refund.quantity, details.product_id]
    );

    await sendRefundApprovedEmail(
      details.email,
      refund.refund_amount,
      'TRY',
      details.name
    );

    logger.info('Refund approved successfully', {
      refundId,
      orderId: refund.order_id,
      quantity: refund.quantity,
      amount: refund.refund_amount,
    });

    res.json({
      message: 'Refund approved, stock updated, and email sent.',
    });
  } catch (err) {
    logger.error('Refund approval failed', {
      refundId: req.params?.id ?? null,
      error: err,
    });
    res.status(500).json({ message: 'Server error approving refund' });
  }
}

// PATCH /api/admin/refunds/:id/reject
export async function rejectRefund(req, res) {
  try {
    const refundId = req.params.id;
    const smUserId = req.user.user_id;

    logger.info('Refund rejection initiated', {
      refundId,
      rejectedBy: smUserId,
    });

    const refund = await getRefundById(refundId);
    if (!refund) {
      logger.warn('Refund not found for rejection', { refundId });
      return res.status(404).json({ message: 'Refund not found' });
    }

    if (refund.status !== 'requested') {
      logger.warn('Refund rejection rejected: invalid state', {
        refundId,
        status: refund.status,
      });
      return res
        .status(400)
        .json({ message: `Refund is already ${refund.status}` });
    }

    await updateRefundStatus(refundId, 'rejected', smUserId);
    await updateOrderStatus(refund.order_id, 'Refund Rejected');

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

    if (rows.length > 0) {
      await sendRefundRejectedEmail(rows[0].email, rows[0].product_name);
    }

    logger.info('Refund rejected successfully', {
      refundId,
      orderId: refund.order_id,
    });

    res.json({ message: 'Refund rejected.' });
  } catch (err) {
    logger.error('Refund rejection failed', {
      refundId: req.params?.id ?? null,
      error: err,
    });
    res.status(500).json({ message: 'Server error rejecting refund' });
  }
}
