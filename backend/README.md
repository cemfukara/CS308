<div align="center">

# 🔧 CS308 Backend API

### RESTful API for E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-v16+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

</div>

---

## 📋 Overview

This is the backend module for the CS308 online store project. It provides a robust REST API built with **Node.js** and **Express**, featuring JWT authentication, MySQL database integration, email notifications, and PDF invoice generation.

---

## ✨ Features

- 🔐 **JWT Authentication** - Secure token-based authentication with bcrypt password hashing
- 👥 **User Management** - Registration, login, profile management, and role-based access control
- 🛍️ **Product Catalog** - CRUD operations for products with advanced filtering and search
- 🛒 **Shopping Cart** - Session-based cart management with real-time updates
- 📦 **Order Processing** - Complete order lifecycle management from checkout to delivery
- ⭐ **Review System** - Product reviews and ratings with validation
- 💝 **Wishlist** - Customer wishlist functionality
- 📧 **Email Service** - Automated emails via Mailjet and Gmail SMTP
- 📄 **Invoice Generation** - PDF invoices using PDFKit
- 🔒 **Data Encryption** - Sensitive data encryption for enhanced security
- 📊 **Admin Dashboard** - Administrative endpoints for analytics and management
- 🧪 **Comprehensive Testing** - Unit and integration tests with Vitest
- 📝 **Request Validation** - Input validation using express-validator
- 📋 **Logging** - Winston-based logging for debugging and monitoring

---

## 🛠️ Tech Stack

| Category           | Technology                |
| ------------------ | ------------------------- |
| **Runtime**        | Node.js (ES Modules)      |
| **Framework**      | Express.js 4.21           |
| **Database**       | MySQL 2 (mysql2 package)  |
| **Authentication** | JWT + bcryptjs            |
| **Email Service**  | Mailjet & Nodemailer      |
| **PDF Generation** | PDFKit                    |
| **Validation**     | express-validator         |
| **Logging**        | Winston                   |
| **Testing**        | Vitest + Supertest        |
| **Dev Tools**      | Nodemon, Prettier, ESLint |

---

## 📂 Project Structure

```
backend/
├── 📁 app/
│   ├── server.js              # Application entry point
│   ├── app.js                 # Express app configuration
│   ├── config/                # Configuration files
│   │   ├── db.js              # Database connection
│   │   └── dotenv.js          # Environment variables
│   ├── controllers/           # Route controllers
│   │   ├── adminController.js
│   │   ├── cartController.js
│   │   ├── categoryController.js
│   │   ├── invoiceController.js
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   ├── reviewController.js
│   │   ├── userController.js
│   │   └── wishlistController.js
│   └── middlewares/           # Custom middleware
│       ├── authMiddleware.js  # JWT authentication
│       ├── errorHandler.js    # Global error handler
│       └── validators.js      # Input validation
│
├── 📁 models/                 # Database models
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   ├── Order.js
│   ├── Review.js
│   ├── Wishlist.js
│   ├── Invoice.js
│   └── Notification.js
│
├── 📁 routes/                 # API route definitions
│   ├── index.js               # Route registry
│   ├── adminRoutes.js         # Admin endpoints
│   ├── cartRoutes.js          # Cart management
│   ├── categoryRoutes.js      # Product categories
│   ├── invoiceRoutes.js       # Invoice operations
│   ├── orderRoutes.js         # Order management
│   ├── productRoutes.js       # Product CRUD
│   ├── reviewRoutes.js        # Review system
│   ├── userRoutes.js          # User operations
│   └── wishlistRoutes.js      # Wishlist features
│
├── 📁 utils/                  # Helper utilities
│   ├── emailService.js        # Mailjet integration
│   ├── gmailService.js        # Gmail SMTP service
│   ├── generateToken.js       # JWT token generation
│   ├── encrypter.js           # Data encryption/decryption
│   └── invoiceGenerator.js    # PDF invoice creation
│
├── 📁 tests/                  # Test suites
│   ├── admin.test.js
│   ├── auth.test.js
│   ├── cart.test.js
│   ├── category.test.js
│   ├── invoice.test.js
│   ├── order.test.js
│   ├── product.test.js
│   ├── review.test.js
│   ├── user.test.js
│   ├── utils.test.js
│   └── wishlist.test.js
│
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher
- **npm** or **yarn**
- **MySQL** v8 or higher

### Installation

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and configure with your settings:

   ```bash
   cp .env.example .env
   ```

   See [`.env.example`](.env.example) for all available configuration options with detailed comments.

4. **Set up the database**
   ```bash
   mysql -u root -p < ../database/schema.sql
   ```

### Running the Server

**Development Mode (with hot reload)**

```bash
npm run dev
```

**Production Mode**

```bash
npm start
```

The API will be available at `http://localhost:5000`

