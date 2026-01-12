-- Use below line once for refreshing your database
-- drop schema mydb; create schema mydb;
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
    order_count INT DEFAULT 0,

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

-- index for sorting popularity
CREATE INDEX idx_product_popularity ON products(order_count DESC);
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
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
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
    status ENUM('cart', 'processing', 'in-transit', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'cart',

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

-- ===================================================================
-- NEW PRODUCTS INSERT SCRIPT
-- Contains Product IDs: 11, 12, 13, 14, 15
-- ===================================================================

INSERT INTO products (
    product_id, category_id, name, model, serial_number, description, 
    quantity_in_stock, price, list_price, warranty_status, distributor_info, currency
) VALUES 
-- 11. MagSafe Case for iPhone 17 Pro Max
(
    11, 4, 'Apple iPhone 17 Pro Max Clear Case with MagSafe', 'MGFW4ZM/A', 'SN-IP17PM-MAG-001', 
    'Thin, light, and easy to grip — this Apple-designed case shows off the brilliant colored finish of iPhone 17 Pro Max while providing extra protection. Crafted with a blend of optically clear polycarbonate and flexible materials.', 
    1, 2499.00, 2750.00, '2 Years Apple Türkiye Warranty', 'Apple Türkiye', 'TL'
),
-- 12. Logitech G213 Keyboard
(
    12, 2, 'Logitech G G213 Prodigy RGB Gaming Keyboard', '920-008094', 'SN-G213-KB-TR-001', 
    'Gaming-grade performance with Mech-Dome keys that deliver a superior tactile response. Features 5 individual RGB lighting zones with 16.8 million colors (LIGHTSYNC), a spill-resistant durable design, and dedicated media controls.', 
    0, 2199.00, 2600.00, '2 Years Logitech Türkiye Warranty', 'Logitech Türkiye', 'TL'
),
-- 13. Razer Basilisk V3 Pro Mouse
(
    13, 2, 'Razer Basilisk V3 Pro 30000 DPI Wireless Gaming Mouse', 'RZ01-04620100-R3G1', 'SN-RAZER-BAS-V3-001', 
    'The king of gaming mice returns to raise the game. Armed with the Razer Focus Pro 30K Optical Sensor, 13-zone Chroma lighting with full underglow, and the Razer HyperScroll Tilt Wheel. Features iconic ergonomic form with 10+1 programmable buttons.', 
    10, 5499.00, 6250.00, '2 Years Bilkom Warranty', 'Bilkom', 'TL'
),
-- 14. Apple AirPods Pro 2
(
    14, 3, 'Apple AirPods Pro (2nd Generation) with MagSafe Charging Case (USB-C)', 'MTJV3TU/A', 'SN-AIRPODS-PRO2-001', 
    'Rebuilt from the sound up. AirPods Pro 2 feature up to 2x more Active Noise Cancellation, plus Adaptive Transparency, and Personalized Spatial Audio with dynamic head tracking for immersive sound. Now with multiple ear tips (XS, S, M, L) and up to 6 hours of listening time.', 
    100, 8999.00, 9999.00, '2 Years Apple Türkiye Warranty', 'Apple Türkiye', 'TL'
),
-- 15. Xiaomi Redmi Note 14
(
    15, 1, 'Xiaomi Redmi Note 14 8GB 256GB Black', '24117RN76G', 'SN-REDMI-N14-001', 
    'Features a 6.67-inch AMOLED display with 120Hz refresh rate, 5500mAh battery with 33W fast charging, and a 108MP triple camera system. Powered by MediaTek Helio G99 Ultra with IP54 dust and splash resistance.', 
    11, 12999.00, 13999.00, '2 Years Xiaomi Türkiye Warranty', 'Xiaomi Türkiye', 'TL'
);

-- ===================================================================
-- INSERT PRODUCT IMAGES (IDs 11, 12, 13, 14, 15)
-- ===================================================================

INSERT INTO product_images (product_id, image_url, is_primary) VALUES 
-- Product 11 (iPhone Case)
(11, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153653-1_large.jpg', 1),
(11, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153653-2_large.jpg', 0),
(11, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153653-3_large.jpg', 0),

-- Product 12 (Logitech Keyboard)
(12, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/logitech/thumb/v2-84663_large.jpg', 1),
(12, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/logitech/thumb/v2-84663-1_large.jpg', 0),
(12, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/logitech/thumb/v2-84663-2_large.jpg', 0),

-- Product 13 (Razer Mouse)
(13, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/razer/thumb/142187-1_large.jpg', 1),
(13, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/razer/thumb/142187-2_large.jpg', 0),
(13, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/razer/thumb/142187-3_large.jpg', 0),

-- Product 14 (AirPods Pro 2)
(14, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/141492-1_large.jpg', 1),
(14, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/141492-2_large.jpg', 0),
(14, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/141492-3_large.jpg', 0),
(14, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/141492-5_large.jpg', 0),

-- Product 15 (Xiaomi Redmi Note 14)
(15, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/149055-1_large.jpg', 1),
(15, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/149055-4_large.jpg', 0);


--  Dev data insertion into users table for dev test
SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

INSERT INTO users (user_id, email, password_hash, role)
VALUES
	(0,'dev@test.local', '$2b$10$fakehash.for.dev.dev', 'dev');

SET SESSION sql_mode = '';
-- dev insertion ends


DELIMITER $$

CREATE TRIGGER trg_UpdatePopularityOnPurchase
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    -- Check if the order status just changed from 'cart' to a confirmed state (like 'processing')
    IF OLD.status IN ('processing', 'in-transit') AND NEW.status = 'delivered' THEN
        
        -- Update the order_count for ALL products in this specific order
        UPDATE products p
        INNER JOIN order_items oi ON p.product_id = oi.product_id
        SET p.order_count = p.order_count + oi.quantity
        WHERE oi.order_id = NEW.order_id;
        
    END IF;
END$$

DELIMITER ;


-- ===================================================================
-- STORED PROCEDURES (Existing)
-- ===================================================================

-- Set delimiter for procedure creation
DELIMITER $$

-- 1. Get All Reviews for a Product
CREATE PROCEDURE sp_GetProductReviews(IN p_product_id INT)
BEGIN
    SELECT
        u.user_id,
        r.rating,
        r.comment_text,
        r.created_at,
        r.status
    FROM
        reviews r
    JOIN
        users u ON r.user_id = u.user_id
    WHERE
        r.product_id = p_product_id
        AND r.comment_text IS NOT NULL
        AND r.status = 'approved'
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
        r.created_at,
        r.status
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
-- PROFILE UPDATE & ACCOUNT DELETION VERIFICATION SYSTEM
-- ===================================================================

<<<<<<< Updated upstream
-- Add phone_encrypted field to users table
ALTER TABLE users 
ADD COLUMN phone_encrypted BLOB AFTER address_encrypted;
=======
-- Verification Selects
SELECT * FROM Orders;
SELECT * FROM Order_Items;
SELECT * FROM Payment_Methods;
SELECT * FROM Reviews;
SELECT * FROM Categories;
SELECT * FROM Products;
SELECT * FROM Users;
SELECT * FROM User_Addresses;
SELECT * FROM Wishlists;
SELECT * FROM Product_Images;
SELECT * FROM Notifications;
SELECT * FROM Refunds;
SELECT * FROM Verification_Codes;
SELECT * FROM Support_Chats;
SELECT * FROM Support_Messages;
SELECT * FROM Support_Attachments;
>>>>>>> Stashed changes

-- Create verification_codes table for email verification
CREATE TABLE IF NOT EXISTS verification_codes (
    code_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose ENUM('profile_update', 'account_deletion') NOT NULL,
    -- Store pending update data as JSON
    pending_data TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_purpose (user_id, purpose),
    INDEX idx_expires (expires_at)
);

-- ===================================================================
-- 11. SUPPORT CHAT SYSTEM TABLES
-- ===================================================================

-- Support chats table: tracks customer-agent conversations
CREATE TABLE support_chats (
    chat_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL, -- NULL for guest users
    guest_identifier VARCHAR(255) NULL, -- Cookie/session ID for guests
    agent_user_id INT NULL, -- Agent who claimed the chat
    status ENUM(
        'waiting',
        'active',
        'resolved',
        'closed'
    ) NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP NULL, -- When agent claimed the chat
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL,
    FOREIGN KEY (agent_user_id) REFERENCES users (user_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_agent (agent_user_id),
    INDEX idx_user (user_id),
    INDEX idx_guest (guest_identifier)
);

-- Support messages table: individual messages within a chat
CREATE TABLE support_messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    chat_id INT NOT NULL,
    sender_type ENUM('customer', 'agent') NOT NULL,
    sender_user_id INT NULL, -- User ID if authenticated
    message_text TEXT, -- NULL if attachment-only
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (chat_id) REFERENCES support_chats (chat_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users (user_id) ON DELETE SET NULL,
    INDEX idx_chat (chat_id),
    INDEX idx_created (created_at)
);

-- Support attachments table: file attachments in messages
CREATE TABLE support_attachments (
    attachment_id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL, -- Local path or URL
    file_type VARCHAR(100) NOT NULL, -- MIME type  
    file_size INT NOT NULL, -- Bytes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES support_messages (message_id) ON DELETE CASCADE,
    INDEX idx_message (message_id)
);

-- ===================================================================
-- 12. CURRENCIES TABLE - MULTI-CURRENCY SUPPORT
-- ===================================================================

CREATE TABLE IF NOT EXISTS currencies (
    currency_id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(3) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    exchange_rate DECIMAL(15, 6) NOT NULL DEFAULT 1.000000,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
);

-- Add currency tracking to orders table
-- Check if columns exist before adding them (compatible with all MySQL versions)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'mydb' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'currency');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE orders ADD COLUMN currency VARCHAR(3) DEFAULT ''TL'' AFTER total_price, ADD COLUMN exchange_rate DECIMAL(15, 6) DEFAULT 1.000000 AFTER currency;',
    'SELECT ''Columns already exist'' AS message;');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed currencies table with 160+ world currencies
INSERT IGNORE INTO currencies (code, symbol, name, exchange_rate, is_active) VALUES
-- Major Currencies
('TRY', '₺', 'Turkish Lira', 1.000000, TRUE),
('USD', '$', 'US Dollar', 0.030000, TRUE),
('EUR', '€', 'Euro', 0.028000, TRUE),
('GBP', '£', 'British Pound', 0.024000, TRUE),
('JPY', '¥', 'Japanese Yen', 4.500000, TRUE),
('CHF', 'Fr', 'Swiss Franc', 0.027000, TRUE),
('CAD', 'C$', 'Canadian Dollar', 0.042000, TRUE),
('AUD', 'A$', 'Australian Dollar', 0.047000, TRUE),
('CNY', '¥', 'Chinese Yuan', 0.220000, TRUE),
('INR', '₹', 'Indian Rupee', 2.550000, TRUE),
-- European Currencies
('SEK', 'kr', 'Swedish Krona', 0.320000, TRUE),
('NOK', 'kr', 'Norwegian Krone', 0.330000, TRUE),
('DKK', 'kr', 'Danish Krone', 0.210000, TRUE),
('PLN', 'zł', 'Polish Zloty', 0.120000, TRUE),
('CZK', 'Kč', 'Czech Koruna', 0.700000, TRUE),
('HUF', 'Ft', 'Hungarian Forint', 11.500000, TRUE),
('RON', 'lei', 'Romanian Leu', 0.140000, TRUE),
('BGN', 'лв', 'Bulgarian Lev', 0.055000, TRUE),
('HRK', 'kn', 'Croatian Kuna', 0.210000, TRUE),
('RUB', '₽', 'Russian Ruble', 2.900000, TRUE),
('UAH', '₴', 'Ukrainian Hryvnia', 1.250000, TRUE),
-- Middle East & Africa
('SAR', 'ر.س', 'Saudi Riyal', 0.115000, TRUE),
('AED', 'د.إ', 'UAE Dirham', 0.112000, TRUE),
('ILS', '₪', 'Israeli Shekel', 0.110000, TRUE),
('EGP', 'E£', 'Egyptian Pound', 1.500000, TRUE),
('ZAR', 'R', 'South African Rand', 0.565000, TRUE),
('NGN', '₦', 'Nigerian Naira', 46.500000, TRUE),
('KES', 'KSh', 'Kenyan Shilling', 3.950000, TRUE),
-- Asia Pacific
('KRW', '₩', 'South Korean Won', 41.500000, TRUE),
('SGD', 'S$', 'Singapore Dollar', 0.041000, TRUE),
('HKD', 'HK$', 'Hong Kong Dollar', 0.239000, TRUE),
('TWD', 'NT$', 'Taiwan Dollar', 0.980000, TRUE),
('THB', '฿', 'Thai Baht', 1.050000, TRUE),
('MYR', 'RM', 'Malaysian Ringgit', 0.137000, TRUE),
('IDR', 'Rp', 'Indonesian Rupiah', 485.000000, TRUE),
('PHP', '₱', 'Philippine Peso', 1.750000, TRUE),
('VND', '₫', 'Vietnamese Dong', 772.000000, TRUE),
('PKR', '₨', 'Pakistani Rupee', 8.500000, TRUE),
('BDT', '৳', 'Bangladeshi Taka', 3.350000, TRUE),
('LKR', 'Rs', 'Sri Lankan Rupee', 9.200000, TRUE),
-- Americas
('MXN', 'Mex$', 'Mexican Peso', 0.620000, TRUE),
('BRL', 'R$', 'Brazilian Real', 0.155000, TRUE),
('ARS', '$', 'Argentine Peso', 30.500000, TRUE),
('CLP', '$', 'Chilean Peso', 29.500000, TRUE),
('COP', '$', 'Colombian Peso', 133.000000, TRUE),
('PEN', 'S/', 'Peruvian Sol', 0.115000, TRUE),
-- Oceania
('NZD', 'NZ$', 'New Zealand Dollar', 0.051000, TRUE),
-- Other Major Economies
('QAR', 'ر.ق', 'Qatari Riyal', 0.111000, TRUE),
('KWD', 'د.ك', 'Kuwaiti Dinar', 0.009400, TRUE),
('OMR', 'ر.ع.', 'Omani Rial', 0.012000, TRUE),
('BHD', 'د.ب', 'Bahraini Dinar', 0.012000, TRUE),
('JOD', 'د.ا', 'Jordanian Dinar', 0.022000, TRUE),
('LBP', 'ل.ل', 'Lebanese Pound', 2740.000000, TRUE),
('IQD', 'ع.د', 'Iraqi Dinar', 40.000000, TRUE),
('IRR', '﷼', 'Iranian Rial', 1290.000000, TRUE),
('AFN', '؋', 'Afghan Afghani', 2.150000, TRUE),
('KZT', '₸', 'Kazakhstani Tenge', 14.200000, TRUE),
('UZS', 'so\'m', 'Uzbekistani Som', 390.000000, TRUE),
('AZN', '₼', 'Azerbaijani Manat', 0.052000, TRUE),
('GEL', '₾', 'Georgian Lari', 0.083000, TRUE),
('AMD', '֏', 'Armenian Dram', 12.000000, TRUE),
('BYN', 'Br', 'Belarusian Ruble', 0.100000, TRUE),
('MDL', 'L', 'Moldovan Leu', 0.550000, TRUE),
('ALL', 'L', 'Albanian Lek', 2.850000, TRUE),
('MKD', 'ден', 'Macedonian Denar', 1.680000, TRUE),
('RSD', 'дин', 'Serbian Dinar', 3.200000, TRUE),
('BAM', 'KM', 'Bosnia-Herzegovina Mark', 0.053000, TRUE),
-- African Currencies
('DZD', 'د.ج', 'Algerian Dinar', 4.100000, TRUE),
('MAD', 'د.م.', 'Moroccan Dirham', 0.305000, TRUE),
('TND', 'د.ت', 'Tunisian Dinar', 0.095000, TRUE),
('LYD', 'ل.د', 'Libyan Dinar', 0.148000, TRUE),
('SDG', 'ج.س.', 'Sudanese Pound', 18.400000, TRUE),
('ETB', 'Br', 'Ethiopian Birr', 3.750000, TRUE),
('GHS', '₵', 'Ghanaian Cedi', 0.470000, TRUE),
('XOF', 'CFA', 'West African CFA franc', 17.900000, TRUE),
('XAF', 'FCFA', 'Central African CFA franc', 17.900000, TRUE),
('UGX', 'USh', 'Ugandan Shilling', 112.000000, TRUE),
('TZS', 'TSh', 'Tanzanian Shilling', 76.500000, TRUE),
('ZMW', 'ZK', 'Zambian Kwacha', 0.820000, TRUE),
('BWP', 'P', 'Botswana Pula', 0.420000, TRUE),
('MUR', '₨', 'Mauritian Rupee', 1.410000, TRUE),
('SCR', '₨', 'Seychellois Rupee', 0.416000, TRUE),
-- Caribbean & Central America
('JMD', 'J$', 'Jamaican Dollar', 4.750000, TRUE),
('TTD', 'TT$', 'Trinidad & Tobago Dollar', 0.207000, TRUE),
('BBD', 'Bds$', 'Barbadian Dollar', 0.061000, TRUE),
('BSD', 'B$', 'Bahamian Dollar', 0.031000, TRUE),
('BZD', 'BZ$', 'Belize Dollar', 0.062000, TRUE),
('XCD', 'EC$', 'East Caribbean Dollar', 0.083000, TRUE),
('GTQ', 'Q', 'Guatemalan Quetzal', 0.238000, TRUE),
('HNL', 'L', 'Honduran Lempira', 0.770000, TRUE),
('NIO', 'C$', 'Nicaraguan Córdoba', 1.130000, TRUE),
('CRC', '₡', 'Costa Rican Colón', 15.600000, TRUE),
('PAB', 'B/.', 'Panamanian Balboa', 0.031000, TRUE),
('DOP', 'RD$', 'Dominican Peso', 1.850000, TRUE),
('HTG', 'G', 'Haitian Gourde', 4.030000, TRUE),
-- South America (Additional)
('UYU', '$U', 'Uruguayan Peso', 1.310000, TRUE),
('PYG', '₲', 'Paraguayan Guarani', 225.000000, TRUE),
('BOB', 'Bs', 'Bolivian Boliviano', 0.212000, TRUE),
('VES', 'Bs.S', 'Venezuelan Bolívar', 1100.000000, TRUE),
('GYD', 'G$', 'Guyanese Dollar', 6.420000, TRUE),
('SRD', '$', 'Surinamese Dollar', 1.090000, TRUE),
-- Pacific
('FJD', 'FJ$', 'Fijian Dollar', 0.070000, TRUE),
('PGK', 'K', 'Papua New Guinean Kina', 0.122000, TRUE),
('SBD', 'SI$', 'Solomon Islands Dollar', 0.257000, TRUE),
('TOP', 'T$', 'Tongan Paʻanga', 0.073000, TRUE),
('WST', 'WS$', 'Samoan Tala', 0.086000, TRUE),
('VUV', 'VT', 'Vanuatu Vatu', 3.640000, TRUE),
-- Asian (Additional)
('NPR', '₨', 'Nepalese Rupee', 4.080000, TRUE),
('BTN', 'Nu.', 'Bhutanese Ngultrum', 2.560000, TRUE),
('MVR', 'Rf', 'Maldivian Rufiyaa', 0.473000, TRUE),
('MMK', 'K', 'Myanmar Kyat', 64.400000, TRUE),
('KHR', '៛', 'Cambodian Riel', 124.000000, TRUE),
('LAK', '₭', 'Lao Kip', 670.000000, TRUE),
('BND', 'B$', 'Brunei Dollar', 0.041000, TRUE),
('MNT', '₮', 'Mongolian Tugrik', 104.000000, TRUE),
('KGS', 'с', 'Kyrgyzstani Som', 2.730000, TRUE),
('TJS', 'ЅМ', 'Tajikistani Somoni', 0.330000, TRUE),
('TMT', 'm', 'Turkmenistani Manat', 0.107000, TRUE),
-- Special & Historical Interest
('ISK', 'kr', 'Icelandic Króna', 4.230000, TRUE),
('MOP', 'MOP$', 'Macanese Pataca', 0.246000, TRUE),
('AOA', 'Kz', 'Angolan Kwanza', 25.400000, TRUE),
('MZN', 'MT', 'Mozambican Metical', 1.960000, TRUE),
('MWK', 'MK', 'Malawian Kwacha', 53.200000, TRUE),
('RWF', 'FRw', 'Rwandan Franc', 42.000000, TRUE),
('BIF', 'FBu', 'Burundian Franc', 89.500000, TRUE),
('DJF', 'Fdj', 'Djiboutian Franc', 5.450000, TRUE),
('KMF', 'CF', 'Comorian Franc', 13.400000, TRUE),
('MGA', 'Ar', 'Malagasy Ariary', 139.000000, TRUE),
('SLL', 'Le', 'Sierra Leonean Leone', 610.000000, TRUE),
('GMD', 'D', 'Gambian Dalasi', 2.090000, TRUE),
('GNF', 'FG', 'Guinean Franc', 264.000000, TRUE),
('LRD', 'L$', 'Liberian Dollar', 5.960000, TRUE),
('SOS', 'Sh.So.', 'Somali Shilling', 17.500000, TRUE),
('ERN', 'Nfk', 'Eritrean Nakfa', 0.460000, TRUE),
('SZL', 'E', 'Swazi Lilangeni', 0.565000, TRUE),
('LSL', 'L', 'Lesotho Loti', 0.565000, TRUE),
('NAD', 'N$', 'Namibian Dollar', 0.565000, TRUE)
ON DUPLICATE KEY UPDATE
    symbol = VALUES(symbol),
    name = VALUES(name),
    exchange_rate = VALUES(exchange_rate),
    is_active = VALUES(is_active);
    
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
SELECT * FROM wishlists;
SELECT * FROM product_images;
SELECT * FROM notifications;
SELECT * FROM verification_codes;
SELECT * FROM support_chats;
SELECT * FROM support_messages;
SELECT * FROM support_attachments;
SELECT * FROM currencies;