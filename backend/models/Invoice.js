import { db } from '../app/config/db.js'; // MUST have .js extension when using ESM

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

// ---------- EXPORT FUNCTIONS USING ESM ----------
export async function getInvoicesByDateRange(startDate, endDate) {
  const sql = `
    SELECT 
      o.order_id,
      o.user_id,
      u.email AS user_email,
      o.total_price,
      o.status,
      o.order_date,
      o.created_at,

      JSON_ARRAYAGG(
        JSON_OBJECT(
          'product_name', p.name,
          'quantity', oi.quantity
        )
      ) AS items

    FROM orders o
    JOIN users u ON u.user_id = o.user_id
    JOIN order_items oi ON oi.order_id = o.order_id
    JOIN products p ON p.product_id = oi.product_id

    WHERE o.status != 'cart'
      AND o.order_date BETWEEN ? AND ?

    GROUP BY 
      o.order_id, 
      o.user_id, 
      u.email,
      o.total_price,
      o.status,
      o.order_date,
      o.created_at

    ORDER BY o.order_date DESC;
`;
  const [rows] = await query(sql, [startDate, endDate]);
  return rows;
}

export async function getInvoiceById(orderId) {
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
}

export async function getInvoiceItems(orderId) {
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
}

export async function getRevenueProfitBetweenDates(startDate, endDate) {
  const COST_RATIO = 0.5; // 50% default cost

  const sql = `
    SELECT
      COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total_revenue,
      COALESCE(SUM(oi.quantity * oi.price_at_purchase * ${COST_RATIO}), 0) AS total_cost,
      COALESCE(SUM(
        oi.quantity * oi.price_at_purchase
        - oi.quantity * oi.price_at_purchase * ${COST_RATIO}
      ), 0) AS total_profit
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.status != 'cart'
      AND o.order_date BETWEEN ? AND ?;
  `;

  const [rows] = await query(sql, [startDate, endDate]);
  return rows[0] || { total_revenue: 0, total_cost: 0, total_profit: 0 };
}

export async function getRevenueProfitChart(startDate, endDate) {
  const COST_RATIO = 0.5; // 50% default cost

  const sql = `
    SELECT 
      DATE(o.order_date) AS day,
      COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS revenue,
      COALESCE(SUM(oi.quantity * oi.price_at_purchase * ${COST_RATIO}), 0) AS cost,
      COALESCE(SUM(
        oi.quantity * oi.price_at_purchase
        - oi.quantity * oi.price_at_purchase * ${COST_RATIO}
      ), 0) AS profit
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.status != 'cart'
      AND o.order_date BETWEEN ? AND ?
    GROUP BY DATE(o.order_date)
    ORDER BY day ASC;
  `;

  const [rows] = await query(sql, [startDate, endDate]);
  return rows;
}
