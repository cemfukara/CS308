# Order Cancel and Refund API Documentation

This document describes the backend implementation for order cancellation and refund operations.

## Overview

The system now supports two critical operations for order management:
- **Cancel Order**: Cancel an order that is in "processing" status
- **Refund Order**: Refund an order that has been "delivered"

Both operations automatically restore product inventory and update order counts.

## API Endpoints

### 1. Cancel Order

**Endpoint**: `POST /api/orders/:id/cancel`

**Description**: Cancels an existing order. The order must be in "processing" status to be cancelled.

**Authentication**: Required (JWT token)

**URL Parameters**:
- `id` (number) - The order ID to cancel

**Request Headers**:
```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Success Response**:
- **Status Code**: 200 OK
- **Response Body**:
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

**Error Responses**:

1. **Invalid Order ID**:
   - **Status Code**: 400 Bad Request
   - **Response Body**:
   ```json
   {
     "success": false,
     "message": "Invalid order ID"
   }
   ```

2. **Order Not Found**:
   - **Status Code**: 400 Bad Request
   - **Response Body**:
   ```json
   {
     "success": false,
     "message": "Order not found"
   }
   ```

3. **Invalid Status**:
   - **Status Code**: 400 Bad Request
   - **Response Body**:
   ```json
   {
     "success": false,
     "message": "Cannot cancel order. Order status is 'delivered', but must be 'processing' to cancel."
   }
   ```

4. **Server Error**:
   - **Status Code**: 500 Internal Server Error
   - **Response Body**:
   ```json
   {
     "success": false,
     "message": "Server error"
   }
   ```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/orders/123/cancel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 2. Refund Order

**Endpoint**: `POST /api/orders/:id/refund`

**Description**: Refunds a delivered order. The order must be in "delivered" status to be refunded.

**Authentication**: Required (JWT token)

**URL Parameters**:
- `id` (number) - The order ID to refund

**Request Headers**:
```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```

**Success Response**:
- **Status Code**: 200 OK
- **Response Body**:
```json
{
  "success": true,
  "message": "Order refunded successfully"
}
```

**Error Responses**:

1. **Invalid Order ID**:
   - **Status Code**: 400 Bad Request
   - **Response Body**:
   ```json
   {
     "success": false,
     "message": "Invalid order ID"
   }
   ```

2. **Order Not Found**:
   - **Status Code**: 400 Bad Request
   - **Response Body**:
   ```json
   {
     "success": false,
     "message": "Order not found"
   }
   ```

3. **Invalid Status**:
   - **Status Code**: 400 Bad Request
   - **Response Body**:
   ```json
   {
     "success": false,
     "message": "Cannot refund order. Order status is 'processing', but must be 'delivered' to refund."
   }
   ```

4. **Server Error**:
   - **Status Code**: 500 Internal Server Error
   - **Response Body**:
   ```json
   {
     "success": false,
     "message": "Server error"
   }
   ```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/orders/123/refund \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Business Logic

### Cancel Order Flow

1. **Verification**: 
   - Verifies the order exists and belongs to the authenticated user
   - Checks if the order status is "processing"

2. **Stock Restoration**:
   - For each product in the order:
     - Increases `quantity_in_stock` by the ordered quantity
     - Decreases `order_count` by the ordered quantity (with minimum value of 0)

3. **Status Update**:
   - Changes the order status to "cancelled"

### Refund Order Flow

1. **Verification**: 
   - Verifies the order exists and belongs to the authenticated user
   - Checks if the order status is "delivered"

2. **Stock Restoration**:
   - For each product in the order:
     - Increases `quantity_in_stock` by the ordered quantity
     - Decreases `order_count` by the ordered quantity (with minimum value of 0)

3. **Status Update**:
   - Changes the order status to "refunded"

---

## Status Transition Rules

```
Order Status Flow:
  cart → processing → in-transit → delivered
                ↓                      ↓
            cancelled              refunded
```

**Allowed Transitions**:
- `processing` → `cancelled` (via cancel endpoint)
- `delivered` → `refunded` (via refund endpoint)

**Restrictions**:
- Cannot cancel an order unless it's in "processing" status
- Cannot refund an order unless it's in "delivered" status
- Cannot cancel or refund orders in other statuses

---

## Database Changes

Both operations modify the following tables:

### 1. `orders` Table
- Updates `status` field to either "cancelled" or "refunded"

### 2. `products` Table
For each product in the cancelled/refunded order:
- `quantity_in_stock` is increased by the order quantity
- `order_count` is decreased by the order quantity

---

## Security

- Both endpoints require authentication via JWT token
- Users can only cancel/refund their own orders
- Order ownership is verified before any operation

---

## Implementation Files

### Model Layer
**File**: `backend/models/Order.js`
- `cancelOrder(orderId, userId)` - Handles cancel logic
- `refundOrder(orderId, userId)` - Handles refund logic

### Controller Layer
**File**: `backend/app/controllers/orderController.js`
- `cancelOrderController(req, res)` - Cancel endpoint controller
- `refundOrderController(req, res)` - Refund endpoint controller

### Route Layer
**File**: `backend/routes/orderRoutes.js`
- `POST /api/orders/:id/cancel` - Cancel route
- `POST /api/orders/:id/refund` - Refund route

---

## Testing

### Manual Testing with cURL

**1. Cancel an order (order must be in "processing" status):**
```bash
# Replace <ORDER_ID> and <JWT_TOKEN> with actual values
curl -X POST http://localhost:3000/api/orders/<ORDER_ID>/cancel \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

**2. Refund an order (order must be in "delivered" status):**
```bash
# Replace <ORDER_ID> and <JWT_TOKEN> with actual values
curl -X POST http://localhost:3000/api/orders/<ORDER_ID>/refund \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

### Test Scenarios

1. **Successful Cancel**:
   - Create an order (status: "processing")
   - Call cancel endpoint
   - Verify order status is "cancelled"
   - Verify product stock is restored

2. **Failed Cancel - Wrong Status**:
   - Try to cancel an order with status "delivered"
   - Should receive error message about status requirement

3. **Successful Refund**:
   - Create an order and update status to "delivered"
   - Call refund endpoint
   - Verify order status is "refunded"
   - Verify product stock is restored

4. **Failed Refund - Wrong Status**:
   - Try to refund an order with status "processing"
   - Should receive error message about status requirement

5. **Unauthorized Access**:
   - Try to cancel/refund another user's order
   - Should receive "Order not found" error

---

## Error Handling

All endpoints handle the following error scenarios:
- Invalid order ID format
- Order not found
- Order doesn't belong to the user
- Order status doesn't allow the operation
- Database errors

Errors are logged to the console with the ❌ prefix for easy debugging.

---

## Notes

- Both operations are **irreversible**
- Stock restoration happens automatically
- Order counts are updated to reflect the cancellation/refund
- The operations are transactional (either all succeed or all fail)
- Users can only manage their own orders

