// This file defines logic for handling orders (create order, get order history, etc.).
import {
<<<<<<< Updated upstream
    getUserOrders,
    getOrderItems,
    updateOrderStatus
} from '../models/order.js';
=======
  getUserOrders,
  getAllOrders,
  getOrderItems,
  updateOrderStatus,
  createOrder,
  getOrderById,
} from '../../models/Order.js';
import { generateInvoicePDF } from '../../utils/pdfGenerator.js';
import { sendInvoiceEmail } from '../../utils/sendEmail.js';
>>>>>>> Stashed changes

// ===================================================================
// GET all user orders (except carts)
// ===================================================================
export async function getOrders(req, res) {
    try {
        const userId = req.user.id; // assuming JWT middleware sets req.user
        const orders = await getUserOrders(userId);

        res.status(200).json({
            success: true,
            orders
        });
    } catch (err) {
        console.error("Error fetching user orders:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// ===================================================================
// GET items inside a specific order
// ===================================================================
export async function getOrderDetails(req, res) {
    try {
        const orderId = req.params.orderId;

        const items = await getOrderItems(orderId);

        res.status(200).json({
            success: true,
            orderId,
            items
        });
    } catch (err) {
        console.error("Error fetching order items:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// ===================================================================
// CHECKOUT — change order status from 'cart' to new status
// ===================================================================
export async function checkoutOrder(req, res) {
    try {
        const orderId = req.params.orderId;
        const { status } = req.body; // e.g. "completed", "pending_payment" etc.

        if (!status) {
            return res
                .status(400)
                .json({ success: false, message: "Missing status field" });
        }

        await updateOrderStatus(orderId, status);

        res.status(200).json({
            success: true,
            message: "Order status updated successfully"
        });
    } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
<<<<<<< Updated upstream
=======

    await updateOrderStatus(orderId, status);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ==========================================================
// POST /api/orders
//  - Create new order from cart items
//  - Send invoice email with PDF attachment
// ==========================================================
export async function createOrderController(req, res) {
  try {
    const userId = req.user.user_id;
    const { items, address, payment } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    const normalizedItems = items.map((it) => ({
      product_id: it.product_id,
      quantity: it.quantity || 1,
      price: Number(it.price) || 0,
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

    // ===== SEND INVOICE EMAIL =====
    // This runs asynchronously and won't block the response
    // Email failures are logged but don't affect order creation
    (async () => {
      try {
        // Fetch complete order details with customer email
        const [orderDetails, orderItems] = await Promise.all([
          getOrderById(order_id),
          getOrderItems(order_id),
        ]);

        if (!orderDetails || !orderDetails.customer_email) {
          console.warn(
            `Cannot send invoice for order #${order_id}: missing customer email`
          );
          return;
        }

        // Generate PDF invoice
        const pdfBuffer = await generateInvoicePDF(orderDetails, orderItems);

        // Send email with PDF attachment
        const emailResult = await sendInvoiceEmail(
          orderDetails.customer_email,
          'Valued Customer',
          order_id,
          pdfBuffer
        );

        if (!emailResult.success) {
          console.error(
            `Failed to send invoice email for order #${order_id}:`,
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error(
          `Error in email sending process for order #${order_id}:`,
          emailError
        );
      }
    })();

    res.status(201).json({
      success: true,
      order_id,
      total_price: totalPrice,
      payment: payment || null,
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
>>>>>>> Stashed changes
}

