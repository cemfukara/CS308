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
  // Logic: Cost is either the stored 'cost' on the product or 50% of the sale price.
  const sql = `
    SELECT
      COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total_revenue,
      
      COALESCE(SUM(
        oi.quantity * COALESCE(p.cost, oi.price_at_purchase * 0.5)
      ), 0) AS total_cost,
      
      COALESCE(SUM(
        (oi.quantity * oi.price_at_purchase) - 
        (oi.quantity * COALESCE(p.cost, oi.price_at_purchase * 0.5))
      ), 0) AS total_profit

    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    LEFT JOIN products p ON p.product_id = oi.product_id
    WHERE o.status = 'delivered'
      AND o.order_date >= ?
      AND o.order_date < DATE_ADD(?, INTERVAL 1 DAY)
  `;

  const [rows] = await query(sql, [startDate, endDate]);
  return rows[0] || { total_revenue: 0, total_cost: 0, total_profit: 0 };
}

export async function getRevenueProfitChart(startDate, endDate) {
  const sql = `
    SELECT 
      DATE_FORMAT(o.order_date, '%Y-%m-%d') AS day,
      
      COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS revenue,
      
      COALESCE(SUM(
        oi.quantity * COALESCE(p.cost, oi.price_at_purchase * 0.5)
      ), 0) AS cost,
      
      COALESCE(SUM(
        (oi.quantity * oi.price_at_purchase) - 
        (oi.quantity * COALESCE(p.cost, oi.price_at_purchase * 0.5))
      ), 0) AS profit

    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    LEFT JOIN products p ON p.product_id = oi.product_id
    WHERE o.status = 'delivered'
      AND o.order_date >= ?
      AND o.order_date < DATE_ADD(?, INTERVAL 1 DAY)
    GROUP BY day
    ORDER BY day ASC;
  `;

  const [rows] = await query(sql, [startDate, endDate]);
  return rows;
}