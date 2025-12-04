// Controllers for privileged roles

import { getAllOrders, updateOrderStatus } from '../../models/Admin.js';

/*---------------Product Manager Controllers--------------*/

// Get deliveries (orders with status !'cart')
export const getDeliveries = async (req, res) => {
  try {
    const orders = await getAllOrders();

    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper array of allowed statuses
const ALLOWED_STATUS_SET = new Set([
  // no "cart" status as it will be stupid to update status to cart
  'processing',
  'in-transit',
  'delivered',
  'cancelled',
]);

// Array is frozen to prevent modification in runtime
Object.freeze(ALLOWED_STATUS_SET);

// Patch a delivery status by order_id
export const updateOrderStatusController = async (req, res) => {
  try {
    // get status from body and convert it to lowercase
    const status = req.body.status?.toLowerCase();

    // Check status is one of allowed
    if (!ALLOWED_STATUS_SET.has(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // get order id from parameters
    const order_id = parseInt(req.params.id);

    // Check order_id
    if (isNaN(order_id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    // execute update
    const updated = await updateOrderStatus(order_id, status);

    // if no rows were affected, then order is not found
    if (!updated) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Delivery status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
