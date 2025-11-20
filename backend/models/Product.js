// backend/models/Product.js
// This Sequelize model defines the Product table schema (id, name, price, stock, etc.)
//Defines functions to reach data and use in productController.js
import { db } from '../app/config/db.js';

// --- ENHANCED: Function to fetch all products with pagination, sorting, search, and category ---
export async function getAllProducts({ limit = 10, page = 1, sortBy = 'id', sortOrder = 'ASC', search = '', category = null } = {}) {
    const offset = (page - 1) * limit;
    
    // Base WHERE clause
    let whereClause = 'WHERE 1=1'; // Start with a true condition
    const queryParams = [];

    // Search condition (Story 2)
    if (search) {
        whereClause += ` AND (name LIKE ? OR description LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Category filter condition (Story 2)
    if (category) {
        whereClause += ` AND category_id = ?`;
        queryParams.push(category);
    }
    
    // Sanitizing sort columns to prevent SQL injection (important!)
    const validSortColumns = ['id', 'name', 'price', 'stock', 'popularity']; // Assuming 'popularity' is a column
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // 1. Get the total count (before limit/offset)
    const [countRows] = await db.query(`SELECT COUNT(*) as totalCount FROM products ${whereClause}`, queryParams);
    const totalCount = countRows[0].totalCount;

    // 2. Get the products with pagination and sorting
    const productQuery = `
        SELECT * FROM products
        ${whereClause}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ? OFFSET ?
    `;
    
    // Add limit and offset for the main product query
    queryParams.push(limit, offset);

    const [rows] = await db.query(productQuery, queryParams);
    
    return {
        products: rows,
        totalCount,
        currentPage: Number(page),
        limit: Number(limit)
    };
}

// Function to fetch a single product by ID
export async function getProductById(productId) {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    return rows[0]; // Return the first (and only) row
}

// Function to create a new product
export async function createProduct(productData) {
    const { name, description, price, stock, category_id, popularity } = productData;
    const [result] = await db.query(
        'INSERT INTO products (name, description, price, stock, category_id, popularity) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description, price, stock, category_id, popularity || 0] // Default popularity to 0
    );
    // Return the newly created product's ID
    return result.insertId; 
}

// Function to update an existing product
export async function updateProduct(productId, productData) {
    const fields = Object.keys(productData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(productData);
    
    if (fields.length === 0) return 0; // Nothing to update
    
    values.push(productId);
    
    const [result] = await db.query(
        `UPDATE products SET ${fields} WHERE id = ?`,
        values
    );
    return result.affectedRows; // Number of rows updated (0 or 1)
}

// Function to delete a product
export async function deleteProduct(productId) {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);
    return result.affectedRows; // Number of rows deleted (0 or 1)
}

// NOTE: I commented out or removed the original simple functions like getBrieflyProducts 
// and getProductsByCategory since the new getAllProducts is more comprehensive.
// Original functions for simple fetch/briefly/category were:
// export async function getBrieflyProducts() { ... }
// export async function getProductsByCategory(categoryId) { ... }

// --- Retaining a simple export for the database connection ---
// (Assuming db is not exported from Product.js originally, keeping exports clear)
// export { db };