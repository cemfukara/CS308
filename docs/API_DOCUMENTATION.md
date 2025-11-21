# API DOCUMENTATION

<font size="6"><span style="color:red">Warning!</span> This document subject to change during development</font>

## Overview

<font size="4">This document describes the REST API endpoints for project backend, and explains usage.</font>

- All data is exchanged in JSON.

- Authentication is handled via JWT tokens in the Authorization header.

- Error messages follow a consistent format:
  ```
  {
      "message": "Error description"
  }
  ```

## Authentication

**WIP**

### JWT Token Contents

**WIP**

# API Endpoints

## Admin Routes

api/admin/

| METHOD |  ENDPOINT  |            DESCRIPTION            |    Access     |
| :----: | :--------: | :-------------------------------: | :-----------: |
|  GET   |   /users   |          List all users           | Private/Admin |
|  GET   | /analytics |    Get sales/revenue analytics    | Private/Admin |
| PATCH  | /discounts | Apply or update product discounts | Private/Admin |
| DELETE | /users/:id |          Delete an user           | Private/Admin |

## User Endpoints

api/users/

| METHOD | ENDPOINT  |             DESCRIPTION              | Access  |
| :----: | :-------: | :----------------------------------: | :-----: |
|  POST  | /register |         Register a new user          | Public  |
|  POST  |  /login   |  Authenticate user and return token  | Public  |
|  GET   | /profile  |  Get logged-in user's profile info   | Private |
|  PUT   | /profile  | Update logged-in user's profile info | Private |

### POST /users/register

Registers the user with given credentials

- Request Body:

  ```
  {
      "full_name":"Ali Mehmet Yılmaz",
      "email":"alimemo@provider.com",
      "password":"alimemoyılmaz"
  }
  ```

- Response Body:

  ```
  {
    // http status: 201
    "message": "User registered successfully",
    "user": {
        "full_name": "Ali Mehmet Yılmaz",
        "user_id": auto_incremented_id,
        "email": "alimemo@provider.com"
    }
  }
  ```

- Error:
  ```
  {message: 'Email and password required'} // http status: 400
  OR
  {message: 'Email already registered'} // http status: 409
  OR
  { message: 'Server error' } // http status: 500
  ```

### POST /users/login

Try to log the user in with given credentials

- Request Body:

  ```
    {
        "email": "user_email",
        "password": "user_password"
    }
  ```

- Response Body (+ JWT cookie):

  ```
  {message: 'Login successful'} // http status: 201
  ```

- Error:
  ```
  { message: 'Invalid credentials' } // http status: 401
  OR
  { message: 'Server error' } // http status: 500
  ```

## Product Endpoints

api/products/

| METHOD | ENDPOINT |       DESCRIPTION        |    Access     |
| :----: | :------: | :----------------------: | :-----------: |
|  GET   |    /     |     Get all products     |    Public     |
|  GET   |   /:id   | Get single product by ID |    Public     |
|  POST  |    /     |    Add a new product     | Private/Admin |
|  PUT   |   /:id   |   Update product by ID   | Private/Admin |
| DELETE |   /:id   |   Delete product by ID   | Private/Admin |

## Cart Endpoints

api/cart

| METHOD |      ENDPOINT      |           DESCRIPTION           | Access  |
| :----: | :----------------: | :-----------------------------: | :-----: |
|  GET   |         /          |     Get user's current cart     | Private |
|  POST  |        /add        |   Add product to user's cart    | Private |
|  PUT   |      /update       | Update quantity or item in cart | Private |
| DELETE | /remove/:productId |    Remove product from cart     | Private |

## Order Endpoints

api/orders/

| METHOD |  ENDPOINT   |                  DESCRIPTION                   |    Access     |
| :----: | :---------: | :--------------------------------------------: | :-----------: |
|  GET   |      /      |       Get all orders for logged-in user        |    Private    |
|  GET   |    /:id     |            Get order details by ID             |    Private    |
|  POST  |      /      |         Create a new order (checkout)          |    Private    |
| PATCH  | /:id/status | Update order status (e.g., shipped, delivered) | Private/Admin |
| DELETE |    /:id     |                Cancel an order                 |    Private    |

# Future Expansions

`/api/chat`: WebSocket-based live support system (Socket.IO)

`/api/reviews`:Product reviews & ratings

- Manager approval system for reviews
