# API Documentation

## Contact Form API

### POST /api/contact

Submit a contact form message.

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Website Inquiry",
  "message": "I'm interested in your website service."
}
```

#### Response

##### Success (201 Created)

```json
{
  "success": true,
  "id": "60d21b4667d0d8992e610c85"
}
```

##### Error (400 Bad Request)

```json
{
  "error": "All fields are required"
}
```

##### Error (500 Internal Server Error)

```json
{
  "error": "Failed to submit form"
}
```

## MongoDB Schema

### Contacts Collection

```javascript
{
  name: String,      // Required
  email: String,     // Required
  subject: String,   // Required
  message: String,   // Required
  createdAt: Date    // Automatically set
}
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string (required) 