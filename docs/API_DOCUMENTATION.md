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

| METHOD |  ENDPOINT  |            DESCRIPTION            |    Access     |     Status      |
| :----: | :--------: | :-------------------------------: | :-----------: | :-------------: |
|  GET   |   /users   |          List all users           | Private/Admin | Not Implemented |
|  GET   | /analytics |    Get sales/revenue analytics    | Private/Admin | Not Implemented |
| PATCH  | /discounts | Apply or update product discounts | Private/Admin | Not Implemented |
| DELETE | /users/:id |          Delete an user           | Private/Admin | Not Implemented |

## User Endpoints

api/users/

| METHOD | ENDPOINT  |             DESCRIPTION              | Access  |     Status      |
| :----: | :-------: | :----------------------------------: | :-----: | :-------------: |
|  POST  | /register |         Register a new user          | Public  |    Finished     |
|  POST  |  /login   |  Authenticate user and return token  | Public  |    Finished     |
|  GET   | /profile  |  Get logged-in user's profile info   | Private | Not Implemented |
| PATCH  | /profile  | Update logged-in user's profile info | Private | Not Implemented |

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

| METHOD | ENDPOINT |       DESCRIPTION        |    Access     |     Status      |
| :----: | :------: | :----------------------: | :-----------: | :-------------: |
|  GET   |    /     |     Get all products     |    Public     | Not Implemented |
|  GET   |   /:id   | Get single product by ID |    Public     | Not Implemented |
|  POST  |    /     |    Add a new product     | Private/Admin | Not Implemented |
|  PUT   |   /:id   |   Update product by ID   | Private/Admin | Not Implemented |
| DELETE |   /:id   |   Delete product by ID   | Private/Admin | Not Implemented |

## Cart Endpoints

api/cart

| METHOD |      ENDPOINT      |           DESCRIPTION           | Access  |     Status      |
| :----: | :----------------: | :-----------------------------: | :-----: | :-------------: |
|  GET   |         /          |     Get user's current cart     | Private | Not Implemented |
|  POST  |        /add        |   Add product to user's cart    | Private | Not Implemented |
|  PUT   |      /update       | Update quantity or item in cart | Private | Not Implemented |
| DELETE | /remove/:productId |    Remove product from cart     | Private | Not Implemented |

## Order Endpoints

api/orders/

| METHOD |  ENDPOINT   |                  DESCRIPTION                   |    Access     |     Status      |
| :----: | :---------: | :--------------------------------------------: | :-----------: | :-------------: |
|  GET   |      /      |       Get all orders for logged-in user        |    Private    | Not Implemented |
|  GET   |    /:id     |            Get order details by ID             |    Private    | Not Implemented |
|  POST  |      /      |         Create a new order (checkout)          |    Private    | Not Implemented |
| PATCH  | /:id/status | Update order status (e.g., shipped, delivered) | Private/Admin | Not Implemented |
| DELETE |    /:id     |                Cancel an order                 |    Private    | Not Implemented |

# Future Expansions

`/api/chat`: WebSocket-based live support system (Socket.IO)

`/api/reviews`:Product reviews & ratings

- Manager approval system for reviews