---

## 📚 API Endpoints

### Authentication & Users

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (authenticated)
- `PATCH /api/users/profile` - Update profile (authenticated)

### Products

- `GET /api/products` - List all products (with filters)
- `GET /api/products/featured` - Get featured product
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (product manager)
- `PUT /api/products/:id` - Update product (product manager)
- `DELETE /api/products/:id` - Delete product (product manager)

### Categories

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (product manager)
- `PUT /api/categories/:id` - Update category (product manager)
- `PUT /api/categories/:id/reassign` - Reassign and delete category (product manager)
- `DELETE /api/categories/:id` - Delete category (product manager)

### Cart

- `GET /api/cart` - Get user's cart (authenticated)
- `POST /api/cart/add` - Add item to cart (authenticated)
- `PUT /api/cart/update` - Update cart item (authenticated)
- `DELETE /api/cart/remove/:productId` - Remove from cart (authenticated)
- `DELETE /api/cart/clear` - Clear entire cart (authenticated)

### Orders

- `GET /api/orders` - Get user's orders (authenticated)
- `GET /api/orders/:id` - Get order details (authenticated)
- `POST /api/orders` - Create new order (authenticated)
- `DELETE /api/orders/:id` - Cancel order (authenticated)

### Reviews

- `GET /api/reviews/product/:productId` - Get product reviews
- `GET /api/reviews/product/:productId/average` - Get average rating
- `GET /api/reviews/user/:userId` - Get user's reviews
- `POST /api/reviews/product/:productId` - Create review (authenticated)
- `PUT /api/reviews/:reviewId` - Update review (authenticated)
- `DELETE /api/reviews/:reviewId` - Delete review (authenticated)

### Wishlist

- `GET /api/wishlist` - Get user's wishlist (authenticated)
- `POST /api/wishlist` - Add to wishlist (authenticated)
- `DELETE /api/wishlist/:id` - Remove from wishlist (authenticated)
- `DELETE /api/wishlist` - Clear wishlist (authenticated)

### Admin - Sales Manager

- `PATCH /api/discount` - Set product discount
- `PATCH /api/refunds/:id/approve` - Approve/decline refund

### Admin - Product Manager

- `GET /api/deliveries` - Get all deliveries
- `PATCH /api/deliveries/:id/status` - Update delivery/order status

### Admin - Support Agent

- `GET /api/support/chat/queue` - Get chat queue
- `GET /api/support/chat/:id/context` - Get chat context
- `POST /api/support/chat/:id/message` - Send message
- `POST /api/support/chat/:id/attachment` - Send attachment
- `PATCH /api/support/chat/:id/claim` - Claim chat

### Invoices

- `GET /api/invoice/:orderId/pdf` - Generate and download invoice PDF (authenticated)

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Watch Mode (for development)

```bash
npm run test:watch
```

### Test Coverage

Tests are written using **Vitest** and **Supertest**. Coverage includes:

- ✅ Authentication flows
- ✅ CRUD operations for all resources
- ✅ Input validation
- ✅ Error handling
- ✅ Utility functions (encryption, tokens, etc.)

---

## 🎨 Code Quality

### Format Code

```bash
npm run format
```

This project uses **Prettier** for consistent code formatting. Configuration is in `.prettierrc`.

---

## 🔒 Security Features

- **Password Hashing** - bcryptjs with salt rounds
- **JWT Tokens** - Secure, httpOnly cookies
- **Data Encryption** - AES-256 encryption for sensitive data
- **Input Validation** - express-validator for request validation
- **SQL Injection Prevention** - Parameterized queries with mysql2
- **CORS** - Configured for specific origins
- **Rate Limiting** - Protection against brute force attacks
- **Environment Variables** - Sensitive data in .env files

---

## 📧 Email Configuration

The backend supports two email services:

### Mailjet (Primary)

Configure in `.env`:

```env
MAILJET_API_KEY=your_key
MAILJET_API_SECRET=your_secret
MAILJET_SENDER_EMAIL=noreply@example.com
MAILJET_SENDER_NAME=TechZone
```

### Gmail SMTP (Backup)

1. Enable 2FA on your Google account
2. Generate an app password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Configure in `.env`:

```env
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_password
```

---

## 🐛 Debugging

### Enable Detailed Logging

Set `NODE_ENV=development` in `.env` to enable verbose logging.

### Disable Authentication (Development Only)

```env
AUTH_DISABLED=true
NODE_ENV=development
```

---

<div align="center">

**Built with ❤️ using Node.js & Express**

</div>
