<div align="center">

# 🛍️ CS308 Online Store

### Modern Full-Stack E-Commerce Platform

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation)

</div>

---

## ✨ Features

- 🛒 **Shopping Cart** - Seamless cart management with real-time updates
- 🔐 **Authentication** - Secure JWT-based user authentication
- 💳 **Payment Integration** - Streamlined checkout process
- 📧 **Email Notifications** - Automated order confirmations and invoices (PDF)
- 📊 **Admin Dashboard** - Comprehensive analytics with Chart.js
- 🔍 **Product Search** - Advanced filtering and search capabilities
- ⭐ **Reviews & Ratings** - Customer feedback system
- 📱 **Responsive Design** - Mobile-first UI with Tailwind CSS
- 🎨 **Modern UI/UX** - Sleek interface with React Icons & FontAwesome

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** React 19.1 with React Router v7
- **Build Tool:** Vite 7.1
- **Styling:** Tailwind CSS 4.1
- **State Management:** Zustand
- **UI Components:** Lucide React, FontAwesome, React Icons
- **Charts:** Chart.js with react-chartjs-2
- **Testing:** Vitest with Testing Library

### Backend

- **Runtime:** Node.js with Express.js
- **Database:** MySQL 2
- **Authentication:** JWT (jsonwebtoken) + bcryptjs
- **Email Service:** Mailjet & Nodemailer
- **PDF Generation:** PDFKit
- **Validation:** express-validator
- **Logging:** Winston
- **Testing:** Vitest with Supertest

### DevOps

- **Package Manager:** npm
- **Process Manager:** Concurrently (for parallel dev servers)
- **Code Quality:** ESLint, Prettier, Husky, lint-staged
- **Hot Reload:** Nodemon (backend) & Vite HMR (frontend)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MySQL** (v8 or higher)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/cemfukara/CS308.git
   cd CS308
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example file and configure it with your settings:

   ```bash
   cp backend/.env.example backend/.env
   ```

   See [`backend/.env.example`](backend/.env.example) for all available options and detailed instructions.

4. **Set up the database**
   ```bash
   # Import the database schema
   mysql -u your_user -p < database/schema.sql
   ```

### Running the Application

#### Development Mode (Both Frontend & Backend)

```bash
npm run dev
```

#### Run Backend Only

```bash
npm run backend
```

#### Run Frontend Only

```bash
npm run frontend
```

The application will be available at:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## 📂 Project Structure

```
CS308/
├── 📁 backend/              # Express.js REST API
│   ├── app/
│   │   ├── controllers/     # Route controllers
│   │   ├── middlewares/     # Auth & validation middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── config/          # Configuration files
│   │   └── server.js        # Entry point
│   └── package.json
│
├── 📁 frontend/             # React + Vite application
│   └── online-store/
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── utils/       # Helper functions
│       │   ├── hooks/       # Custom React hooks
│       │   └── App.jsx      # Root component
│       └── package.json
│
├── 📁 database/             # Database files
│   ├── schema.sql           # Database schema
│   └── migrations/          # Database migrations
│
├── 📁 docs/                 # Project documentation
│
└── package.json             # Root package (scripts)
```

---

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
npm test
```

### Run Frontend Tests

```bash
cd frontend/online-store
npm test
```

### Watch Mode

```bash
npm run test:watch
```

---

## 🎨 Code Formatting

This project uses **Prettier** for consistent code formatting:

```bash
# Format all files
npm run format

# Backend only
cd backend && npm run format

# Frontend only
cd frontend/online-store && npm run format
```

---

## 📚 API Documentation

API endpoints are organized as follows:

- **Authentication:** `/api/auth/*`
- **Products:** `/api/products/*`
- **Cart:** `/api/cart/*`
- **Orders:** `/api/orders/*`
- **Reviews:** `/api/reviews/*`
- **Users:** `/api/users/*`

For detailed API documentation, see [`docs/API_DOCUMENTATION.md`](docs/).

---

## 🔗 Links

- **Repository:** [github.com/cemfukara/CS308](https://github.com/cemfukara/CS308)
- **Issues:** [Report a bug](https://github.com/cemfukara/CS308/issues)

---

<div align="center">

**Made with ❤️**

</div>
