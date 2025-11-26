USE mydb;

-- ===================================================================
-- 1. CATEGORIES TABLE
-- ===================================================================

CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ===================================================================
-- 2. PRODUCTS TABLE
-- ===================================================================

CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    description TEXT,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    list_price DECIMAL(10, 2),
    warranty_status VARCHAR(255),
    distributor_info VARCHAR(255),
    
    -- Generated column for discount percentage
    discount_ratio DECIMAL(5, 2) AS (
        CASE
            WHEN list_price > 0 AND price < list_price
            THEN (((list_price - price) / list_price) * 100)
            ELSE 0
        END
    ) STORED,
    
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Add an index to make sorting by discount super fast
CREATE INDEX idx_discount_ratio ON products (discount_ratio);

-- ===================================================================
-- 3. USERS TABLE
-- ===================================================================

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    
    -- Stores the bcrypt hash of the password
    password_hash VARCHAR(255) NOT NULL, 
    
    -- 'customer' is the default value
    role ENUM('customer', 'sales manager', 'product manager', 'support agent', 'dev') NOT NULL DEFAULT 'customer',
    
    -- Fields for encrypted Personally Identifiable Information (PII)
    first_name_encrypted BLOB,
    last_name_encrypted BLOB,
    address_encrypted BLOB,
    tax_id_encrypted BLOB, -- Added for sensitive tax ID
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- 4. REVIEWS TABLE (Links Users and Products)
-- ===================================================================

CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL, -- e.g., a number from 1 to 5
    comment_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),

    -- User can only review a product once
    CONSTRAINT uq_user_product_review UNIQUE(user_id, product_id)
);

-- ===================================================================
-- 5. PAYMENT METHODS TABLE (Secure PCI-compliant design)
-- ===================================================================

