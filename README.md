# 🚀 Assignment - Blog API Backend

A fully functional REST API built using **Node.js, Express, MongoDB (Mongoose)**.
This API supports **Users, Posts, Categories, Comments, and Stats** with pagination and search.

---

## 📦 Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* dotenv
* morgan
* cors

---

## ⚙️ Setup Instructions

```bash
git clone https://github.com/Ayuxxyadav/assignment-31march
cd assignment-31march
npm install
```

### 🔑 Environment Variables

Create a `.env` file in root:

```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
```

### ▶️ Run Server

```bash
npm run dev
```

Server will run on:

```
http://localhost:3000
```

---

# 📌 API ENDPOINTS

---

## 👤 USER APIs

### ➤ Create User

```
POST /api/users
```

Body:

```json
{
  "name": "Ayush",
  "email": "ayush@gmail.com"
}
```

---

### ➤ Get All Users (Pagination)

```
GET /api/users?page=1&limit=10
```

---

### ➤ Get Single User

```
GET /api/users/:id
```

---

### ➤ Delete User

```
DELETE /api/users/:id
```

---

## 📂 CATEGORY APIs

### ➤ Create Category

```
POST /api/categories
```

Body:

```json
{
  "name": "Tech",
  "description": "All tech related posts"
}
```

---

### ➤ Get All Categories

```
GET /api/categories?page=1&limit=10
```

---

## 📝 POST APIs

### ➤ Create Post

```
POST /api/posts
```

Body:

```json
{
  "title": "My First Post",
  "content": "This is content",
  "userId": "USER_ID",
  "categoryId": "CATEGORY_ID"
}
```

---

### ➤ Get All Posts (Search + Pagination)

```
GET /api/posts?page=1&limit=10&search=keyword
```

---

### ➤ Get Post by ID (with user & comments)

```
GET /api/posts/:id
```

---

### ➤ Update Post

```
PUT /api/posts/:id
```

Body:

```json
{
  "title": "Updated title",
  "content": "Updated content",
  "categoryId": "CATEGORY_ID"
}
```

---

## 💬 COMMENT APIs

### ➤ Add Comment

```
POST /api/posts/:postId/comments
```

Body:

```json
{
  "userId": "USER_ID",
  "text": "Nice post!"
}
```

---

### ➤ Get Comments (Pagination)

```
GET /api/posts/:postId/comments?page=1&limit=10
```

---

## 📊 STATS API

### ➤ Top 3 Users (Most Posts)

```
GET /api/stats/top-users
```

Response:

```json
[
  {
    "name": "Ayush",
    "email": "ayush@gmail.com",
    "postCount": 5
  }
]
```

---

## ❌ Error Handling

* 400 → Bad Request
* 404 → Not Found
* 500 → Internal Server Error

---

## 🧠 Features

✅ CRUD operations
✅ Pagination
✅ Search functionality
✅ MongoDB Aggregation
✅ Relations (User ↔ Post ↔ Comment ↔ Category)
✅ Clean error handling

---

## 👨‍💻 Author

**Ayush Yadav**
