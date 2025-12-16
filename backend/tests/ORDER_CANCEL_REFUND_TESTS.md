# Order Cancel and Refund Tests

This document describes the test suite for order cancellation and refund operations.

## Test Overview

The test suite covers comprehensive scenarios for both cancel and refund operations, including success cases, validation errors, and edge cases.

## Test Location

**File**: `backend/tests/order.test.js`

## Test Suites

### 1. Cancel Order Tests (`POST /orders/:id/cancel`)

#### Test Cases:

1. **✅ Successful Cancellation**
   - **Description**: Verifies that an order in "processing" status can be cancelled successfully
   - **Expected Result**: Returns 200 status with success message
   - **Verification**: Ensures `cancelOrder` model function is called with correct parameters

2. **❌ Order Not Found**
   - **Description**: Attempts to cancel a non-existent order
   - **Expected Result**: Returns 400 status with "Order not found" message
   - **Verification**: Checks proper error handling

3. **❌ Invalid Order Status**
   - **Description**: Attempts to cancel an order that is not in "processing" status
   - **Expected Result**: Returns 400 status with descriptive error message
   - **Verification**: Ensures status validation is enforced

4. **❌ Invalid Order ID**
   - **Description**: Sends a non-numeric order ID
   - **Expected Result**: Returns 400 status with "Invalid order ID" message
   - **Verification**: Tests input validation

5. **❌ Database Error**
   - **Description**: Simulates a database error during cancellation
   - **Expected Result**: Returns 500 status with "Server error" message
   - **Verification**: Tests error handling

---

### 2. Refund Order Tests (`POST /orders/:id/refund`)

#### Test Cases:

1. **✅ Successful Refund**
   - **Description**: Verifies that an order in "delivered" status can be refunded successfully
   - **Expected Result**: Returns 200 status with success message
   - **Verification**: Ensures `refundOrder` model function is called with correct parameters

2. **❌ Order Not Found**
   - **Description**: Attempts to refund a non-existent order
   - **Expected Result**: Returns 400 status with "Order not found" message
   - **Verification**: Checks proper error handling

3. **❌ Invalid Order Status**
   - **Description**: Attempts to refund an order that is not in "delivered" status
   - **Expected Result**: Returns 400 status with descriptive error message
   - **Verification**: Ensures status validation is enforced

4. **❌ Invalid Order ID**
   - **Description**: Sends a non-numeric order ID
   - **Expected Result**: Returns 400 status with "Invalid order ID" message
   - **Verification**: Tests input validation

5. **❌ Database Error**
   - **Description**: Simulates a database error during refund
   - **Expected Result**: Returns 500 status with "Server error" message
   - **Verification**: Tests error handling

---

## Running the Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm test
```

### Run Only Order Tests
```bash
npx vitest run order.test.js
```

---

## Test Structure

The tests use the following structure:

```javascript
describe('POST /orders/:id/cancel', () => {
  it('should return 200 and cancel order successfully', async () => {
    // Mock the model response
    OrderModel.cancelOrder.mockResolvedValue({
      success: true,
      message: 'Order cancelled successfully',
    });

    // Make the request
    const response = await request(app).post(
      `/orders/${TEST_ORDER_ID}/cancel`
    );

    // Verify the response
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Order cancelled successfully');
    
    // Verify the model was called correctly
    expect(OrderModel.cancelOrder).toHaveBeenCalledWith(
      TEST_ORDER_ID,
      TEST_USER_ID
    );
  });
});
```

---

## Test Data

### Test Constants
```javascript
const TEST_ORDER_ID = 500;
const TEST_USER_ID = 101;
```

### Mock Authentication
```javascript
const mockAuth = (req, res, next) => {
  req.user = { user_id: 101 };
  next();
};
```

All routes use the `mockAuth` middleware to simulate an authenticated user.

---

## Test Coverage

The test suite covers:

### ✅ Controller Layer
- Request parsing
- Parameter validation
- Response formatting
- Error handling

### ✅ Integration with Model Layer
- Model function calls
- Parameter passing
- Response handling

### ✅ HTTP Status Codes
- 200 OK (successful operations)
- 400 Bad Request (validation errors)
- 500 Internal Server Error (server errors)

### ✅ Response Messages
- Success messages
- Error messages
- Validation messages

---

## Mocking Strategy

The tests use **Vitest** mocking to isolate the controller layer:

```javascript
import * as OrderModel from '../models/Order.js';
vi.mock('../models/Order.js');
```

This allows us to test controller logic without hitting the actual database.

### Mocked Functions
- `OrderModel.cancelOrder` - Cancel order operation
- `OrderModel.refundOrder` - Refund order operation
- `OrderModel.getUserOrders` - Get user orders
- `OrderModel.getOrderById` - Get order by ID
- `OrderModel.getOrderItems` - Get order items
- `OrderModel.updateOrderStatus` - Update order status

---

## Expected Test Results

When running the tests, you should see output similar to:

```
✓ POST /orders/:id/cancel (5)
  ✓ should return 200 and cancel order successfully
  ✓ should return 400 if order not found
  ✓ should return 400 if order status is not processing
  ✓ should return 400 for invalid order ID
  ✓ should return 500 if the model layer throws an error

✓ POST /orders/:id/refund (5)
  ✓ should return 200 and refund order successfully
  ✓ should return 400 if order not found
  ✓ should return 400 if order status is not delivered
  ✓ should return 400 for invalid order ID
  ✓ should return 500 if the model layer throws an error

Test Files  1 passed (1)
     Tests  10 passed (10)
```

---

## Adding New Tests

To add new test cases:

1. Add a new `it()` block in the appropriate `describe()` section
2. Mock the necessary model responses
3. Make the HTTP request using `supertest`
4. Assert the expected results

Example:
```javascript
it('should handle concurrent cancellations', async () => {
  OrderModel.cancelOrder.mockResolvedValue({
    success: true,
    message: 'Order cancelled successfully',
  });

  const requests = [
    request(app).post(`/orders/${TEST_ORDER_ID}/cancel`),
    request(app).post(`/orders/${TEST_ORDER_ID}/cancel`),
  ];

  const responses = await Promise.all(requests);
  
  responses.forEach(response => {
    expect(response.statusCode).toBe(200);
  });
});
```

---

## Integration with CI/CD

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

---

## Troubleshooting

### Test Failures

If tests fail, check:

1. **Mock Setup**: Ensure mocks are properly configured
2. **Route Definitions**: Verify routes match the expected paths
3. **Response Format**: Check that controller responses match expected format
4. **Status Codes**: Confirm status codes match expected values

### Common Issues

- **Mock not called**: Ensure the route path matches exactly
- **Wrong status code**: Check controller error handling
- **Unexpected response**: Verify mock return values

---

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `afterEach()` to clear mocks
3. **Descriptive Names**: Test names should describe what they test
4. **Single Responsibility**: Each test should verify one thing
5. **Realistic Data**: Use realistic test data

---

## Related Documentation

- [ORDER_CANCEL_REFUND_API.md](../ORDER_CANCEL_REFUND_API.md) - API documentation
- [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) - Implementation overview
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) - Frontend integration guide

