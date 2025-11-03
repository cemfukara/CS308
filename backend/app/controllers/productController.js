// This file handles product-related logic such as listing, creating, or updating products.
import { getAllProducts, getProductsByCategory } from '../../models/Product.js';

export async function fetchProducts(req, res) {
    try {
        const { category } = req.query; // optional query parameter

        let products;
        if (category) {
            products = await getProductsByCategory(category);
        } else {
            products = await getAllProducts();
        }

        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
