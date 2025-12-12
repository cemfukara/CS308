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

  // popularity = total quantity sold in order_items
  let orderByClause = `ORDER BY ${safeSortBy} ${safeSortOrder}`;
  if (sortBy === 'popularity') {
    orderByClause = `
      ORDER BY (
        SELECT COALESCE(SUM(oi.quantity), 0)
        FROM order_items oi
        WHERE oi.product_id = products.product_id
      ) ${safeSortOrder}
    `;
  }

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
            currency,
            (list_price - price) AS discount_amount
        FROM products
        ${whereClause}
        ${orderByClause}
        LIMIT ? OFFSET ?
    `;

  queryParams.push(Number(limit), offset);

  const [rows] = await db.query(productQuery, queryParams);

  // ---- Attach product_images ----
  const productIds = rows.map((p) => p.product_id);

  if (productIds.length > 0) {
    const [imageRows] = await db.query(
      `
        SELECT
          image_id,
          product_id,
          image_url,
          is_primary,
          display_order
        FROM product_images
        WHERE product_id IN (?)
        ORDER BY is_primary DESC, display_order ASC, image_id ASC
      `,
      [productIds]
    );

    const imagesByProduct = {};
    for (const img of imageRows) {
      if (!imagesByProduct[img.product_id]) {
        imagesByProduct[img.product_id] = [];
      }
      imagesByProduct[img.product_id].push(img);
    }

    for (const p of rows) {
      p.product_images = imagesByProduct[p.product_id] || [];
    }
  } else {
    // no products → still return a consistent shape
    for (const p of rows) {
      p.product_images = [];
    }
  }

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

  const product = rows[0];
  if (!product) return null;

  const [imageRows] = await db.query(
    `
      SELECT
        image_id,
        product_id,
        image_url,
        is_primary,
        display_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, display_order ASC, image_id ASC
    `,
    [productId]
  );

  product.product_images = imageRows || [];
  return product;
}

/*
---------------------------------------------------
---------------Sales Manager Models----------------
---------------------------------------------------
*/

// Helper for DB queries
async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

/**
 * Apply discount by updating only the price.
 * list_price stays the same, discount_ratio is auto-calculated.
 */
export async function applyDiscount(productId, discountPercent) {
  // Get original list_price to calculate new price
  const [rows] = await db.execute(
    `SELECT price, list_price FROM products WHERE product_id = ?`,
    [productId]
  );

  if (!rows.length) {
    throw new Error('Product not found');
  }

  const product = rows[0];

  const { list_price } = product;

  if (!list_price || list_price <= 0) {
    throw new Error('list_price must be set before applying discount');
  }

  // Calculate discounted price
  const newPrice = list_price - list_price * (discountPercent / 100);

  // Update product price
  const sql = `
    UPDATE products
    SET price = ?
    WHERE product_id = ?
  `;
  await query(sql, [newPrice, productId]);

  // Return updated product
  const updated = await query(`SELECT * FROM products WHERE product_id = ?`, [
    productId,
  ]);
  return updated[0];
}

/*
---------------------------------------------------
---------------Product Manager Models--------------
---------------------------------------------------
*/

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
  // 1) Delete order_items referencing this product
  await db.query(`DELETE FROM order_items WHERE product_id = ?`, [productId]);

  // 2) Delete reviews for this product
  await db.query(`DELETE FROM reviews WHERE product_id = ?`, [productId]);

  // 3) Delete wishlist items containing this product
  await db.query(`DELETE FROM wishlists WHERE product_id = ?`, [productId]);

  // 4) Delete product images
  await db.query(`DELETE FROM product_images WHERE product_id = ?`, [
    productId,
  ]);

  // 5) Delete cart items (if your schema has such table)
  await db
    .query(`DELETE FROM cart_items WHERE product_id = ?`, [productId])
    .catch(() => {});

  // 6) FINALLY delete the product
  const [result] = await db.query(`DELETE FROM products WHERE product_id = ?`, [
    productId,
  ]);

  return result.affectedRows;
}

// GET FEATURED PRODUCT (highest discount)
export async function getFeaturedProduct() {
  const [rows] = await db.query(`
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
      currency,
      (list_price - price) AS discount_amount
    FROM products
    WHERE discount_ratio > 0
    ORDER BY discount_ratio DESC, discount_amount DESC
    LIMIT 1
  `);

  const product = rows[0];
  if (!product) return null;

  // attach images (same pattern as getProductById)
  const [imageRows] = await db.query(
    `
      SELECT image_id, product_id, image_url, is_primary, display_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, display_order ASC, image_id ASC
    `,
    [product.product_id]
  );

  product.product_images = imageRows || [];
  return product;
}
