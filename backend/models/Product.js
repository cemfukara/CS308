// backend/models/Product.js
// Updated to match the MySQL schema you provided

import { db } from '../app/config/db.js';

// VALID sortable columns (must exist in DB)
const validSortColumns = [
  'product_id',
  'name',
  'price',
  'list_price',
  'quantity_in_stock',
  'discount_ratio',
];

// GET ALL PRODUCTS (pagination, search, sorting, category filter)
export async function getAllProducts({
  limit = 10,
  page = 1,
  sortBy = 'product_id',
  sortOrder = 'ASC',
  search = '',
  category = null,
} = {}) {
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  const queryParams = [];

  // Search condition
  if (search) {
    whereClause += ` AND (name LIKE ? OR description LIKE ?)`;
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  // Category filter
  if (category) {
    whereClause += ` AND category_id = ?`;
    queryParams.push(category);
  }

  // Sort sanitization
  const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'product_id';
  const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  // 1. Count
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS totalCount FROM products ${whereClause}`,
    queryParams
  );

  const totalCount = countRows[0].totalCount;

  // 2. Main product query
  const productQuery = `
        SELECT
            product_id,
            category_id,
            name,
            model,
            serial_number,
            description,
            quantity_in_stock,
            price,
            list_price,
            warranty_status,
            distributor_info,
            discount_ratio,
            (list_price - price) AS discount_amount
        FROM products
        ${whereClause}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ? OFFSET ?
    `;

  queryParams.push(Number(limit), offset);

  const [rows] = await db.query(productQuery, queryParams);

  return {
    products: rows,
    totalCount,
    currentPage: Number(page),
    limit: Number(limit),
  };
}

// GET PRODUCT BY ID
export async function getProductById(productId) {
  const [rows] = await db.query(`SELECT * FROM products WHERE product_id = ?`, [
    productId,
  ]);

  return rows[0];
}

// CREATE PRODUCT (matches your SQL columns)
export async function createProduct(productData) {
  const {
    category_id,
    name,
    model,
    serial_number,
    description,
    quantity_in_stock,
    price,
    list_price,
    warranty_status,
    distributor_info,
  } = productData;

  const [result] = await db.query(
    `
        INSERT INTO products (
            category_id,
            name,
            model,
            serial_number,
            description,
            quantity_in_stock,
            price,
            list_price,
            warranty_status,
            distributor_info
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
    [
      category_id || null,
      name,
      model || null,
      serial_number || null,
      description || null,
      quantity_in_stock ?? 0,
      price,
      list_price || null,
      warranty_status || null,
      distributor_info || null,
    ]
  );

  return result.insertId;
}

// UPDATE PRODUCT
export async function updateProduct(productId, productData) {
  const fields = Object.keys(productData)
    .filter((key) => key !== 'product_id') // protect PK
    .map((key) => `${key} = ?`)
    .join(', ');

  if (!fields) return 0;

  const values = Object.values(productData);
  values.push(productId);

  const [result] = await db.query(
    `UPDATE products SET ${fields} WHERE product_id = ?`,
    values
  );

  return result.affectedRows;
}

// DELETE PRODUCT
export async function deleteProduct(productId) {
  const [result] = await db.query(`DELETE FROM products WHERE product_id = ?`, [
    productId,
  ]);

  return result.affectedRows;
}

async function applyDiscount(productIds, discount) {
    const placeholders = productIds.map(() => '?').join(',');

    // Update product prices
    await db.pool.query(`
        UPDATE products 
        SET price = list_price * (1 - ? / 100)
        WHERE product_id IN (${placeholders})
    `, [discount, ...productIds]);

    // Get affected products
    const [rows] = await db.pool.query(`
        SELECT product_id, name FROM products
        WHERE product_id IN (${placeholders})
    `, productIds);

    return rows;
}