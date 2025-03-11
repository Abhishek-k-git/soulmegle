# soulmegle - Real-time Chat Application

soulmegle is a modern web application that enables real-time chat communication between users based on their interests. The application uses an intelligent matching algorithm to pair users with similar interests for meaningful conversations.

## Project Architecture

The project is divided into four main services:

-  **Frontend**: React-based web interface (Port 3000)
-  **Backend**: Express.js REST API server (Port 5000)
-  **Socket**: Socket.io server for real-time communication (Port 5002)
-  **Matching**: Python Flask service for user matching algorithm (Port 5001)

## Technology Stack

### Frontend

-  React 19.0.0
-  Vite 6.1.0
-  Socket.io-client 4.8.1
-  TailwindCSS 4.0.8
-  Redux Toolkit for state management

### Backend

-  Express.js 4.18.2
-  MongoDB with Mongoose 8.0.3
-  JWT for authentication
-  Socket.io 4.7.2

### Socket Service

-  Node.js with Express
-  Socket.io 4.7.2
-  Axios for HTTP requests

### Matching Service

-  Flask 3.1.0
-  NumPy 2.2.3
-  Scikit-learn 1.6.1
-  Flask-CORS 5.0.0

## Setup Instructions

### Prerequisites

-  Node.js (v16 or higher)
-  Python 3.8 or higher
-  MongoDB installed and running

### Environment Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd soulmegle
```

2. Set up environment variables:
   Create .env files in each service directory with the following variables:

**Frontend (.env)**

```
VITE_SOCKET_SERVICE_URL=http://localhost:5002
VITE_BACKEND_SERVICE_URL=http://localhost:5000
```

**Backend (.env)**

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/soulmegle
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

**Socket (.env)**

```
PORT=5002
FRONTEND_SERVICE_URL=http://localhost:3000
MATCHING_SERVICE_URL=http://localhost:5001
```

**Matching (.env)**

```
PORT=5001
HOST=0.0.0.0
SOCKET_SERVICE_URL=http://localhost:5002
```

### Installation

1. **Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

2. **Backend Setup**

```bash
cd backend
npm install
npm run dev
```

3. **Socket Service Setup**

```bash
cd socket
npm install
npm run dev
```

4. **Matching Service Setup**

```bash
cd matching
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## API Routes

### Authentication Routes

```
POST /api/auth/register - Register new user
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user
```

### User Routes

```
GET /api/users/profile - Get user profile
PUT /api/users/profile - Update user profile
PUT /api/users/interests - Update user interests
```

## Socket Events

### Client Events

```javascript
socket.emit("join_waiting_room", userData); // Join waiting room for matching
socket.emit("join_room", roomId); // Join a chat room
socket.emit("send_message", messageData); // Send a message
socket.emit("leave_room", roomId); // Leave current room
```

### Server Events

```javascript
socket.on("match_found", callback); // When a match is found
socket.on("receive_message", callback); // When receiving a message
socket.on("partner_left", callback); // When chat partner leaves
socket.on("room_status", callback); // Room status updates
```

## Key Features

### Interest-Based Matching

The matching service uses cosine similarity to match users based on their interest vectors:

```python
def find_match():
    # Calculate similarity between current user and other users
    similarity_score = cosine_similarity(current_vector, user_vector)[0][0]
    matched_interests = list(set(current_user["interests"]) & set(user.get("interests", [])))
```

### Real-time Chat Management

The socket service manages real-time communication and room management:

```javascript
class RoomManager {
   constructor() {
      this.waitingUsers = new Map();
      this.activeRooms = new Map();
   }
   // ... room management methods
}
```

## Development Guidelines

1. Follow the existing code structure and naming conventions
2. Write clear commit messages
3. Update documentation when making significant changes
4. Add appropriate error handling and logging
5. Test features thoroughly before submitting PRs

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License.
