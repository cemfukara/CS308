-- Use below line once for refreshing your database
-- drop schema mydb; create schema mydb;
USE mydb;

-- 01_schema.sql
-- Definitions of tables, indexes, and constraints

-- 1. CATEGORIES
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 2. PRODUCTS
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

CREATE INDEX idx_product_popularity ON products(order_count DESC);
CREATE INDEX idx_discount_ratio ON products (discount_ratio);

-- 3. USERS
-- Note: 'phone_encrypted' added here (consolidated from ALTER statement)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'sales manager', 'product manager', 'support agent', 'dev') NOT NULL DEFAULT 'customer',
    first_name_encrypted BLOB,
    last_name_encrypted BLOB,
    tax_id_encrypted BLOB,
    phone_encrypted BLOB, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. REVIEWS
CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL,
    comment_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT uq_user_product_review UNIQUE(user_id, product_id)
);

-- 5. PAYMENT METHODS
CREATE TABLE payment_methods (
    payment_method_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    gateway_customer_id VARCHAR(255) NOT NULL,
    card_brand VARCHAR(50),
    last_four_digits CHAR(4),
    is_default BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 6. ORDERS
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    status ENUM('cart', 'processing', 'in-transit', 'delivered', 'cancelled') NOT NULL DEFAULT 'cart',
    total_price DECIMAL(10, 2),
    shipping_country VARCHAR(100),
    shipping_city VARCHAR(100),
    shipping_address_encrypted BLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_date TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 7. ORDER_ITEMS
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 8. WISHLISTS
CREATE TABLE wishlists (
    wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    CONSTRAINT uq_user_product_wishlist UNIQUE(user_id, product_id)
);

-- 9. PRODUCT IMAGES
CREATE TABLE product_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(2048) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 10. NOTIFICATIONS
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

-- 11. REFUNDS
CREATE TABLE refunds (
  refund_id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NOT NULL,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  quantity INT NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  status ENUM('requested','approved','rejected') NOT NULL DEFAULT 'requested',
  reason VARCHAR(255),
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  decided_by INT NULL,
  UNIQUE KEY uniq_refund_item (order_item_id),
  INDEX idx_refunds_status (status),
  INDEX idx_refunds_user (user_id),
  FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (decided_by) REFERENCES users(user_id)
);

-- 12. USER ADDRESSES
CREATE TABLE user_addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_title VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code INT NOT NULL,
    address_line_encrypted BLOB, 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 13. VERIFICATION CODES
CREATE TABLE IF NOT EXISTS verification_codes (
    code_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose ENUM('profile_update', 'account_deletion') NOT NULL,
    pending_data TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_purpose (user_id, purpose),
    INDEX idx_expires (expires_at)
);

-- 14. SUPPORT CHATS
CREATE TABLE support_chats (
    chat_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    guest_identifier VARCHAR(255) NULL,
    agent_user_id INT NULL,
    status ENUM('waiting', 'active', 'resolved', 'closed') NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL,
    FOREIGN KEY (agent_user_id) REFERENCES users (user_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_agent (agent_user_id),
    INDEX idx_user (user_id),
    INDEX idx_guest (guest_identifier)
);

-- 15. SUPPORT MESSAGES
CREATE TABLE support_messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    chat_id INT NOT NULL,
    sender_type ENUM('customer', 'agent') NOT NULL,
    sender_user_id INT NULL,
    message_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (chat_id) REFERENCES support_chats (chat_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users (user_id) ON DELETE SET NULL,
    INDEX idx_chat (chat_id),
    INDEX idx_created (created_at)
);

-- 16. SUPPORT ATTACHMENTS
CREATE TABLE support_attachments (
    attachment_id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES support_messages (message_id) ON DELETE CASCADE,
    INDEX idx_message (message_id)
);


-- =========================
-- DATA INSERTIONS
-- =========================

-- 02_data.sql
-- Seed data

-- 1. Categories
INSERT INTO categories (name, description) VALUES
('Smartphones', 'Mobile phones with advanced computing capabilities.'),
('Laptops', 'Portable personal computers.'),
('Audio', 'Headphones, speakers, and audio equipment.'),
('Accessories', 'Chargers, cases, and other peripherals.');

-- 2. Products (Original Batch 1-10)
INSERT INTO products (product_id, category_id, name, model, serial_number, description, quantity_in_stock, price, list_price, warranty_status, distributor_info) VALUES
(1, 1, 'iPhone 17 Pro Max', 'FUT-IP17-PM', 'SN-IP17-PM-BL', 'Future generation design, A19 Pro chip, 10x Telephoto camera.', 50, 89999.00, 89999.00, '2 Years Apple Turkey', 'Apple Inc.'),
(2, 1, 'Samsung Galaxy S25 Ultra', 'SM-S938B', 'SN-S25U-AI-512', 'Snapdragon 8 Gen 4, 200MP AI Camera, Titanium Frame.', 40, 69999.00, 74999.00, '2 Years Samsung Turkey', 'Samsung Electronics'),
(3, 1, 'Xiaomi 15T Pro', '2507FPN8EG', 'SN-MI15T-256', 'Leica Summilux lens, 144Hz CrystalRes AMOLED, MediaTek Dimensity 9400, 120W HyperCharge.', 60, 39999.00, 44999.00, '2 Years Xiaomi Turkey', 'Xiaomi Turkey'),
(4, 2, 'Lenovo Yoga Slim 7 Core Ultra 5', '83CV0019TR', 'SN-YOGA7-CU5', 'Intel Core Ultra 5 125H, 14-inch WUXGA OLED, 16GB RAM, AI Engine, Ultra-thin chassis.', 25, 42999.00, 46999.00, '2 Years Lenovo Turkey', 'Lenovo Turkey'),
(5, 2, 'MSI Katana 17', 'B13VFK-1036XTR', 'SN-MSI-KAT17', 'Intel Core i7-13620H, RTX 4060 8GB, 17.3-inch FHD 144Hz, Gaming Performance.', 30, 54999.00, 59999.00, '2 Years MSI Turkey', 'MSI Turkey'),
(6, 3, 'JBL Tune 570BT', 'JBLT570BTBLK', 'SN-JBL-570-BL', 'Wireless On-Ear Headphones, Pure Bass Sound, 40H Battery Life, Multi-point Connection.', 80, 1799.00, 1999.00, '2 Years JBL Turkey', 'JBL Turkey'),
(7, 3, 'Apple AirPods Max', 'MGYH3AM/A', 'SN-APM-MAX-001', 'High-fidelity audio, Active Noise Cancellation with Transparency mode, Spatial Audio, Space Grey.', 15, 22999.00, 24999.00, '2 Years Apple Turkey', 'Apple Inc.'),
(8, 3, 'JBL Go 4 Bluetooth Speaker', 'JBLGO4BLK', 'SN-JBL-GO4-BL', 'Ultra-portable, waterproof and dustproof (IP67), 7 hours of playtime, JBL Pro Sound.', 100, 1499.00, 1699.00, '2 Years JBL Turkey', 'JBL Turkey'),
(9, 4, 'BASEUS 5000mAh 20W PicoGo', 'PICO-GO-5K', 'SN-BAS-PICO-5K', 'Qi2 Magnetic Wireless Charging, 20W Fast Charging, Compact Design, Strong Magnets.', 150, 1299.00, 1499.00, '2 Years Baseus Turkey', 'Baseus Turkey'),
(10, 4, 'Apple 20W USB-C Fast Charger', 'MHJE3TU/A', 'SN-APP-20W-CHG', 'Apple 20W USB-C Power Adapter offers fast, efficient charging at home, in the office, or on the go.', 200, 729.00, 799.00, '2 Years Apple Turkey', 'Apple Inc.');

-- 3. Products (New Batch 11-15)
INSERT INTO products (product_id, category_id, name, model, serial_number, description, quantity_in_stock, price, list_price, warranty_status, distributor_info, currency) VALUES 
(11, 4, 'Apple iPhone 17 Pro Max Clear Case with MagSafe', 'MGFW4ZM/A', 'SN-IP17PM-MAG-001', 'Thin, light, and easy to grip — this Apple-designed case shows off the brilliant colored finish of iPhone 17 Pro Max while providing extra protection. Crafted with a blend of optically clear polycarbonate and flexible materials.', 1, 2499.00, 2750.00, '2 Years Apple Türkiye Warranty', 'Apple Türkiye', 'TL'),
(12, 2, 'Logitech G G213 Prodigy RGB Gaming Keyboard', '920-008094', 'SN-G213-KB-TR-001', 'Gaming-grade performance with Mech-Dome keys that deliver a superior tactile response. Features 5 individual RGB lighting zones with 16.8 million colors (LIGHTSYNC), a spill-resistant durable design, and dedicated media controls.', 0, 2199.00, 2600.00, '2 Years Logitech Türkiye Warranty', 'Logitech Türkiye', 'TL'),
(13, 2, 'Razer Basilisk V3 Pro 30000 DPI Wireless Gaming Mouse', 'RZ01-04620100-R3G1', 'SN-RAZER-BAS-V3-001', 'The king of gaming mice returns to raise the game. Armed with the Razer Focus Pro 30K Optical Sensor, 13-zone Chroma lighting with full underglow, and the Razer HyperScroll Tilt Wheel. Features iconic ergonomic form with 10+1 programmable buttons.', 10, 5499.00, 6250.00, '2 Years Bilkom Warranty', 'Bilkom', 'TL'),
(14, 3, 'Apple AirPods Pro 2', 'MTJV3TU/A', 'SN-AIRPODS-PRO2-001', 'Rebuilt from the sound up. AirPods Pro 2 feature up to 2x more Active Noise Cancellation, plus Adaptive Transparency, and Personalized Spatial Audio with dynamic head tracking for immersive sound. Now with multiple ear tips (XS, S, M, L) and up to 6 hours of listening time.', 100, 8999.00, 9999.00, '2 Years Apple Türkiye Warranty', 'Apple Türkiye', 'TL'),
(15, 1, 'Xiaomi Redmi Note 14 8GB 256GB Black', '24117RN76G', 'SN-REDMI-N14-001', 'Features a 6.67-inch AMOLED display with 120Hz refresh rate, 5500mAh battery with 33W fast charging, and a 108MP triple camera system. Powered by MediaTek Helio G99 Ultra with IP54 dust and splash resistance.', 11, 12999.00, 13999.00, '2 Years Xiaomi Türkiye Warranty', 'Xiaomi Türkiye', 'TL');

-- 4. Users 
INSERT INTO users (email, password_hash, role, first_name_encrypted, last_name_encrypted, tax_id_encrypted) VALUES
('john.doe@example.com', '$2b$10$hash1', 'customer', 'ENC_JOHN', 'ENC_DOE', 'ENC_TAX_1'),
('jane.smith@example.com', '$2b$10$hash2', 'customer', 'ENC_JANE', 'ENC_SMITH', 'ENC_TAX_2'),
('sales@shop.com', '$2b$10$hash3', 'sales manager', 'ENC_SALES', 'ENC_MAN', 'ENC_TAX_3');

-- 5. User Addresses
INSERT INTO user_addresses (user_id, address_title, country, city, postal_code, address_line_encrypted) VALUES
(1, 'Home', 'Turkey', 'Istanbul', '34000', 'ENC_HOME_ADDR_JOHN'),
(1, 'Work', 'Turkey', 'Ankara', '06000', 'ENC_WORK_ADDR_JOHN'),
(2, 'Home', 'Turkey', 'Izmir', '35000', 'ENC_HOME_ADDR_JANE');

-- 6. Reviews
INSERT INTO reviews (product_id, user_id, rating, comment_text) VALUES
(4, 2, 5, 'Absolutely love this laptop! Blazing fast and the screen is gorgeous.'),
(6, 1, 4, 'Great sound, but the battery life could be a little better.'),
(4, 1, 4, 'Solid machine for work. A bit pricy but worth it.');

-- 7. Payment Methods
INSERT INTO payment_methods (user_id, gateway_customer_id, card_brand, last_four_digits, is_default) VALUES
(1, 'cus_tok_john123', 'Visa', '4242', true),
(1, 'cus_tok_john456', 'Mastercard', '1234', false),
(2, 'cus_tok_jane789', 'Visa', '8888', true);

-- 8. Orders
INSERT INTO orders (user_id, status, total_price, shipping_country, shipping_city, shipping_address_encrypted, order_date) VALUES
(1, 'delivered', 89999.00, 'Turkey', 'Istanbul', 'ENC_HOME_ADDR_JOHN', NOW() - INTERVAL 7 DAY),
(1, 'cart', NULL, NULL, NULL, NULL, NULL),
(2, 'processing', 111579.00, 'Turkey', 'Izmir', 'ENC_HOME_ADDR_JANE', NOW() - INTERVAL 1 DAY);

-- 9. Order Items
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
(1, 2, 1, 1199.99),
(2, 9, 2, 49.99),
(3, 5, 1, 899.50);

-- 10. Wishlists
INSERT INTO wishlists (user_id, product_id) VALUES
(1, 4),
(1, 7),
(2, 6);

-- 11. Product Images 
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES
-- Product 1
(1, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153503-1_large.jpg', 'iPhone 17 Pro Max Front', true, 1),
(1, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153503-2_large.jpg', 'iPhone 17 Pro Max Back', false, 2),
(1, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153503-3_large.jpg', 'iPhone 17 Pro Max Side', false, 3),
(1, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153503-4_large.jpg', 'iPhone 17 Pro Max Detail', false, 4),
-- Product 2
(2, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/samsung/thumb/1-193_large.jpg', 'Samsung Galaxy S25 Ultra Front', true, 1),
(2, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/samsung/thumb/2-187_large.jpg', 'Samsung Galaxy S25 Ultra Back', false, 2),
(2, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/samsung/thumb/3-187_large.jpg', 'Samsung Galaxy S25 Ultra Stylus', false, 3),
(2, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/samsung/thumb/4-151_large.jpg', 'Samsung Galaxy S25 Ultra Side', false, 4),
-- Product 3
(3, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/153457-1_large.jpg', 'Xiaomi 15T Pro Front', true, 1),
(3, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/153457-2_large.jpg', 'Xiaomi 15T Pro Back', false, 2),
(3, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/153457-3_large.jpg', 'Xiaomi 15T Pro Camera', false, 3),
(3, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/153457-4_large.jpg', 'Xiaomi 15T Pro Side', false, 4),
-- Product 4
(4, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/lenovo/thumb/152336-1_large.jpg', 'Lenovo Yoga Slim 7 Front', true, 1),
(4, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/lenovo/thumb/152336-2_large.jpg', 'Lenovo Yoga Slim 7 Keyboard', false, 2),
(4, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/lenovo/thumb/152336-3_large.jpg', 'Lenovo Yoga Slim 7 Side', false, 3),
(4, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/lenovo/thumb/152336-4_large.jpg', 'Lenovo Yoga Slim 7 Closed', false, 4),
-- Product 5
(5, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/msi/thumb/152400-1-1_large.jpg', 'MSI Katana 17 Front', true, 1),
(5, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/msi/thumb/152400-2-1_large.jpg', 'MSI Katana 17 Open', false, 2),
(5, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/msi/thumb/152400-3-1_large.jpg', 'MSI Katana 17 Side', false, 3),
(5, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/msi/thumb/152400-5-1_large.jpg', 'MSI Katana 17 Back', false, 4),
-- Product 6
(6, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/142350-1_large.jpg', 'JBL Tune 570BT Folded', true, 1),
(6, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/142350-2_large.jpg', 'JBL Tune 570BT Side', false, 2),
(6, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/142350-3_large.jpg', 'JBL Tune 570BT Angled', false, 3),
(6, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/142350-4_large.jpg', 'JBL Tune 570BT Front', false, 4),
-- Product 7
(7, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/1-351_large.jpg', 'Apple AirPods Max Front', true, 1),
(7, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/2-350_large.jpg', 'Apple AirPods Max Side', false, 2),
(7, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/3-350_large.jpg', 'Apple AirPods Max Case', false, 3),
-- Product 8
(8, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/145617-1_large.jpg', 'JBL Go 4 Front', true, 1),
(8, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/145617-2_large.jpg', 'JBL Go 4 Side', false, 2),
(8, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/145617-3_large.jpg', 'JBL Go 4 Angled', false, 3),
(8, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/jbl/thumb/145617-4_large.jpg', 'JBL Go 4 Back', false, 4),
-- Product 9
(9, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/baseus/thumb/151371-1_large.jpg', 'Baseus PicoGo Front', true, 1),
(9, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/baseus/thumb/151371-2_large.jpg', 'Baseus PicoGo Side', false, 2),
(9, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/baseus/thumb/151371-3_large.jpg', 'Baseus PicoGo Magnetic', false, 3),
(9, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/baseus/thumb/151371-4_large.jpg', 'Baseus PicoGo Angled', false, 4),
-- Product 10
(10, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/150372-1_large.jpg', 'Apple 20W Charger Front', true, 1),
(10, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/150372-2_large.jpg', 'Apple 20W Charger Prongs', false, 2),
(10, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/150372-3_large.jpg', 'Apple 20W Charger Box', false, 3),
-- Product 11 (iPhone Case)
(11, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153653-1_large.jpg', NULL, 1, 0),
(11, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153653-2_large.jpg', NULL, 0, 0),
(11, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/153653-3_large.jpg', NULL, 0, 0),
-- Product 12 (Logitech Keyboard)
(12, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/logitech/thumb/v2-84663_large.jpg', NULL, 1, 0),
(12, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/logitech/thumb/v2-84663-1_large.jpg', NULL, 0, 0),
(12, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/logitech/thumb/v2-84663-2_large.jpg', NULL, 0, 0),
-- Product 13 (Razer Mouse)
(13, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/razer/thumb/142187-1_large.jpg', NULL, 1, 0),
(13, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/razer/thumb/142187-2_large.jpg', NULL, 0, 0),
(13, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/razer/thumb/142187-3_large.jpg', NULL, 0, 0),
-- Product 14 (AirPods Pro 2)
(14, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/141492-1_large.jpg', NULL, 1, 0),
(14, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/141492-2_large.jpg', NULL, 0, 0),
(14, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/141492-3_large.jpg', NULL, 0, 0),
(14, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/141492-5_large.jpg', NULL, 0, 0),
-- Product 15 (Xiaomi Redmi Note 14)
(15, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/149055-1_large.jpg', NULL, 1, 0),
(15, 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/xiaomi/thumb/149055-4_large.jpg', NULL, 0, 0);

-- 12. Dev User (Inserted with specific ID 0)
SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO';
INSERT INTO users (user_id, email, password_hash, role)
VALUES (0,'dev@test.local', '$2b$10$fakehash.for.dev.dev', 'dev');
SET SESSION sql_mode = '';


-- =========================
-- PROCEUDRES AND TRIGGERS
-- =========================

-- 03_procedures.sql
-- Triggers and Stored Procedures

-- 1. Trigger: Update Popularity
DELIMITER $$
CREATE TRIGGER trg_UpdatePopularityOnPurchase
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF OLD.status IN ('processing', 'in-transit') AND NEW.status = 'delivered' THEN
        UPDATE products p
        INNER JOIN order_items oi ON p.product_id = oi.product_id
        SET p.order_count = p.order_count + oi.quantity
        WHERE oi.order_id = NEW.order_id;
    END IF;
END$$
DELIMITER ;

-- 2. Procedure: Get Product Reviews
DELIMITER $$
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
DELIMITER ;

-- 3. Procedure: Get Average Rating
DELIMITER $$
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
DELIMITER ;

-- 4. Procedure: Get User Reviews
DELIMITER $$
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
DELIMITER ;


--Verification Selects
SELECT * FROM Orders
SELECT * FROM Order_Items
SELECT * FROM Payment_Methods
SELECT * FROM Reviews
SELECT * FROM Categories
SELECT * FROM Products
SELECT * FROM Users
SELECT * FROM User_Addresses
SELECT * FROM Wishlists
SELECT * FROM Product_Images
SELECT * FROM Notifications
SELECT * FROM Refunds
SELECT * FROM Verification_Codes
SELECT * FROM Support_Chats
SELECT * FROM Support_Messages
SELECT * FROM Support_Attachments


