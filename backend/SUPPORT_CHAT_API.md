# Support Agent Chat System - API Documentation

## Overview

This document describes the REST API and WebSocket events for the support agent chat system.

---

## Base URL
```
http://localhost:5000/api/support
```

---

## REST API Endpoints

### Customer Endpoints

#### 1. Initiate New Chat
**POST** `/chats`

Start a new support chat conversation.

**Authentication:** Optional (supports both authenticated users and guests)

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "message": "Chat initiated successfully",
  "chat_id": 1,
  "guest_identifier": "uuid-string" // Only for guest users
}
```

**Notes:**
- For guest users, a `guest_id` cookie will be set automatically
- Authenticated users are identified by JWT token in cookies

---

#### 2. Get Customer Chat History
**GET** `/chats`

Retrieve all chats for the authenticated customer.

**Authentication:** Required

**Response:**
```json
{
  "chats": [
    {
      "chat_id": 1,
      "status": "resolved",
      "created_at": "2024-01-01T10:00:00Z",
      "closed_at": "2024-01-01T11:00:00Z",
      "message_count": 15,
      "last_message": "Thank you for contacting us!"
    }
  ]
}
```

---

#### 3. Get Chat Messages
**GET** `/chats/:chatId/messages`

Retrieve all messages for a specific chat.

**Authentication:** Optional (cookies used for permission check)

**URL Parameters:**
- `chatId` (integer): Chat ID

**Response:**
```json
{
  "messages": [
    {
      "message_id": 1,
      "chat_id": 1,
      "sender_type": "customer",
      "sender_user_id": 5,
      "message_text": "I need help with my order",
      "created_at": "2024-01-01T10:05:00Z",
      "is_read": true,
      "sender_email": "customer@example.com",
      "attachments": []
    },
    {
      "message_id": 2,
      "chat_id": 1,
      "sender_type": "agent",
      "sender_user_id": 10,
      "message_text": "I'll be happy to help!",
      "created_at": "2024-01-01T10:06:00Z",
      "is_read": true,
      "sender_email": "agent@shop.com",
      "attachments": []
    }
  ]
}
```

**Notes:**
- Messages are automatically marked as read when retrieved
- Access control: Only chat participants can view messages

---

#### 4. Upload Attachment
**POST** `/chats/:chatId/attachments`

Upload a file attachment to a message.

**Authentication:** Optional

**URL Parameters:**
- `chatId` (integer): Chat ID

**Request:**
- Content-Type: `multipart/form-data`
- Form Fields:
  - `file` (file): The file to upload
  - `messageId` (integer): ID of the message to attach the file to

**Supported File Types:**
- Images: JPEG, PNG, GIF, WEBP
- Documents: PDF
- Videos: MP4, WEBM, MOV

**File Size Limit:** 10MB

**Response:**
```json
{
  "message": "File uploaded successfully",
  "attachment_id": 1,
  "file_name": "screenshot.png",
  "file_size": 245678
}
```

---

#### 5. Download Attachment
**GET** `/attachments/:attachmentId`

Download or view an attachment file.

**Authentication:** Optional (cookies used for permission check)

**URL Parameters:**
- `attachmentId` (integer): Attachment ID

**Response:**
- File download

---

### Agent Endpoints

All agent endpoints require authentication with the `support agent` role.

#### 6. Get Waiting Queue
**GET** `/queue`

Get list of all chats waiting for an agent.

**Authentication:** Required (support agent)

**Response:**
```json
{
  "chats": [
    {
      "chat_id": 5,
      "user_id": 12,
      "guest_identifier": null,
      "status": "waiting",
      "created_at": "2024-01-01T10:00:00Z",
      "customer_email": "customer@example.com",
      "message_count": 3
    }
  ]
}
```

---

#### 7. Get Active Chats
**GET** `/active`

Get list of chats assigned to the current agent.

**Authentication:** Required (support agent)

**Response:**
```json
{
  "chats": [
    {
      "chat_id": 3,
      "user_id": 8,
      "status": "active",
      "created_at": "2024-01-01T09:00:00Z",
      "claimed_at": "2024-01-01T09:05:00Z",
      "customer_email": "user@example.com",
      "unread_count": 2
    }
  ]
}
```

---

#### 8. Claim Chat
**POST** `/chats/:chatId/claim`

Claim a chat from the waiting queue.

**Authentication:** Required (support agent)

**URL Parameters:**
- `chatId` (integer): Chat ID

**Response:**
```json
{
  "message": "Chat claimed successfully"
}
```

**Error Response:**
```json
{
  "message": "Chat is not available or already claimed"
}
```

---

#### 9. Get Chat with Customer Context
**GET** `/chats/:chatId/context`

Get chat details with full customer context (orders, cart, wishlist).

**Authentication:** Required (support agent)

**URL Parameters:**
- `chatId` (integer): Chat ID

**Response:**
```json
{
  "chat": {
    "chat_id": 3,
    "user_id": 8,
    "status": "active",
    "created_at": "2024-01-01T09:00:00Z",
    "customer_profile": {
      "user_id": 8,
      "email": "customer@example.com",
      "created_at": "2023-06-15T10:00:00Z"
    },
    "recent_orders": [
      {
        "order_id": 25,
        "status": "delivered",
        "total_price": 129.99,
        "order_date": "2024-01-01T08:00:00Z"
      }
    ],
    "cart_items": [
      {
        "product_id": 5,
        "name": "Laptop XYZ",
        "quantity": 1,
        "price": 899.00
      }
    ],
    "wishlist_items": [
      {
        "product_id": 10,
        "name": "Headphones ABC",
        "price": 149.00
      }
    ]
  }
}
```

---

#### 10. Close Chat
**PUT** `/chats/:chatId/close`

Mark a chat as resolved or closed.

**Authentication:** Required (support agent)

**URL Parameters:**
- `chatId` (integer): Chat ID

**Request Body:**
```json
{
  "status": "resolved"  // or "closed"
}
```

**Response:**
```json
{
  "message": "Chat status updated successfully"
}
```

---

## WebSocket (Socket.io) Events

### Connection URL
```
ws://localhost:5000
```

### Client Events (Emit)

#### 1. authenticate
Authenticate the socket connection.

**Data:**
```json
{
  "token": "jwt-token-string",  // For authenticated users
  "guestId": "uuid-string"       // For guest users
}
```

**Server Response:**
```json
{
  "success": true,
  "user": {
    "user_id": 5,
    "role": "customer",
    "email": "user@example.com",
    "isGuest": false
  }
}
```

---

#### 2. customer:join-chat
Customer joins a chat room.

**Data:**
```json
{
  "chatId": 1
}
```

**Server Response:**
```json
{
  "chatId": 1,
  "messages": [ /* array of messages */ ]
}
```

---

#### 3. customer:send-message
Customer sends a message.

**Data:**
```json
{
  "chatId": 1,
  "messageText": "I need help with my order #123"
}
```

**Server Broadcast:** `message:new` event to all in chat room

---

#### 4. agent:join-queue
Agent joins the waiting queue room.

**Data:** None

**Server Response:**
```json
{
  "chats": [ /* array of waiting chats */ ]
}
```

---

#### 5. agent:claim-chat
Agent claims a chat from the queue.

**Data:**
```json
{
  "chatId": 3
}
```

**Server Response:**
```json
{
  "chat": { /* chat with customer context */ },
  "messages": [ /* array of messages */ ]
}
```

---

#### 6. agent:join-chat
Agent joins an already-claimed chat.

**Data:**
```json
{
  "chatId": 3
}
```

**Server Response:**
```json
{
  "chatId": 3,
  "messages": [ /* array of messages */ ]
}
```

---

#### 7. agent:send-message
Agent sends a message.

**Data:**
```json
{
  "chatId": 3,
  "messageText": "I'll help you with that order!"
}
```

**Server Broadcast:** `message:new` event to all in chat room

---

#### 8. typing:start
Indicate user is typing.

**Data:**
```json
{
  "chatId": 3,
  "userType": "customer"  // or "agent"
}
```

---

#### 9. typing:stop
Indicate user stopped typing.

**Data:**
```json
{
  "chatId": 3
}
```

---

### Server Events (Listen)

#### authenticated
Response to authentication attempt.

#### chat:joined
Confirmation of joining a chat room.

#### message:new
New message in the chat.

**Data:**
```json
{
  "message_id": 15,
  "chat_id": 3,
  "sender_type": "agent",
  "message_text": "How can I help you?",
  "created_at": "2024-01-01T10:30:00Z",
  "sender_email": "agent@shop.com",
  "attachments": []
}
```

#### agent:joined
Notification that an agent joined the chat.

#### queue:update
Notification that the waiting queue has changed.

#### queue:chats
List of waiting chats (sent to agents).

#### chat:claimed
Confirmation of successfully claiming a chat.

#### typing:user
Someone is typing in the chat.

#### typing:stop
Typing stopped.

#### error
Error message.

**Data:**
```json
{
  "message": "Error description"
}
```

---

## Testing with Postman/Thunder Client

### Example: Customer Flow

1. **Create a chat:**
   ```
   POST http://localhost:5000/api/support/chats
   ```

2. **Note the returned `chat_id` and `guest_identifier`**

3. Use Socket.io client to connect and authenticate

4. **Upload an attachment (if needed):**
   - Create a message first via Socket.io
   - Then upload file:
   ```
   POST http://localhost:5000/api/support/chats/1/attachments
   Form data:
   - file: [select file]
   - messageId: 1
   ```

---

## Socket.io Frontend Integration Example

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true
});

// Authenticate
socket.emit('authenticate', {
  token: 'your-jwt-token',  // or
  guestId: 'guest-uuid'
});

// Listen for authentication response
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});

// Join a chat
socket.emit('customer:join-chat', { chatId: 1 });

// Listen for messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('customer:send-message', {
  chatId: 1,
  messageText: 'Hello, I need help!'
});
```

---

## Database Setup

Run the updated SQL script to create the support chat tables:

```bash
mysql -u your_username -p mydb < database/ProductDatabase.sql
```

Or manually run the support chat table creation statements from the SQL file.

---

## Notes

- Guest users are identified by a UUID stored in the `guest_id` cookie
- Authenticated users use JWT tokens from the existing auth system
- File uploads are stored in `backend/uploads/support-attachments/`
- Maximum file size: 10MB
- Support agents must have role `'support agent'` in the users table