CREATE TABLE payment_methods (
    payment_method_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- This is the token from Stripe/PayPal. Safe to store.
    gateway_customer_id VARCHAR(255) NOT NULL,
    
    -- These are for display. Safe to store.
    card_brand VARCHAR(50), -- e.g., 'Visa'
    last_four_digits CHAR(4), -- e.g., '4242'
    
    -- Marks which card to auto-select at checkout
    is_default BOOLEAN DEFAULT false,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ===================================================================
-- 6. ORDERS TABLE
-- ===================================================================
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- 'cart' is the active shopping cart
    status ENUM('cart', 'processing', 'in-transit', 'delivered', 'cancelled') NOT NULL DEFAULT 'cart',
    
    -- Final total price, can be NULL for an active 'cart'
    total_price DECIMAL(10, 2),
    
    -- Store the shipping address used *for this specific order*
    shipping_address_encrypted BLOB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 'order_date' is set when status changes from 'cart' to 'processing'
    order_date TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ===================================================================
-- 7. ORDER_ITEMS TABLE
-- ===================================================================
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    
    -- Store the price at time of purchase, as product.price can change
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ===================================================================
-- DATA INSERTION
-- ===================================================================
-- (Note: Data is inserted in order of dependency)

-- 1. Insert categories
INSERT INTO categories (name, description)
VALUES
    ('Smartphones', 'Mobile phones with advanced computing capabilities.'),
    ('Laptops', 'Portable personal computers.'),
    ('Audio', 'Headphones, speakers, and audio equipment.'),
    ('Accessories', 'Chargers, cases, and other peripherals.');

-- 2. Insert products
INSERT INTO products (category_id, name, model, serial_number, description, quantity_in_stock, price, list_price, warranty_status, distributor_info)
VALUES
    (1, 'Photon X1', 'P-X1-256', 'SN-PX1-987A', 'The latest flagship smartphone with AI camera.', 50, 999.99, 999.99, '1 Year Manufacturer', 'Photon Devices'),
    (1, 'Galaxy S23 Ultra', 'G-S23-U', 'SN-GS23U-123B', 'Premium smartphone with S-Pen.', 35, 1199.99, 1199.99, '2 Years', 'Samsung Electronics'),
    (1, 'Photon X1 Lite', 'P-X1-LITE', 'SN-PX1L-159I', 'Budget-friendly smartphone.', 0, 349.00, 349.00, '1 Year', 'Photon Devices'),
    (2, 'AeroBook Pro 16', 'ABP-16-M3', 'SN-ABP16-456C', 'Powerful 16-inch laptop for professionals.', 20, 2399.00, 2499.00, '2 Years Extended', 'Aero Computers'),
    (2, 'Zenith Z-Book 14', 'Z-ZBK-14G', 'SN-ZBK14-789D', 'Ultralight laptop for travel.', 40, 899.50, 950.00, '1 Year', 'Zenith Tech'),
    (3, 'QuietZone Pro Buds', 'QZ-PRO-2', 'SN-QZPB2-321E', 'Active noise-cancelling wireless earbuds.', 75, 199.99, 249.99, '1 Year', 'AudioPhile Inc.'),
    (3, 'SoundWave Max Speaker', 'SWM-BT5', 'SN-SWM5-654F', 'Portable Bluetooth speaker with deep bass.', 60, 129.00, 129.00, '1 Year', 'SoundWave'),
    (3, 'StudioMax Headphones', 'SM-HD-X2', 'SN-SMHD2-753J', 'Over-ear studio monitor headphones.', 25, 299.00, 349.00, '3 Years', 'AudioPhile Inc.'),
    (4, 'RapidCharge 100W Brick', 'RC-100W', 'SN-RC100-987G', 'GaN fast charger for laptops and phones.', 150, 49.99, 59.99, '6 Months', 'VoltTech'),
    (4, 'AeroBook Pro Case', 'ABP-CS-16', 'SN-ABPCS-654H', 'Protective hardshell case for AeroBook 16.', 90, 39.99, 39.99, 'N/A', 'Aero Computers');

-- 3. Insert users
-- (Note: '..._encrypted' fields are placeholders for your app's encrypted binary data)
-- (Note: 'password_hash' fields are placeholders for a real bcrypt hash)
INSERT INTO users (email, password_hash, role, first_name_encrypted, last_name_encrypted, address_encrypted, tax_id_encrypted)
VALUES
    ('john.doe@example.com', '$2b$10$fakehash.for.john.doe', 'customer', 'ENCRYPTED_FIRST_NAME', 'ENCRYPTED_LAST_NAME', 'ENCRYPTED_ADDRESS', 'ENCRYPTED_TAX_ID'),
    ('jane.smith@example.com', '$2b$10$fakehash.for.jane.smith', 'customer', 'ENCRYPTED_FIRST_NAME', 'ENCRYPTED_LAST_NAME', 'ENCRYPTED_ADDRESS', 'ENCRYPTED_TAX_ID'),
    ('sales@shop.com', '$2b$10$fakehash.for.sales.mgr', 'sales manager', 'ENCRYPTED_FIRST_NAME', 'ENCRYPTED_LAST_NAME', 'ENCRYPTED_ADDRESS', 'ENCRYPTED_TAX_ID'),
    ('product@shop.com', '$2b$10$fakehash.for.prod.mgr', 'product manager', 'ENCRYPTED_FIRST_NAME', 'ENCRYPTED_LAST_NAME', 'ENCRYPTED_ADDRESS', 'ENCRYPTED_TAX_ID');

-- 4. Insert reviews
-- (Depends on users and products)
INSERT INTO reviews (product_id, user_id, rating, comment_text)
VALUES
    (4, 2, 5, 'Absolutely love this laptop! Blazing fast and the screen is gorgeous.'),
    (6, 1, 4, 'Great sound, but the battery life could be a little better.'),
    (4, 1, 4, 'Solid machine for work. A bit pricy but worth it.');

-- 5. Insert payment methods
-- (Depends on users)
INSERT INTO payment_methods (user_id, gateway_customer_id, card_brand, last_four_digits, is_default)
VALUES
    (1, 'cus_tok_john123', 'Visa', '4242', true),
    (1, 'cus_tok_john456', 'Mastercard', '1234', false),
    (2, 'cus_tok_jane789', 'Visa', '8888', true);

-- 6. Insert orders
-- (Depends on users)
INSERT INTO orders (user_id, status, total_price, shipping_address_encrypted, order_date)
VALUES
    -- A delivered order for user 1 (john_doe)
    (1, 'delivered', 1199.99, 'ENCRYPTED_SHIPPING_ADDRESS', NOW() - INTERVAL 7 DAY),
    -- An active cart for user 1 (john_doe)
    (1, 'cart', NULL, NULL, NULL),
    -- A processing order for user 2 (jane_smith)
    (2, 'processing', 899.50, 'ENCRYPTED_SHIPPING_ADDRESS', NOW() - INTERVAL 1 DAY);

-- 7. Insert order items
-- (Depends on orders and products)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
VALUES
    -- Items for order 1 (delivered)
    (1, 2, 1, 1199.99),
    -- Items for order 2 (active cart)
    (2, 9, 2, 49.99),
    -- Items for order 3 (processing)
    (3, 5, 1, 899.50);
    
--  Dev data insertion into users table for dev test   
SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

INSERT INTO users (user_id, email, password_hash, role)
VALUES
	(0,'dev@test.local', '$2b$10$fakehash.for.dev.dev', 'dev');

SET SESSION sql_mode = '';
-- dev insertion ends


-- ===================================================================
-- STORED PROCEDURES (Existing)
-- ===================================================================

-- Set delimiter for procedure creation
DELIMITER $$

-- 1. Get All Reviews for a Product
CREATE PROCEDURE sp_GetProductReviews(IN p_product_id INT)
BEGIN
    SELECT
        u.user_id, -- Changed from username
        r.rating,
        r.comment_text,
        r.created_at
    FROM
        reviews r
    JOIN
        users u ON r.user_id = u.user_id
    WHERE
        r.product_id = p_product_id
    ORDER BY
        r.created_at DESC;
END$$

-- 2. Get Average Rating for a Product
CREATE PROCEDURE sp_GetProductAverageRating(IN p_product_id INT)
BEGIN
    SELECT
        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(r.review_id) AS review_count
    FROM
        reviews r
    WHERE
        r.product_id = p_product_id;
END$$

-- 3. Get All Reviews by a User
CREATE PROCEDURE sp_GetUserReviews(IN p_user_id INT)
BEGIN
    SELECT
        p.product_id,
        p.name AS product_name,
        r.rating,
        r.comment_text,
        r.created_at
    FROM
        reviews r
    JOIN
        products p ON r.product_id = p.product_id
    WHERE
        r.user_id = p_user_id
    ORDER BY
        r.created_at DESC;
END$$

-- Reset delimiter
DELIMITER ;

-- ===================================================================
-- VERIFICATION SELECTS (Optional)
-- ===================================================================
SELECT * FROM categories;
SELECT * FROM products;
SELECT * FROM users;
SELECT * FROM reviews;
SELECT * FROM payment_methods;
SELECT * FROM orders;
SELECT * FROM order_items;