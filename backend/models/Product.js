// This Sequelize model defines the Product table schema (id, name, price, stock, etc.)
//Defines functions to reach data and use in productController.js
import { db } from '../app/config/db.js';

// Function to fetch all products
export async function getAllProducts() {
    const [rows] = await db.query('SELECT * FROM products');
    return rows;
}

// (Optional) Filter by category
export async function getProductsByCategory(categoryId) {
    const [rows] = await db.query(
        'SELECT * FROM products WHERE category_id = ?',
        [categoryId]
    );
    return rows;
}
