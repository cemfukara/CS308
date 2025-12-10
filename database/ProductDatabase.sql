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
    currency VARCHAR(10) NOT NULL DEFAULT 'TL',
    
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
    approved BOOLEAN default false, -- true (1) for approved comments
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
-- 8. WISHLISTS TABLE (NEW)
-- ===================================================================
CREATE TABLE wishlists (
    wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    
    -- Prevent duplicate entries: A user can only wishlist a product once
    CONSTRAINT uq_user_product_wishlist UNIQUE(user_id, product_id)
);


-- ===================================================================
-- 9. PRODUCT IMAGES TABLE
-- ===================================================================
CREATE TABLE product_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(2048) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ==================================================================
-- 10. NOTIFICATIONS TABLE
-- ==================================================================

CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
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
INSERT INTO products (product_id, category_id, name, model, serial_number, description, quantity_in_stock, price, list_price, warranty_status, distributor_info) 
VALUES
-- 1. iPhone 17 Pro Max
(1, 1, 'iPhone 17 Pro Max', 'FUT-IP17-PM', 'SN-IP17-PM-BL', 'Future generation design, A19 Pro chip, 10x Telephoto camera.', 50, 89999.00, 89999.00, '2 Years Apple Turkey', 'Apple Inc.'),

-- 2. Samsung Galaxy S25 Ultra
(2, 1, 'Samsung Galaxy S25 Ultra', 'SM-S938B', 'SN-S25U-AI-512', 'Snapdragon 8 Gen 4, 200MP AI Camera, Titanium Frame.', 40, 69999.00, 74999.00, '2 Years Samsung Turkey', 'Samsung Electronics'),

-- 3. Xiaomi 15T Pro
(3, 1, 'Xiaomi 15T Pro', '2507FPN8EG', 'SN-MI15T-256', 'Leica Summilux lens, 144Hz CrystalRes AMOLED, MediaTek Dimensity 9400, 120W HyperCharge.', 60, 39999.00, 44999.00, '2 Years Xiaomi Turkey', 'Xiaomi Turkey'),

-- 4. Lenovo Yoga Slim 7 Core Ultra 5
(4, 2, 'Lenovo Yoga Slim 7 Core Ultra 5', '83CV0019TR', 'SN-YOGA7-CU5', 'Intel Core Ultra 5 125H, 14-inch WUXGA OLED, 16GB RAM, AI Engine, Ultra-thin chassis.', 25, 42999.00, 46999.00, '2 Years Lenovo Turkey', 'Lenovo Turkey'),

-- 5. MSI Katana 17
(5, 2, 'MSI Katana 17', 'B13VFK-1036XTR', 'SN-MSI-KAT17', 'Intel Core i7-13620H, RTX 4060 8GB, 17.3-inch FHD 144Hz, Gaming Performance.', 30, 54999.00, 59999.00, '2 Years MSI Turkey', 'MSI Turkey'),

-- 6. JBL Tune 570BT
(6, 3, 'JBL Tune 570BT', 'JBLT570BTBLK', 'SN-JBL-570-BL', 'Wireless On-Ear Headphones, Pure Bass Sound, 40H Battery Life, Multi-point Connection.', 80, 1799.00, 1999.00, '2 Years JBL Turkey', 'JBL Turkey'),

-- 7. Apple AirPods Max
(7, 3, 'Apple AirPods Max', 'MGYH3AM/A', 'SN-APM-MAX-001', 'High-fidelity audio, Active Noise Cancellation with Transparency mode, Spatial Audio, Space Grey.', 15, 22999.00, 24999.00, '2 Years Apple Turkey', 'Apple Inc.'),

-- 8. JBL Go 4 Bluetooth Speaker
(8, 3, 'JBL Go 4 Bluetooth Speaker', 'JBLGO4BLK', 'SN-JBL-GO4-BL', 'Ultra-portable, waterproof and dustproof (IP67), 7 hours of playtime, JBL Pro Sound.', 100, 1499.00, 1699.00, '2 Years JBL Turkey', 'JBL Turkey'),

-- 9. BASEUS 5000mAh 20W PicoGo
(9, 4, 'BASEUS 5000mAh 20W PicoGo', 'PICO-GO-5K', 'SN-BAS-PICO-5K', 'Qi2 Magnetic Wireless Charging, 20W Fast Charging, Compact Design, Strong Magnets.', 150, 1299.00, 1499.00, '2 Years Baseus Turkey', 'Baseus Turkey'),

-- 10. Apple 20W USB-C Fast Charger (NEW - Category 4: Accessories)
(10, 4, 'Apple 20W USB-C Fast Charger', 'MHJE3TU/A', 'SN-APP-20W-CHG', 'Apple 20W USB-C Power Adapter offers fast, efficient charging at home, in the office, or on the go.', 200, 729.00, 799.00, '2 Years Apple Turkey', 'Apple Inc.');

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
INSERT INTO reviews (product_id, user_id, rating, comment_text, approved)
VALUES
    (4, 2, 5, 'Absolutely love this laptop! Blazing fast and the screen is gorgeous.',true),
    (6, 1, 4, 'Great sound, but the battery life could be a little better.',true),
    (4, 1, 4, 'Solid machine for work. A bit pricy but worth it.',false);

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
    
