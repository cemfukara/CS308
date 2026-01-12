// backend/app/controllers/refundController.js
<<<<<<< HEAD
// Controller for handling refund requests and processing

import {
  requestRefund,
  getPendingRefunds,
  processRefund,
  getUserRefunds,
} from '../../models/Refund.js';
import { sendRefundApprovalEmail } from '../../utils/gmailService.js';

/**
 * POST /api/refund/request
 * Customer requests a refund for an order item
 */
export async function requestRefundController(req, res) {
  try {
    const userId = req.user.user_id;
    const { order_item_id, quantity, reason } = req.body;

    // Validate required fields
    if (!order_item_id) {
      return res.status(400).json({
        success: false,
        message: 'order_item_id is required',
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required',
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reason for refund is required',
      });
    }

    // Request refund
    const refund = await requestRefund(
      userId,
      order_item_id,
      quantity,
      reason.trim()
    );

    res.status(201).json({
      success: true,
      message: 'Refund request submitted successfully',
      refund,
    });
  } catch (err) {
    console.error('❌ Error requesting refund:', err);

    // Handle specific validation errors
    if (
      err.message.includes('not found') ||
      err.message.includes('does not belong') ||
      err.message.includes('Cannot request refund') ||
      err.message.includes('Invalid quantity')
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Handle duplicate refund request (UNIQUE constraint violation)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message:
          'A refund request already exists for this order item. Each item can only be refunded once.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

/**
 * GET /api/refund/pending
 * Sales Manager/Product Manager views all pending refund requests
 */
export async function getPendingRefundsController(req, res) {
  try {
    const refunds = await getPendingRefunds();

    res.status(200).json({
      success: true,
      refunds,
    });
  } catch (err) {
    console.error('❌ Error fetching pending refunds:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

/**
 * PUT /api/refund/process
 * Sales Manager approves or rejects a refund request
 */
export async function processRefundController(req, res) {
  try {
    const salesManagerId = req.user.user_id;
    const { refund_id, decision } = req.body;

    // Validate required fields
    if (!refund_id) {
      return res.status(400).json({
        success: false,
        message: 'refund_id is required',
      });
    }

    if (!decision) {
      return res.status(400).json({
        success: false,
        message: 'decision is required',
      });
    }

    // Validate decision value
    if (decision !== 'approved' && decision !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: "decision must be either 'approved' or 'rejected'",
      });
    }

    // Process refund
    const refundDetails = await processRefund(
      refund_id,
      decision,
      salesManagerId
    );

    // Send email notification if approved
    if (decision === 'approved') {
      try {
        await sendRefundApprovalEmail(
          refundDetails.customer_email,
          refundDetails
        );
        console.log(
          `✅ Refund approval email sent to ${refundDetails.customer_email}`
        );
      } catch (emailError) {
        // Log email error but don't fail the refund processing
        console.error('❌ Failed to send refund email:', emailError.message);
        console.error(
          'Refund was processed successfully but email failed. Refund ID:',
          refund_id
        );
      }
    }

    res.status(200).json({
      success: true,
      message: `Refund ${decision} successfully`,
      refund: refundDetails,
    });
  } catch (err) {
    console.error('❌ Error processing refund:', err);

    // Handle specific validation errors
    if (
      err.message.includes('not found') ||
      err.message.includes('already been processed') ||
      err.message.includes('Decision must be')
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

/**
 * GET /api/refund/my-refunds
 * Customer views their own refund requests
 */
export async function getMyRefundsController(req, res) {
  try {
    const userId = req.user.user_id;
    const refunds = await getUserRefunds(userId);

    res.status(200).json({
      success: true,
      refunds,
    });
  } catch (err) {
    console.error('❌ Error fetching user refunds:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}
=======
import { 
  createRefundRequest, 
  getPendingRefunds, 
  getRefundById, 
  updateRefundStatus, 
  getRefundByOrderItemId 
} from '../../models/Refund.js';
import { db } from '../config/db.js'; 
import { sendRefundApprovedEmail } from '../../utils/emailService.js';

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
    if (item.status !== 'delivered') {
      return res.status(400).json({ message: 'Refunds are only available for delivered orders.' });
    }

    // 3. Validate Date (30 days)
    const orderDate = new Date(item.order_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Note: If orderDate > thirtyDaysAgo, it is RECENT. 
    if (orderDate < thirtyDaysAgo) {
      return res.status(400).json({ message: 'Refund period (30 days) has expired.' });
    }

    // 4. Validate Quantity
    if (quantity > item.purchased_qty || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity.' });
    }

    // 5. Check duplicate request
    const existing = await getRefundByOrderItemId(orderItemId);
    if (existing) {
      return res.status(400).json({ message: 'A refund request already exists for this item.' });
    }

    // 6. Calculate Refund Amount
    const refundAmount = Number(item.price_at_purchase) * Number(quantity);

    // 7. Create Request
    await createRefundRequest({
      order_item_id: orderItemId,
      order_id: orderId,
      user_id: userId,
      quantity: Number(quantity),
      refund_amount: refundAmount,
      reason: reason || 'Customer request'
    });

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

    // 2. Fetch details for Stock Update & Email
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

    // 3. Add Stock Back
    await db.query(
      `UPDATE products SET quantity_in_stock = quantity_in_stock + ? WHERE product_id = ?`,
      [refund.quantity, details.product_id]
    );

    // 4. Send Email
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

    await updateRefundStatus(refundId, 'rejected', smUserId);

    res.json({ message: 'Refund rejected.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error rejecting refund' });
  }
}
>>>>>>> a53fc339d42534d0784c53bda5f20306552af8f2
