# Coding Club Backend

A robust Node.js/Express.js backend for the Coding Club application, providing APIs for user management, events, exams, and more.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Performance Optimizations](#performance-optimizations)
- [Contributing](#contributing)

## Features

- User authentication and authorization (JWT-based)
- Admin and regular user roles
- Event management
- Exam creation and evaluation
- Faculty profiles
- Results tracking
- Real-time notifications

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Real-time Communication**: WebSockets (ws)

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
# or
yarn
```

3. Set up environment variables (see below)
4. Start the development server

```bash
npm run dev
# or
yarn dev
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3030
NODE_ENV=development

# Database
MONGODB_URL=mongodb+srv://your-mongodb-connection-string
DB_NAME=coding_club

# JWT
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=10d

# Admin
ADMINSECRETKEY=your-admin-secret-key

# CORS
CORS_ORIGIN=http://localhost:5173,https://your-frontend-domain.com

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
```

## API Documentation

### Authentication

#### User Registration

```
POST /api/v1/users/signup
```

Request body:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phoneNumber": "1234567890",
  "registrationNumber": "CSE123",
  "branch": "CSE",
  "semester": 5
}
```

#### User Login

```
POST /api/v1/users/login
```

Request body:
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Events

#### Get All Events

```
GET /api/v1/events
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Field to sort by (default: "date")
- `sortOrder`: Sort order ("asc" or "desc", default: "desc")
- `category`: Filter by category
- `status`: Filter by status
- `isExam`: Filter by exam type (true/false)
- `skillLevel`: Filter by skill level

#### Get Event by ID

```
GET /api/v1/events/:id
```

### Exams

#### Get Exam Responses

```
GET /api/v1/exams/:examId/responses
```

#### Submit Evaluation

```
POST /api/v1/exams/:examId/responses/:responseId/evaluate
```

Request body:
```json
{
  "score": 85,
  "feedback": "Good work, but could improve code organization",
  "criteria": [
    {
      "criterionId": "criterion123",
      "score": 4,
      "comment": "Well implemented"
    }
  ]
}
```

## Project Structure

```
src/
├── app.js                 # Express app setup
├── index.js               # Entry point
├── constants.js           # Application constants
├── controllers/           # Route controllers
├── db/                    # Database connection
├── middlewares/           # Custom middlewares
├── models/                # Mongoose models
├── routes/                # API routes
└── utils/                 # Utility functions
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting for sensitive endpoints
- CORS protection
- Input validation
- Error handling

## Performance Optimizations

- Database query optimization
- Pagination for list endpoints
- Request throttling
- Proper error handling
- Efficient MongoDB connection management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request