-- 8. Insert Wishlist items
-- (Depends on users and products)    
INSERT INTO wishlists (user_id, product_id) 
VALUES
(1, 4), -- John wants the AeroBook Pro
(1, 7), -- John also wants the Speaker
(2, 6); -- Jane wants the Earbuds


-- 9. Insert Product Images (Resetting data for Items 1-10)
-- 

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
    -- 1. iPhone 17 Pro Max
    (1, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153503-1_large.jpg', 'iPhone 17 Pro Max Front', true, 1),
    (1, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153503-2_large.jpg', 'iPhone 17 Pro Max Back', false, 2),
    (1, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153503-3_large.jpg', 'iPhone 17 Pro Max Side', false, 3),
    (1, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153503-4_large.jpg', 'iPhone 17 Pro Max Detail', false, 4),

    -- 2. Samsung Galaxy S25 Ultra
    (2, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/samsung/thumb/1-193_large.jpg', 'Samsung Galaxy S25 Ultra Front', true, 1),
    (2, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/samsung/thumb/2-187_large.jpg', 'Samsung Galaxy S25 Ultra Back', false, 2),
    (2, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/samsung/thumb/3-187_large.jpg', 'Samsung Galaxy S25 Ultra Stylus', false, 3),
    (2, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/samsung/thumb/4-151_large.jpg', 'Samsung Galaxy S25 Ultra Side', false, 4),

    -- 3. Xiaomi 15T Pro
    (3, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/153457-1_large.jpg', 'Xiaomi 15T Pro Front', true, 1),
    (3, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/153457-2_large.jpg', 'Xiaomi 15T Pro Back', false, 2),
    (3, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/153457-3_large.jpg', 'Xiaomi 15T Pro Camera', false, 3),
    (3, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/153457-4_large.jpg', 'Xiaomi 15T Pro Side', false, 4),

    -- 4. Lenovo Yoga Slim 7 Core Ultra 5
    (4, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/lenovo/thumb/152336-1_large.jpg', 'Lenovo Yoga Slim 7 Front', true, 1),
    (4, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/lenovo/thumb/152336-2_large.jpg', 'Lenovo Yoga Slim 7 Keyboard', false, 2),
    (4, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/lenovo/thumb/152336-3_large.jpg', 'Lenovo Yoga Slim 7 Side', false, 3),
    (4, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/lenovo/thumb/152336-4_large.jpg', 'Lenovo Yoga Slim 7 Closed', false, 4),

    -- 5. MSI Katana 17
    (5, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/msi/thumb/152400-1-1_large.jpg', 'MSI Katana 17 Front', true, 1),
    (5, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/msi/thumb/152400-2-1_large.jpg', 'MSI Katana 17 Open', false, 2),
    (5, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/msi/thumb/152400-3-1_large.jpg', 'MSI Katana 17 Side', false, 3),
    (5, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/msi/thumb/152400-5-1_large.jpg', 'MSI Katana 17 Back', false, 4),

    -- 6. JBL Tune 570BT
    (6, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/142350-1_large.jpg', 'JBL Tune 570BT Folded', true, 1),
    (6, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/142350-2_large.jpg', 'JBL Tune 570BT Side', false, 2),
    (6, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/142350-3_large.jpg', 'JBL Tune 570BT Angled', false, 3),
    (6, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/142350-4_large.jpg', 'JBL Tune 570BT Front', false, 4),

    -- 7. Apple AirPods Max
    (7, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/1-351_large.jpg', 'Apple AirPods Max Front', true, 1),
    (7, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/2-350_large.jpg', 'Apple AirPods Max Side', false, 2),
    (7, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/3-350_large.jpg', 'Apple AirPods Max Case', false, 3),

    -- 8. JBL Go 4
    (8, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/145617-1_large.jpg', 'JBL Go 4 Front', true, 1),
    (8, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/145617-2_large.jpg', 'JBL Go 4 Side', false, 2),
    (8, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/145617-3_large.jpg', 'JBL Go 4 Angled', false, 3),
    (8, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/145617-4_large.jpg', 'JBL Go 4 Back', false, 4),

    -- 9. BASEUS PicoGo Powerbank
    (9, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/baseus/thumb/151371-1_large.jpg', 'Baseus PicoGo Front', true, 1),
    (9, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/baseus/thumb/151371-2_large.jpg', 'Baseus PicoGo Side', false, 2),
    (9, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/baseus/thumb/151371-3_large.jpg', 'Baseus PicoGo Magnetic', false, 3),
    (9, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/baseus/thumb/151371-4_large.jpg', 'Baseus PicoGo Angled', false, 4),

    -- 10. Apple 20W USB-C Fast Charger (NEW)
    (10, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/150372-1_large.jpg', 'Apple 20W Charger Front', true, 1),
    (10, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/150372-2_large.jpg', 'Apple 20W Charger Prongs', false, 2),
    (10, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/150372-3_large.jpg', 'Apple 20W Charger Box', false, 3);
    
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
        r.product_id = p_product_id AND r.approved = 1
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
        r.product_id = p_product_id AND r.approved = 1;
END$$

-- 3. Get All Reviews by a User
CREATE PROCEDURE sp_GetUserReviews(IN p_user_id INT)
BEGIN
    SELECT
        r.review_id,
        p.product_id,
        p.name AS product_name,
        r.rating,
        r.comment_text,
        r.created_at,
        r.approved
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