# Order Cancel and Refund Implementation Summary

## What Was Implemented

This implementation adds complete backend support for:
1. **Order Cancellation** - Cancel orders in "processing" status
2. **Order Refund** - Refund orders in "delivered" status

Both operations automatically restore product inventory.

---

## Files Modified

### 1. `backend/models/Order.js`
Added two new exported functions:

#### `cancelOrder(orderId, userId)`
- Verifies order exists and belongs to user
- Checks order status is "processing"
- Restores product `quantity_in_stock`
- Decreases product `order_count`
- Updates order status to "cancelled"
- Returns success/failure message

#### `refundOrder(orderId, userId)`
- Verifies order exists and belongs to user
- Checks order status is "delivered"
- Restores product `quantity_in_stock`
- Decreases product `order_count`
- Updates order status to "refunded"
- Returns success/failure message

---

### 2. `backend/app/controllers/orderController.js`
Added two new controller functions:

#### `cancelOrderController(req, res)`
- Validates order ID parameter
- Calls `cancelOrder()` model function
- Returns appropriate HTTP response (200 OK or 400 Bad Request)
- Handles errors with 500 status

#### `refundOrderController(req, res)`
- Validates order ID parameter
- Calls `refundOrder()` model function
- Returns appropriate HTTP response (200 OK or 400 Bad Request)
- Handles errors with 500 status

---

### 3. `backend/routes/orderRoutes.js`
Added two new routes:

- `POST /api/orders/:id/cancel` - Triggers order cancellation
- `POST /api/orders/:id/refund` - Triggers order refund

Both routes require authentication.

---

## API Usage

### Cancel Order
```bash
POST /api/orders/:id/cancel
Authorization: Bearer <token>

# Response on success:
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

### Refund Order
```bash
POST /api/orders/:id/refund
Authorization: Bearer <token>

# Response on success:
{
  "success": true,
  "message": "Order refunded successfully"
}
```

---

## Business Rules Implemented

### Cancellation Rules
✅ Order must exist  
✅ Order must belong to authenticated user  
✅ Order status must be "processing"  
✅ Stock is restored automatically  
✅ Order count is decreased

### Refund Rules
✅ Order must exist  
✅ Order must belong to authenticated user  
✅ Order status must be "delivered"  
✅ Stock is restored automatically  
✅ Order count is decreased

---

## Inventory Management

Both operations handle inventory correctly:

**When order is cancelled/refunded:**
```sql
-- Restore stock
UPDATE products
SET quantity_in_stock = quantity_in_stock + <ordered_quantity>
WHERE product_id = ?

-- Decrease order count
UPDATE products
SET order_count = GREATEST(order_count - <ordered_quantity>, 0)
WHERE product_id = ?
```

This ensures:
- Products become available again for purchase
- Order statistics are accurate
- No negative values in order_count

---

## Error Handling

Both endpoints return clear error messages:

| Error | Status | Message |
|-------|--------|---------|
| Invalid ID | 400 | "Invalid order ID" |
| Not found | 400 | "Order not found" |
| Wrong status | 400 | "Cannot cancel/refund order. Status is X, but must be Y" |
| Server error | 500 | "Server error" |

---

## Security

✅ JWT authentication required  
✅ Users can only cancel/refund their own orders  
✅ Order ownership verified before operation  
✅ Status transitions are strictly controlled

---

## Testing Recommendations

1. **Test successful cancellation**
   - Create order → Cancel → Verify status changed & stock restored

2. **Test successful refund**
   - Create order → Mark as delivered → Refund → Verify status changed & stock restored

3. **Test status validation**
   - Try to cancel delivered order (should fail)
   - Try to refund processing order (should fail)

4. **Test authorization**
   - User A tries to cancel User B's order (should fail)

5. **Test stock restoration**
   - Check `quantity_in_stock` before and after cancel/refund
   - Check `order_count` before and after cancel/refund

---

## Complete Documentation

See `ORDER_CANCEL_REFUND_API.md` for detailed API documentation including:
- Full endpoint specifications
- Request/response examples
- Complete error response catalog
- Testing instructions
- cURL examples

