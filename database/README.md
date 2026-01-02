# E-Commerce Product & Support Database

This repository contains a comprehensive MySQL database schema designed to manage a modern e-commerce platform. It features advanced product management, secure user handling with encrypted fields, a full order lifecycle, and an integrated customer support ticketing system.



---

## Key Features

* **Dynamic Pricing:** Automatically calculates a `discount_ratio` using a generated column when a `list_price` is provided.
* **Security-First Architecture:** Utilizes `BLOB` fields for application-level encryption of sensitive data like names, tax IDs, and shipping addresses.
* **Automated Analytics:** Includes a trigger that updates product popularity rankings (`order_count`) automatically upon delivery.
* **Full Support Suite:** Features a complete module for live chat, guest session tracking, and file attachments.
* **Moderated Reviews:** A review system with status management (`pending`, `approved`, `rejected`) and stored procedures for rating calculations.

---

## Schema Architecture

The database consists of 16 tables organized into four main modules:

### 1. Product Catalog & Inventory
* **`categories`**: Hierarchical classification for products.
* **`products`**: Core inventory data, pricing, and stock levels.
* **`product_images`**: Multi-image support per product with primary image flags.

### 2. User Management & Security
* **`users`**: Role-based access control (`customer`, `sales manager`, `product manager`, `support agent`, `dev`).
* **`user_addresses`**: Encrypted storage for multiple user shipping/billing locations.
* **`verification_codes`**: OTP management for secure profile updates and account deletions.
* **`payment_methods`**: Tokenized storage for card brands and gateway IDs.

### 3. Sales & Fulfillment
* **`orders`**: Tracks status from `cart` to `delivered` or `cancelled`.
* **`order_items`**: Snapshots of product prices at the specific time of purchase.
* **`wishlists`**: User-saved items for future purchases.
* **`refunds`**: Formal workflow for return requests and approval decisions.

### 4. Communication & Support
* **`support_chats`**: Manages active sessions between customers and agents.
* **`support_messages` & `attachments`**: Full transcript history and file management.
* **`notifications`**: Real-time alerts for order updates and stock changes.

---

## Stored Logic & Automation

### Triggers
* **`trg_UpdatePopularityOnPurchase`**: Automatically increments the `order_count` in the `products` table when an order status is updated to 'delivered'.

### Stored Procedures
| Procedure | Description |
| :--- | :--- |
| `sp_GetProductReviews` | Retrieves all approved reviews and comments for a specific product. |
| `sp_GetProductAverageRating` | Calculates the mean rating and total review count for a product. |
| `sp_GetUserReviews` | Fetches the full review history for a specific user ID. |

---

## Setup & Installation

1.  **Requirement**: MySQL 8.0 or higher.
2.  **Initialize Schema**:
    ```sql
    CREATE SCHEMA mydb;
    USE mydb;
    ```
3.  **Run Script**: Execute the `ProductDatabase.sql` file. This will create all tables, triggers, procedures, and insert initial seed data (Categories, Products, and a Dev User).

---

