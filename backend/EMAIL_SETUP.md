# Email Invoice System Setup Guide

## Quick Start

This guide will help you set up the automatic email invoice system for your shopping site.

## Prerequisites

- [x] `node-mailjet` package (already installed)
- [x] `pdfkit` package (already installed)
- [ ] Mailjet account with API credentials

## Setup Steps

### 1. Create Mailjet Account

1. Go to https://www.mailjet.com/
2. Click "Sign Up" and create a free account
3. Verify your email address

### 2. Get API Credentials

1. Log into your Mailjet dashboard
2. Go to **Account Settings** (top right) → **REST API** → **API Key Management**
3. You'll see:
   - **API Key** (public key)
   - **Secret Key** (private key)
4. Copy both keys

### 3. Verify Sender Email

1. In Mailjet dashboard, go to **Account Settings** → **Sender Addresses & Domains**
2. Click **Add a Sender Address**
3. Enter your email address (e.g., `noreply@yourdomain.com` or your Gmail)
4. Check your inbox and click the verification link
5. Wait for approval (usually instant for personal emails)

### 4. Configure Environment Variables

1. Open your `.env` file (or create it by copying `.env.example`)
2. Add the following lines:

```bash
MAILJET_API_KEY=your_actual_api_key_here
MAILJET_API_SECRET=your_actual_secret_key_here
MAILJET_SENDER_EMAIL=your_verified_email@domain.com
MAILJET_SENDER_NAME=Your Store Name
```

**Example:**
```bash
MAILJET_API_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
MAILJET_API_SECRET=9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k
MAILJET_SENDER_EMAIL=noreply@mystore.com
MAILJET_SENDER_NAME=My Awesome Store
```

### 5. Restart Your Server

```bash
npm run dev
```

## Testing

### Test 1: Generate Sample PDF

Run the test script to generate a sample invoice PDF:

```bash
node tests/test-pdf-generation.js
```

This will create `test-invoice.pdf` in your backend directory. Open it to verify the format.

### Test 2: Create a Test Order

1. Make sure your server is running
2. Create an order via your API:

```bash
POST http://localhost:5000/api/orders
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 29.99
    }
  ],
  "address": "123 Test Street, Test City, 12345",
  "payment": "credit_card"
}
```

3. Check your server logs - you should see:
   ```
   ✓ Invoice email sent successfully to customer@email.com for order #123
   ```

4. Check the customer's email inbox for the invoice

## How It Works

When a customer creates an order:

1. ✅ Order is created in the database
2. ✅ Order ID is returned to the customer immediately
3. ✅ **In the background:**
   - System fetches order details and items
   - Generates a PDF invoice
   - Sends an email with the PDF attached

> **Note:** Email sending happens asynchronously. Even if the email fails, the order creation succeeds!

## Troubleshooting

### Email Not Sending

**Check 1: Server Logs**
```bash
# Look for error messages like:
Error sending invoice email: [error details]
```

**Check 2: Mailjet Credentials**
- Verify API keys are correct in `.env`
- Make sure there are no extra spaces
- Keys should be exactly as shown in Mailjet dashboard

**Check 3: Sender Email**
- Verify the sender email is verified in Mailjet
- Check **Account Settings** → **Sender Addresses & Domains**
- Status should be "Active"

**Check 4: Mailjet Dashboard**
- Go to **Statistics** → **Today**
- Check if emails are being sent
- Look for any failed deliveries

### PDF Not Generated

**Check 1: Test Script**
```bash
node tests/test-pdf-generation.js
```

If this fails, there's an issue with the PDF generator code.

**Check 2: Order Data**
- Make sure orders have all required fields
- Customer email must exist in the database

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Email service not configured` | Missing API credentials | Add `MAILJET_API_KEY` and `MAILJET_API_SECRET` to `.env` |
| `Sender email not configured` | Missing sender email | Add `MAILJET_SENDER_EMAIL` to `.env` |
| `Cannot send invoice: missing customer email` | User has no email in database | Make sure user registration captures email |
| `Authentication failed` | Invalid API credentials | Double-check your Mailjet API keys |

## Mailjet Free Tier

✅ **6,000 emails/month** (200 per day)  
✅ **Unlimited contacts**  
✅ **Email statistics and tracking**  
✅ **Perfect for university projects!**

## Files Involved

- `utils/sendEmail.js` - Email sending logic
- `utils/pdfGenerator.js` - PDF invoice generation
- `app/controllers/orderController.js` - Order creation + email trigger
- `.env` - Configuration (API keys)

## Need Help?

1. Check the [walkthrough.md](file:///C:/Users/CE/.gemini/antigravity/brain/85e3ed66-3468-415b-93ab-c01dcfaad0ed/walkthrough.md) for detailed implementation info
2. Review Mailjet documentation: https://dev.mailjet.com/
3. Check server logs for specific error messages

---

**That's it! Your email invoice system is ready to go! 🎉**
