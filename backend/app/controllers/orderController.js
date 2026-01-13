// backend/app/controllers/orderController.js
// Logic for handling orders (listing, details, status updates).

import {
  getUserOrders,
  getOrderItems,
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  refundOrder,
} from '../../models/Order.js';

import { findById as findUserById } from '../../models/User.js';

// Email services
import { sendInvoiceEmail } from '../../utils/gmailService.js';

// PDF generator
import { generateInvoicePDF } from '../../utils/pdfGenerator.js';

import logger from '../../utils/logger.js';

// ==========================================================
// GET /api/orders
// ==========================================================
export async function getOrders(req, res) {
  try {
    const userId = req.user.user_id;

    const orders = await getUserOrders(userId);

    logger.info('User orders fetched', {
      userId,
      count: orders.length,
    });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    logger.error('Error fetching user orders', {
      userId: req.user_id,
      error: err,
    });

    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ==========================================================
// GET /api/orders/:id
// ==========================================================
export async function getOrderDetails(req, res) {
  try {
    const userId = req.user.user_id;
    const orderId = req.params.id;

    const [order, items] = await Promise.all([
      getOrderById(orderId, userId),
      getOrderItems(orderId, userId),
    ]);

    if (!order) {
      logger.warn('Order details not found', {
        userId,
        orderId,
      });

      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    logger.info('Order details fetched', {
      userId,
      orderId,
      itemCount: items.length,
    });

    res.status(200).json({
      success: true,
      order,
      items,
    });
  } catch (err) {
    logger.error('Error fetching order details', {
      userId: req.user_id,
      orderId: req.params.id,
      error: err,
    });

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

// ==========================================================
// POST /api/orders
// ==========================================================
export async function createOrderController(req, res) {
  try {
    const userId = req.user.user_id;
    const { items, address, payment } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      logger.warn('Create order failed: empty items', { userId });

      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    if (!address) {
      logger.warn('Create order failed: missing address', { userId });

      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    const normalizedItems = items.map((it) => ({
      product_id: it.product_id,
      quantity: it.quantity || 1,
      price: Number(it.price) || 0,
      //currency: it.currency,
    }));

    const totalPrice = normalizedItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    const { order_id } = await createOrder({
      userId,
      items: normalizedItems,
      shippingAddress: address,
      totalPrice,
    });

    logger.info('Order created', {
      userId,
      orderId: order_id,
      totalPrice,
      itemCount: normalizedItems.length,
    });

    // ------------------------------
    // Invoice email (best-effort)
    // ------------------------------
    try {
      const [orderDetails, orderItems, userInfo] = await Promise.all([
        getOrderById(order_id, userId),
        getOrderItems(order_id, userId),
        findUserById(userId),
      ]);

      if (orderDetails?.customer_email) {
        const currency = normalizedItems[0]?.currency || 'TRY';

        const customerName = userInfo
          ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() ||
            'Customer'
          : 'Customer';

        const pdfBuffer = await generateInvoicePDF(
          {
            order_id,
            customer_email: orderDetails.customer_email,
            customer_name: customerName,
            customer_tax_id: userInfo?.tax_id || null,
            customer_address: userInfo?.address || null,
            shipping_address: orderDetails.shipping_address,
            status: orderDetails.status,
            total_price: totalPrice,
            order_date: orderDetails.order_date,
            currency,
          },
          orderItems
        );

        await sendInvoiceEmail(
          orderDetails.customer_email,
          order_id,
          pdfBuffer,
          {
            totalPrice,
            currency,
            customerName,
          }
        );

        logger.info('Invoice email sent', {
          orderId: order_id,
          userId,
        });
      }
    } catch (emailError) {
      logger.error('Invoice email failed (order still created)', {
        userId: req.user_id,
        orderId: req.params.id,
        error: emailError.message,
      });
    }

    res.status(201).json({
      success: true,
      order_id,
      total_price: totalPrice,
      payment: payment || null,
    });
  } catch (err) {
    logger.error('Error creating order', {
      userId: req.user_id,
      error: err,
    });

    if (err.stockErrors && Array.isArray(err.stockErrors)) {
      return res.status(400).json({
        success: false,
        message: err.message,
        stockErrors: err.stockErrors,
      });
    }

    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/*
---------------------------------------------------
--------------- Product Manager Controllers --------
---------------------------------------------------
*/

// ==========================================================
// GET /deliveries
// ==========================================================
export const getDeliveries = async (req, res) => {
  try {
    const orders = await getAllOrders();

    logger.info('Deliveries fetched', {
      count: orders.length,
    });

    res.status(200).json({ orders });
  } catch (error) {
    logger.error('Error loading deliveries', {
      error,
    });

    res.status(500).json({ message: 'Server error' });
  }
};

// Allowed statuses
const ALLOWED_STATUS_SET = new Set([
  'processing',
  'in-transit',
  'delivered',
  'cancelled',
  'refunded',
]);

Object.freeze(ALLOWED_STATUS_SET);

// ==========================================================
// PATCH /deliveries/:id/status
// ==========================================================
export const updateOrderStatusController = async (req, res) => {
  try {
    const status = req.body.status?.toLowerCase();
    const order_id = parseInt(req.params.id);

    if (!ALLOWED_STATUS_SET.has(status)) {
      logger.warn('Invalid order status update attempt', {
        orderId: order_id,
        status,
      });

      return res.status(400).json({ message: 'Invalid status value' });
    }

    if (isNaN(order_id)) {
      logger.warn('Invalid order ID in status update', {
        orderId: req.params.id,
      });

      return res.status(400).json({ message: 'Invalid order id' });
    }

    const updated = await updateOrderStatus(order_id, status);

    if (!updated) {
      logger.warn('Order status update failed: not found', {
        orderId: order_id,
      });

      return res.status(404).json({ message: 'Order not found' });
    }

    logger.info('Order status updated', {
      orderId: order_id,
      status,
    });

    res.status(200).json({ message: 'Delivery status updated' });
  } catch (err) {
    logger.error('Order status update error', {
      orderId: order_id,
      status: req.body.status?.toLowerCase(),
      error: err,
    });

    res.status(500).json({ message: 'Server error' });
  }
};

// ==========================================================
// POST /api/orders/:id/cancel
// ==========================================================
export async function cancelOrderController(req, res) {
  try {
    const userId = req.user.user_id;
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      logger.warn('Cancel order failed: invalid orderId', {
        userId,
        orderId: req.params.id,
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const result = await cancelOrder(orderId, userId);

    if (!result.success) {
      logger.warn('Cancel order rejected', {
        userId,
        orderId,
        reason: result.message,
      });

      return res.status(400).json(result);
    }

    logger.info('Order cancelled', {
      userId,
      orderId,
    });

    res.status(200).json(result);
  } catch (err) {
    logger.error('Error cancelling order', {
      userId: req.user_id,
      orderId: req.params.id,
      error: err,
    });

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

// ==========================================================
// POST /api/orders/:id/refund
// ==========================================================
export async function refundOrderController(req, res) {
  try {
    const userId = req.user.user_id;
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      logger.warn('Refund order failed: invalid orderId', {
        userId,
        orderId: req.params.id,
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const result = await refundOrder(orderId, userId);

    if (!result.success) {
      logger.warn('Refund order rejected', {
        userId,
        orderId,
        reason: result.message,
      });

      return res.status(400).json(result);
    }

    logger.info('Order refunded', {
      userId,
      orderId,
    });

    res.status(200).json(result);
  } catch (err) {
    logger.error('Error refunding order', {
      userId: req.user_id,
      orderId: req.params.id,
      error: err,
    });

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}
