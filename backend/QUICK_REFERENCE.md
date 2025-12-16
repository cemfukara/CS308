# Quick Reference: Order Cancel & Refund Endpoints

## Endpoints

### Cancel Order
```
POST /api/orders/:id/cancel
```
**Requirement**: Order status must be `processing`

**Response**:
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

### Refund Order
```
POST /api/orders/:id/refund
```
**Requirement**: Order status must be `delivered`

**Response**:
```json
{
  "success": true,
  "message": "Order refunded successfully"
}
```

---

## JavaScript/Frontend Integration Examples

### Using Fetch API

```javascript
// Cancel Order
async function cancelOrder(orderId, token) {
  const response = await fetch(`/api/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Order cancelled:', data.message);
  } else {
    console.error('Error:', data.message);
  }
  
  return data;
}

// Refund Order
async function refundOrder(orderId, token) {
  const response = await fetch(`/api/orders/${orderId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Order refunded:', data.message);
  } else {
    console.error('Error:', data.message);
  }
  
  return data;
}
```

---

### Using Axios

```javascript
import axios from 'axios';

// Cancel Order
async function cancelOrder(orderId, token) {
  try {
    const response = await axios.post(
      `/api/orders/${orderId}/cancel`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Order cancelled:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Refund Order
async function refundOrder(orderId, token) {
  try {
    const response = await axios.post(
      `/api/orders/${orderId}/refund`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Order refunded:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
    throw error;
  }
}
```

---

## React Component Example

```jsx
import React, { useState } from 'react';

function OrderActions({ orderId, orderStatus, token }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCancel = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setMessage(data.message);
      
      if (data.success) {
        // Refresh order list or update UI
        window.location.reload();
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setMessage(data.message);
      
      if (data.success) {
        // Refresh order list or update UI
        window.location.reload();
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {orderStatus === 'processing' && (
        <button onClick={handleCancel} disabled={loading}>
          {loading ? 'Cancelling...' : 'Cancel Order'}
        </button>
      )}
      
      {orderStatus === 'delivered' && (
        <button onClick={handleRefund} disabled={loading}>
          {loading ? 'Processing Refund...' : 'Request Refund'}
        </button>
      )}
      
      {message && <p>{message}</p>}
    </div>
  );
}

export default OrderActions;
```

---

## Error Handling Example

```javascript
async function handleOrderOperation(orderId, operation, token) {
  const endpoint = operation === 'cancel' ? 'cancel' : 'refund';
  
  try {
    const response = await fetch(`/api/orders/${orderId}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Handle different status codes
    switch (response.status) {
      case 200:
        // Success
        return {
          success: true,
          message: data.message
        };
        
      case 400:
        // Bad request (wrong status, invalid ID, etc.)
        return {
          success: false,
          message: data.message,
          type: 'validation'
        };
        
      case 401:
        // Unauthorized
        return {
          success: false,
          message: 'Please log in again',
          type: 'auth'
        };
        
      case 500:
        // Server error
        return {
          success: false,
          message: 'Server error. Please try again later.',
          type: 'server'
        };
        
      default:
        return {
          success: false,
          message: 'Unexpected error occurred',
          type: 'unknown'
        };
    }
  } catch (error) {
    // Network error
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      type: 'network'
    };
  }
}

// Usage:
const result = await handleOrderOperation(123, 'cancel', userToken);
if (result.success) {
  showSuccessNotification(result.message);
} else {
  showErrorNotification(result.message);
}
```

---

## Status Validation

Before calling these endpoints, you can validate on the frontend:

```javascript
function canCancelOrder(order) {
  return order.status === 'processing';
}

function canRefundOrder(order) {
  return order.status === 'delivered';
}

// Usage in UI:
{canCancelOrder(order) && (
  <button onClick={() => cancelOrder(order.id)}>Cancel</button>
)}

{canRefundOrder(order) && (
  <button onClick={() => refundOrder(order.id)}>Refund</button>
)}
```

---

## Testing Checklist

- [ ] Cancel button only shows for "processing" orders
- [ ] Refund button only shows for "delivered" orders
- [ ] Success message displays correctly
- [ ] Error messages display correctly
- [ ] UI updates after successful operation
- [ ] Loading state prevents multiple clicks
- [ ] Unauthorized access shows appropriate error
- [ ] Network errors are handled gracefully

