# AsterMail

AsterMail is a robust and dynamic email-sending service built with Node.js, Express, and Nodemailer. Designed for flexibility and scalability, this service allows users to send emails with dynamic SMTP configurations and supports autoresponses for enhanced communication workflows.

## Features

- **Dynamic SMTP Configuration**: Configure SMTP settings dynamically via API requests.
- **Email Sending**: Send emails with customizable content, including HTML and plain text.
- **Autoresponse Support**: Automatically respond to incoming emails with predefined content.
- **Error Handling**: Consistent and detailed error handling for all operations.
- **Validation**: Comprehensive request validation using `express-validator`.
- **Security**: Enhanced security with `helmet` middleware.
- **Logging**: Detailed request logging using `morgan`.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CodeWithAsterixh/astermail
   ```

2. Navigate to the project directory:
   ```bash
   cd astermail
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

## Usage

### Start the Server

Run the following command to start the server:
```bash
pnpm dev
```

The server will be available at `http://localhost:8888`.

### API Endpoints

#### Health Check
- **GET** `/health`
- Response: `{ "status": "ok" }`

#### Send Email
- **POST** `/api/send`

##### Request Body
```json
{
  "config": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "example@gmail.com",
      "pass": "yourpassword"
    }
  },
  "data": {
    "to": "recipient@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello!</h1><p>This is a test email.</p>",
    "autoresponse": {
      "enabled": true,
      "content": "<p>Thank you for your email!</p>"
    }
  }
}
```

##### Response
- **Success**: `{ "status": "success", "messageId": "<message-id>" }`
- **Error**: `{ "status": "error", "error": "<error-message>" }`

## Project Structure

- `src/index.ts`: Entry point of the application.
- `src/routes/email.ts`: Defines the email-sending API endpoint.
- `src/transporter.ts`: Handles dynamic SMTP transporter creation.
- `src/types.ts`: Contains global type definitions.
- `src/utils/errorHandler.ts`: Utility for consistent error handling.
- `src/bodyErrorBoundary.ts`: Validates request bodies and ensures required fields.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.

---

**AsterMail** - Simplifying email communication for modern applications.
