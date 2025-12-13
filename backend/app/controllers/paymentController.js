// backend/app/controllers/paymentController.js
// Logic for validating payment information (mock implementation)

/**
 * Validates card expiry date
 * @param {string} expiry - Format: MM/YY
 * @returns {boolean}
 */
function isExpiryValid(expiry) {
  if (!expiry) return false;
  
  const cleaned = expiry.replace(/\D/g, '');
  if (cleaned.length < 4) return false;
  
  const mm = parseInt(cleaned.slice(0, 2), 10);
  const yy = parseInt(cleaned.slice(2), 10);
  
  if (Number.isNaN(mm) || Number.isNaN(yy)) return false;
  if (mm < 1 || mm > 12) return false;
  
  // Check if card is expired
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Get last 2 digits
  const currentMonth = now.getMonth() + 1; // 1-12
  
  if (yy < currentYear) return false;
  if (yy === currentYear && mm < currentMonth) return false;
  
  return true;
}

/**
 * Validates CVV
 * @param {string} cvv
 * @returns {boolean}
 */
function isCvvValid(cvv) {
  if (!cvv) return false;
  const cleaned = cvv.replace(/\D/g, '');
  return cleaned.length >= 3 && cleaned.length <= 4;
}

/**
 * Validates card number
 * @param {string} cardNumber
 * @returns {boolean}
 */
function isCardNumberValid(cardNumber) {
  if (!cardNumber) return false;
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Only accept exactly 16 digits
  if (cleaned.length !== 16) return false;
  
  // Mock rule: Reject cards ending in 0000 (simulating declined cards)
  if (cleaned.endsWith('0000')) return false;
  
  return true;
}

// ==========================================================
// POST /api/payment/validate
//  - Validates payment information before order creation
// ==========================================================
export async function validatePayment(req, res) {
  try {
    const { method, cardName, cardNumber, expiry, cvv } = req.body;

    if (!method) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    // Cash on Delivery is always accepted
    if (method === 'Cash on Delivery' || method === 'cod') {
      return res.status(200).json({
        success: true,
        message: 'Payment validated successfully',
        paymentMethod: 'Cash on Delivery',
      });
    }

    // Credit Card validation
    if (method === 'Credit Card' || method === 'card') {
      // Validate all required fields are present
      if (!cardName || !cardNumber || !expiry || !cvv) {
        return res.status(400).json({
          success: false,
          message: 'All card details are required',
        });
      }

      // Validate card name
      if (cardName.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cardholder name',
        });
      }

      // Validate card number
      if (!isCardNumberValid(cardNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or declined card number',
        });
      }

      // Validate expiry
      if (!isExpiryValid(expiry)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired card',
        });
      }

      // Validate CVV
      if (!isCvvValid(cvv)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid CVV',
        });
      }

      // All validations passed
      return res.status(200).json({
        success: true,
        message: 'Payment validated successfully',
        paymentMethod: 'Credit Card',
      });
    }

    // Unknown payment method
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method',
    });
  } catch (err) {
    console.error('❌ Error validating payment:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during payment validation',
    });
  }
}
