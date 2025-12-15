# Profile Update & Account Deletion API Documentation

## Overview

This document describes the backend implementation for profile update and account deletion features with email verification using 6-digit codes.

## Database Schema

### New Table: `verification_codes`

```sql
CREATE TABLE verification_codes (
    code_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose ENUM('profile_update', 'account_deletion') NOT NULL,
    pending_data TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### Modified Table: `users`

Added field:
- `phone_encrypted BLOB` - Stores encrypted phone number

## API Endpoints

### 1. Request Profile Update

**Endpoint:** `POST /api/users/profile/request-update`

**Authentication:** Required (JWT cookie)

**Request Body:**
```json
{
  "first_name": "John",        // Optional
  "last_name": "Doe",          // Optional
  "email": "john@example.com", // Optional
  "phone": "+1234567890",      // Optional
  "tax_id": "12345678901",     // Optional
  "password": "newPassword123" // Optional
}
```

**Response (Success - 200):**
```json
{
  "message": "Verification code sent to your email",
  "email": "current@email.com"
}
```

**Response (Error - 400):**
```json
{
  "message": "At least one field must be provided for update"
}
```

**Flow:**
1. Validates input data
2. Generates 6-digit verification code
3. Stores pending changes in database
4. Sends verification email to user's current email
5. Code expires in 15 minutes

---

### 2. Confirm Profile Update

**Endpoint:** `POST /api/users/profile/confirm-update`

**Authentication:** Required (JWT cookie)

**Request Body:**
```json
{
  "code": "123456"  // Required - 6 digit code from email
}
```

**Response (Success - 200):**
```json
{
  "message": "Profile updated successfully",
  "updated": ["first_name", "email", "phone"]
}
```

**Response (Error - 400):**
```json
{
  "message": "Invalid or expired verification code"
}
```

**Flow:**
1. Validates verification code
2. Retrieves pending changes
3. Encrypts sensitive fields (first_name, last_name, phone, tax_id)
4. Updates database
5. If email changed, issues new JWT token
6. Marks code as used

---

### 3. Request Account Deletion

**Endpoint:** `POST /api/users/account/request-deletion`

**Authentication:** Required (JWT cookie)

**Request Body:** None required

**Response (Success - 200):**
```json
{
  "message": "Account deletion verification code sent to your email. This action is irreversible.",
  "email": "user@example.com"
}
```

**Flow:**
1. Generates 6-digit verification code
2. Stores code in database
3. Sends deletion warning email with code
4. Code expires in 15 minutes

---

### 4. Confirm Account Deletion

**Endpoint:** `POST /api/users/account/confirm-deletion`

**Authentication:** Required (JWT cookie)

**Request Body:**
```json
{
  "code": "123456"  // Required - 6 digit code from email
}
```

**Response (Success - 200):**
```json
{
  "message": "Account deleted successfully. All your data has been permanently removed."
}
```

**Response (Error - 400):**
```json
{
  "message": "Invalid or expired verification code"
}
```

**Flow:**
1. Validates verification code
2. Deletes user account
3. Cascades deletion to related data (orders, reviews, wishlists, etc.)
4. Clears authentication cookie
5. Marks code as used

---

## Email Templates

### Profile Update Verification Email

- **Subject:** "Verify Your Profile Update"
- **Content:** 6-digit code with 15-minute expiration warning
- **Design:** Green-themed with code display box

### Account Deletion Verification Email

- **Subject:** "Account Deletion Confirmation"
- **Content:** 6-digit code with strong irreversibility warning
- **Design:** Red-themed with warning boxes

---

## Security Features

1. **Code Expiration:** All codes expire after 15 minutes
2. **Single Use:** Codes are marked as used after confirmation
3. **Code Invalidation:** Previous pending codes are invalidated when new ones are requested
4. **Encryption:** Sensitive fields (name, phone, tax_id) are encrypted before storage
5. **Password Hashing:** New passwords are bcrypt-hashed before storage
6. **Email Verification:** Changes only applied after email verification
7. **JWT Refresh:** New token issued when email changes

---

## Frontend Integration Guide

### Profile Update Flow

```javascript
// Step 1: Request update
const response = await fetch('/api/users/profile/request-update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    email: 'newemail@example.com',
    phone: '+1234567890',
    tax_id: '12345678901',
    password: 'newPassword123'
  })
});

// Step 2: Show code input form to user

// Step 3: Confirm with code
const confirmResponse = await fetch('/api/users/profile/confirm-update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    code: '123456' // User enters this from email
  })
});
```

### Account Deletion Flow

```javascript
// Step 1: Request deletion
const response = await fetch('/api/users/account/request-deletion', {
  method: 'POST',
  credentials: 'include'
});

// Step 2: Show code input with strong warning

// Step 3: Confirm deletion
const confirmResponse = await fetch('/api/users/account/confirm-deletion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    code: '123456'
  })
});

// Step 4: Redirect to homepage or login page
```

---

## Database Migration

Before using these features, run the migration script:

```bash
mysql -u root -p mydb < database/add_verification_system.sql
```

Or manually execute:
1. Add `phone_encrypted BLOB` to `users` table
2. Create `verification_codes` table

---

## Environment Variables

Ensure these are set in your `.env`:

```env
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
SENDER_NAME=TechZone
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200:** Success
- **400:** Bad request (invalid input, expired code, etc.)
- **401:** Unauthorized (not logged in)
- **404:** User not found
- **500:** Server error

---

## Testing

### Manual Testing with cURL

**Request Profile Update:**
```bash
curl -X POST http://localhost:5000/api/users/profile/request-update \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"first_name":"John","email":"new@email.com"}'
```

**Confirm Update:**
```bash
curl -X POST http://localhost:5000/api/users/profile/confirm-update \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"code":"123456"}'
```

**Request Account Deletion:**
```bash
curl -X POST http://localhost:5000/api/users/account/request-deletion \
  -b cookies.txt
```

**Confirm Deletion:**
```bash
curl -X POST http://localhost:5000/api/users/account/confirm-deletion \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"code":"123456"}'
```

---

## Files Modified/Created

### Created Files:
1. `backend/models/VerificationCode.js` - Code management model
2. `backend/app/controllers/profileController.js` - Profile update controllers
3. `database/add_verification_system.sql` - Database migration

### Modified Files:
1. `backend/models/User.js` - Added `deleteUser` function
2. `backend/utils/gmailService.js` - Added verification email templates
3. `backend/utils/emailService.js` - Exported new email functions
4. `backend/routes/userRoutes.js` - Added new routes

---

## Notes

- Verification codes are 6 digits (100000-999999)
- Codes expire after 15 minutes
- Only one active code per user per purpose
- Previous codes are invalidated when new ones are requested
- Account deletion cascades to all related data
- Email changes trigger new JWT token issuance
