# Multi-Channel Notification Delivery System

A modern and robust multi-channel notification delivery system built with Node.js and Express. It allows you to compose notifications and send them through Web Push, SMS, and Email channels simultaneously or individually.

---

## Features

- **Web Push Notifications**: Send real-time desktop/mobile push notifications using the browser's Service Worker and VAPID protocol.
- **SMS Messaging**: Direct-to-mobile text alerts powered by Twilio.
- **Email Delivery**: Rich HTML email notifications powered by Mailtrap (or custom SMTP).
- **Consolidated API**: A single endpoint to dispatch notifications to multiple channels in a single request.
- **Validation**: Input validation for payload structures, phone formats, and email formatting.

---

## Prerequisites

Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- A modern web browser supporting Service Workers (Chrome, Edge, Firefox, Safari)

---

## Installation & Setup

1. **Clone the repository and install dependencies:**
   ```bash
   # Navigate to the server directory
   cd server
   # Install dependencies
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory of the project. Fill in the keys:
   ```env
   PUBLIC_KEY=your_vapid_public_key
   PRIVATE_KEY=your_vapid_private_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   EMAIL_HOST=sandbox.smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=your_mailtrap_smtp_user
   EMAIL_PASSWORD=your_mailtrap_smtp_password
   ```

3. **Start the Backend Server:**
   From the `server` directory, run:
   ```bash
   npm start
   ```
   The backend server will run at `http://localhost:3000`.

---

## How to Test

### 1. Enable Browser Push Notifications
1. Open your browser and navigate to `http://localhost:3000`.
2. Click **Enable Push Notifications**.
3. Accept the browser permission dialog.
4. Verify in the Developer Console (`F12`) that you see `Done! Ready to receive notifications.`

### 2. Send Notifications using Postman
1. Open Postman and import the local [postman_collection.json](./postman_collection.json) file.
2. Select one of the pre-configured requests (e.g., *Send Notification via Push Notification*).
3. Customize the message body if needed, and click **Send**.
4. You will immediately see the push notification pop up on your system!

---

## API Documentation

### Send Notification
- **URL**: `/notify`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body JSON Schema**:
  ```json
  {
    "message": "Hello World!",
    "channels": "push", 
    "targetUsers": [
      {
        "phoneNumber": "+1234567890",
        "email": "user@example.com"
      }
    ]
  }
  ```
  - `channels`: Can be `"push"`, `"sms"`, `"email"`, or `"all"`.
  - `targetUsers`: Array of target recipients. For Push Notifications, the server automatically broadcasts to all active browser subscriptions.

