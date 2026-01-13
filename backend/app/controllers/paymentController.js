// backend/app/controllers/paymentController.js
// Logic for validating payment information (mock implementation)

import logger from '../../utils/logger.js';
/**
 * Validates card expiry date
 */
function isExpiryValid(expiry) {
  if (!expiry) return false;

  const cleaned = expiry.replace(/\D/g, '');
  if (cleaned.length < 4) return false;

  const mm = parseInt(cleaned.slice(0, 2), 10);
  const yy = parseInt(cleaned.slice(2), 10);

  if (Number.isNaN(mm) || Number.isNaN(yy)) return false;
  if (mm < 1 || mm > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (yy < currentYear) return false;
  if (yy === currentYear && mm < currentMonth) return false;

  return true;
}

/**
 * Validates CVV
 */
function isCvvValid(cvv) {
  if (!cvv) return false;
  const cleaned = cvv.replace(/\D/g, '');
  return cleaned.length >= 3 && cleaned.length <= 4;
}

/**
 * Validates card number
 */
function isCardNumberValid(cardNumber) {
  if (!cardNumber) return false;
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length !== 16) return false;
  if (cleaned.endsWith('0000')) return false;

  return true;
}

// ==========================================================
// POST /api/payment/validate
// ==========================================================
export async function validatePayment(req, res) {
  const userId = req.user?.user_id || null;

  try {
    const { method, cardName, cardNumber, expiry, cvv } = req.body;

    if (!method) {
      logger.warn('Payment validation failed: missing method', {
        userId,
      });

      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    // -----------------------------
    // Cash on Delivery
    // -----------------------------
    if (method === 'Cash on Delivery' || method === 'cod') {
      logger.info('Payment validated (Cash on Delivery)', {
        userId,
      });

      return res.status(200).json({
        success: true,
        message: 'Payment validated successfully',
        paymentMethod: 'Cash on Delivery',
      });
    }

    // -----------------------------
    // Credit Card
    // -----------------------------
    if (method === 'Credit Card' || method === 'card') {
      if (!cardName || !cardNumber || !expiry || !cvv) {
        logger.warn('Card payment validation failed: missing fields', {
          userId,
        });

        return res.status(400).json({
          success: false,
          message: 'All card details are required',
        });
      }

      if (cardName.trim().length < 3) {
        logger.warn('Card payment validation failed: invalid cardholder name', {
          userId,
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid cardholder name',
        });
      }

      if (!isCardNumberValid(cardNumber)) {
        logger.warn(
          'Card payment validation failed: invalid or declined card',
          {
            userId,
          }
        );

        return res.status(400).json({
          success: false,
          message: 'Invalid or declined card number',
        });
      }

      if (!isExpiryValid(expiry)) {
        logger.warn(
          'Card payment validation failed: expired or invalid expiry',
          {
            userId,
          }
        );

        return res.status(400).json({
          success: false,
          message: 'Invalid or expired card',
        });
      }

      if (!isCvvValid(cvv)) {
        logger.warn('Card payment validation failed: invalid CVV', {
          userId,
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid CVV',
        });
      }

      logger.info('Payment validated (Credit Card)', {
        userId,
      });

      return res.status(200).json({
        success: true,
        message: 'Payment validated successfully',
        paymentMethod: 'Credit Card',
      });
    }

    // -----------------------------
    // Unknown method
    // -----------------------------
    logger.warn('Payment validation failed: unknown method', {
      userId,
      method,
    });

    return res.status(400).json({
      success: false,
      message: 'Invalid payment method',
    });
  } catch (err) {
    logger.error('Payment validation error', {
      userId,
      error: err,
    });

    res.status(500).json({
      success: false,
      message: 'Server error during payment validation',
    });
  }
}
