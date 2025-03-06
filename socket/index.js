const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
   cors: {
      origin: process.env.FRONTEND_SERVICE_URL,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      maxAge: 86400,
   },
   pingTimeout: 30000,
   transports: ["websocket"],
   path: "/socket.io/",
});

class RoomManager {
   constructor() {
      this.waitingUsers = new Map();
      this.activeRooms = new Map();
   }

   addToWaitingRoom(socket, userData) {
      if (!userData?._id || !Array.isArray(userData?.interests)) return null;

      const userObj = {
         socketId: socket.id,
         userId: userData._id,
         email: userData.email,
         interests: userData.interests,
         interestVector: userData.interestVector,
      };

      this.waitingUsers.set(socket.id, userObj);
      return userObj;
   }

   getOtherWaitingUsers(socketId) {
      return Array.from(this.waitingUsers.entries())
         .filter(([id]) => id !== socketId)
         .map(([_, user]) => user);
   }

   createRoom(socket1Id, socket2Id) {
      const roomId = `${socket1Id}-${socket2Id}`;
      this.waitingUsers.delete(socket1Id);
      this.waitingUsers.delete(socket2Id);

      this.activeRooms.set(roomId, {
         user1: socket1Id,
         user2: socket2Id,
         lastActivity: Date.now(),
      });

      return roomId;
   }

   removeFromRoom(socketId) {
      const roomEntry = Array.from(this.activeRooms.entries()).find(
         ([_, room]) => room.user1 === socketId || room.user2 === socketId
      );

      if (roomEntry) {
         const [roomId, room] = roomEntry;
         const partnerId = room.user1 === socketId ? room.user2 : room.user1;
         this.activeRooms.delete(roomId);
         return { roomId, partnerId };
      }
      return null;
   }

   isValidRoomMember(roomId, socketId) {
      const room = this.activeRooms.get(roomId);
      return room && (room.user1 === socketId || room.user2 === socketId);
   }

   updateRoomActivity(roomId) {
      const room = this.activeRooms.get(roomId);
      if (room) {
         room.lastActivity = Date.now();
         this.activeRooms.set(roomId, room);
      }
   }
}

const roomManager = new RoomManager();

io.on("connection", (socket) => {
   console.log(`User connected with socket id: ${socket.id}`);

   socket.on("join_waiting_room", async (user) => {
      try {
         const userObj = roomManager.addToWaitingRoom(socket, user);
         if (!userObj) return;

         const otherUsers = roomManager.getOtherWaitingUsers(socket.id);
         if (otherUsers.length === 0) return;

         // making request to matching service
         const response = await axios.post(
            `${process.env.MATCHING_SERVICE_URL}/api/match`,
            {
               currentUser: userObj,
               otherUsers,
            }
         );

         if (response.data.matched_user_id) {
            const matchedUser = otherUsers.find(
               (u) => u.userId === response.data.matched_user_id
            );
            if (matchedUser) {
               const roomId = roomManager.createRoom(
                  socket.id,
                  matchedUser.socketId
               );

               socket.join(roomId);
               io.sockets.sockets.get(matchedUser.socketId)?.join(roomId);

               // send to partner
               io.to(matchedUser.socketId).emit("match_found", {
                  roomId,
                  partner: {
                     userId: user.userId,
                     email: user.email,
                     commonInterests: response.data.matched_user_interests,
                  },
               });
               // send to user
               socket.emit("match_found", {
                  roomId,
                  partner: {
                     userId: matchedUser.userId,
                     email: matchedUser.email,
                     commonInterests: response.data.matched_user_interests,
                  },
               });
               io.to(roomId).emit("room_status", { status: "active", roomId });
            }
         }
      } catch (error) {
         console.error("Error in join_waiting_room:", error);
      }
   });

   socket.on("join_room", (roomId) => {
      if (roomManager.isValidRoomMember(roomId, socket.id)) {
         socket.join(roomId);
         io.to(roomId).emit("room_status", { status: "active", roomId });
      }
   });

   socket.on("send_message", ({ roomId, message }) => {
      if (
         !roomId ||
         !message?.content ||
         typeof message.content !== "string" ||
         message.content.length < 1 ||
         !roomManager.isValidRoomMember(roomId, socket.id)
      )
         return;

      roomManager.updateRoomActivity(roomId);
      io.to(roomId).emit("receive_message", {
         ...message,
         timestamp: Date.now(),
         senderId: socket.id,
      });
   });

   socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      roomManager.waitingUsers.delete(socket.id);

      const roomInfo = roomManager.removeFromRoom(socket.id);
      if (roomInfo) {
         io.to(roomInfo.partnerId).emit("partner_left");
      }
   });

   socket.on("leave_room", (roomId) => {
      if (!roomManager.isValidRoomMember(roomId, socket.id)) return;

      const room = roomManager.activeRooms.get(roomId);
      const partnerId = room.user1 === socket.id ? room.user2 : room.user1;

      io.to(partnerId).emit("partner_left");
      io.to(roomId).emit("room_status", { status: "inactive", roomId });
      roomManager.activeRooms.delete(roomId);
      socket.leave(roomId);
   });

   // WebRTC signaling handlers
   socket.on("offer", ({ offer }) => {
      const roomInfo = Array.from(roomManager.activeRooms.entries()).find(
         ([_, room]) => room.user1 === socket.id || room.user2 === socket.id
      );

      if (roomInfo) {
         const [roomId, room] = roomInfo;
         const partnerId = room.user1 === socket.id ? room.user2 : room.user1;
         io.to(partnerId).emit("offer", { offer });
      }
   });

   socket.on("answer", ({ answer }) => {
      const roomInfo = Array.from(roomManager.activeRooms.entries()).find(
         ([_, room]) => room.user1 === socket.id || room.user2 === socket.id
      );

      if (roomInfo) {
         const [roomId, room] = roomInfo;
         const partnerId = room.user1 === socket.id ? room.user2 : room.user1;
         io.to(partnerId).emit("answer", { answer });
      }
   });

   socket.on("ice_candidate", ({ candidate }) => {
      const roomInfo = Array.from(roomManager.activeRooms.entries()).find(
         ([_, room]) => room.user1 === socket.id || room.user2 === socket.id
      );

      if (roomInfo) {
         const [roomId, room] = roomInfo;
         const partnerId = room.user1 === socket.id ? room.user2 : room.user1;
         io.to(partnerId).emit("ice_candidate", { candidate });
      }
   });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
   console.log(`Socket server running on port ${PORT}`);
});
