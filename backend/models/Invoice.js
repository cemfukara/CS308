const db = require('../db'); // expect: { pool } or a query wrapper

// Helper: run a query and return [rows, fields]
async function query(sql, params = []) {
  // if db.pool is available
  if (db.pool && typeof db.pool.query === 'function') {
    return db.pool.query(sql, params); // returns [rows, fields]
  }
  // if db.query is available
  if (typeof db.query === 'function') {
    const [rows] = await db.query(sql, params);
    return [rows];
  }
  throw new Error('db module must export pool or query');
}

module.exports = {
  // Get invoices (orders with status not 'cart') in date range
  async getInvoicesByDateRange(startDate, endDate) {
    const sql = `
      SELECT o.order_id,
             o.user_id,
             u.email AS user_email,
             o.total_price,
             o.status,
             o.order_date,
             o.created_at
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      WHERE o.status != 'cart'
        AND o.order_date BETWEEN ? AND ?
      ORDER BY o.order_date DESC;
    `;
    const [rows] = await query(sql, [startDate, endDate]);
    return rows;
  },

  // Get single invoice (order header)
  async getInvoiceById(orderId) {
    const sql = `
      SELECT o.order_id,
             o.user_id,
             u.email AS user_email,
             o.total_price,
             o.status,
             o.order_date,
             o.created_at
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      WHERE o.order_id = ?
      LIMIT 1;
    `;
    const [rows] = await query(sql, [orderId]);
    return rows[0] || null;
  },

  // Get invoice items for an order
  async getInvoiceItems(orderId) {
    const sql = `
      SELECT oi.order_item_id,
             oi.product_id,
             p.name AS product_name,
             oi.quantity,
             oi.price_at_purchase
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id
      WHERE oi.order_id = ?
    `;
    const [rows] = await query(sql, [orderId]);
    return rows;
  },

  // Revenue/profit aggregate between dates
  async getRevenueProfitBetweenDates(startDate, endDate) {
    const sql = `
      SELECT
        COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total_revenue,
        COALESCE(SUM(oi.quantity * ( COALESCE(p.cost_price, oi.price_at_purchase * 0.5) )), 0) AS total_cost,
        COALESCE(SUM(
          oi.quantity * oi.price_at_purchase
          - oi.quantity * ( COALESCE(p.cost_price, oi.price_at_purchase * 0.5) )
        ), 0) AS total_profit
      FROM order_items oi
      JOIN orders o ON o.order_id = oi.order_id
      JOIN products p ON p.product_id = oi.product_id
      WHERE o.status != 'cart'
        AND o.order_date BETWEEN ? AND ?;
    `;
    const [rows] = await query(sql, [startDate, endDate]);
    return rows[0] || { total_revenue: 0, total_cost: 0, total_profit: 0 };
  },

  // Chart data grouped by date (day granularity)
  async getRevenueProfitChart(startDate, endDate) {
    const sql = `
      SELECT DATE(o.order_date) AS day,
             COALESCE(SUM(oi.quantity * oi.price_at_purchase),0) AS revenue,
             COALESCE(SUM(oi.quantity * ( COALESCE(p.cost_price, oi.price_at_purchase * 0.5) )),0) AS cost,
             COALESCE(SUM(
               oi.quantity * oi.price_at_purchase
               - oi.quantity * ( COALESCE(p.cost_price, oi.price_at_purchase * 0.5) )
             ),0) AS profit
      FROM order_items oi
      JOIN orders o ON o.order_id = oi.order_id
      JOIN products p ON p.product_id = oi.product_id
      WHERE o.status != 'cart'
        AND o.order_date BETWEEN ? AND ?
      GROUP BY DATE(o.order_date)
      ORDER BY day ASC;
    `;
    const [rows] = await query(sql, [startDate, endDate]);
    return rows;
  }
};
