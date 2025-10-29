USE mydb;

-- First, create the categories table
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Now, create the products table
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

    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

ALTER TABLE products
ADD COLUMN discount_ratio DECIMAL(5, 2) AS (
    -- Use a CASE statement to avoid division by zero
    CASE
        WHEN list_price > 0 AND price < list_price
        THEN (((list_price - price) / list_price) * 100)
        ELSE 0
    END
) STORED;

-- Add an index to make sorting by this new column super fast
CREATE INDEX idx_discount_ratio ON products (discount_ratio);

-- DATA INSERTION

-- First, insert the categories
INSERT INTO categories (name, description)
VALUES
    ('Smartphones', 'Mobile phones with advanced computing capabilities.'),
    ('Laptops', 'Portable personal computers.'),
    ('Audio', 'Headphones, speakers, and audio equipment.'),
    ('Accessories', 'Chargers, cases, and other peripherals.');

-- Now, insert the 10 products
INSERT INTO products (category_id, name, model, serial_number, description, quantity_in_stock, price, list_price, warranty_status, distributor_info)
VALUES
    -- (category_id 1 = Smartphones)
    (1, 'Photon X1', 'P-X1-256', 'SN-PX1-987A', 'The latest flagship smartphone with AI camera.', 50, 999.99, 999.99, '1 Year Manufacturer', 'Photon Devices'),
    (1, 'Galaxy S23 Ultra', 'G-S23-U', 'SN-GS23U-123B', 'Premium smartphone with S-Pen.', 35, 1199.99, 1199.99, '2 Years', 'Samsung Electronics'),
    (1, 'Photon X1 Lite', 'P-X1-LITE', 'SN-PX1L-159I', 'Budget-friendly smartphone.', 0, 349.00, 349.00, '1 Year', 'Photon Devices'), -- Out of stock

    -- (category_id 2 = Laptops)
    (2, 'AeroBook Pro 16', 'ABP-16-M3', 'SN-ABP16-456C', 'Powerful 16-inch laptop for professionals.', 20, 2399.00, 2499.00, '2 Years Extended', 'Aero Computers'), -- On sale
    (2, 'Zenith Z-Book 14', 'Z-ZBK-14G', 'SN-ZBK14-789D', 'Ultralight laptop for travel.', 40, 899.50, 950.00, '1 Year', 'Zenith Tech'), -- On sale

    -- (category_id 3 = Audio)
    (3, 'QuietZone Pro Buds', 'QZ-PRO-2', 'SN-QZPB2-321E', 'Active noise-cancelling wireless earbuds.', 75, 199.99, 249.99, '1 Year', 'AudioPhile Inc.'), -- On sale
    (3, 'SoundWave Max Speaker', 'SWM-BT5', 'SN-SWM5-654F', 'Portable Bluetooth speaker with deep bass.', 60, 129.00, 129.00, '1 Year', 'SoundWave'),
    (3, 'StudioMax Headphones', 'SM-HD-X2', 'SN-SMHD2-753J', 'Over-ear studio monitor headphones.', 25, 299.00, 349.00, '3 Years', 'AudioPhile Inc.'), -- On sale

    -- (category_id 4 = Accessories)
    (4, 'RapidCharge 100W Brick', 'RC-100W', 'SN-RC100-987G', 'GaN fast charger for laptops and phones.', 150, 49.99, 59.99, '6 Months', 'VoltTech'), -- On sale
    (4, 'AeroBook Pro Case', 'ABP-CS-16', 'SN-ABPCS-654H', 'Protective hardshell case for AeroBook 16.', 90, 39.99, 39.99, 'N/A', 'Aero Computers');

-- You can run these commands to verify the data
SELECT * FROM categories;
SELECT * FROM products;