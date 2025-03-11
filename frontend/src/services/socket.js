import { io } from "socket.io-client";

class SocketService {
   constructor() {
      this.socket = null;
      this.listeners = new Map();
      this._currentRoomId = null;
   }

   connect() {
      if (!this.socket) {
         this.socket = io(import.meta.env.VITE_SOCKET_SERVICE_URL, {
            reconnection: true,
            timeout: 30000,
            transports: ["websocket"],
            autoConnect: false,
            path: "/socket.io/",
         });
         this.setupDefaultListeners();
         this.socket.connect();
      }
      return this.socket;
   }

   setupDefaultListeners() {
      this.socket.on("connect", () => {
         console.log("Connected to socket server");
      });

      this.socket.on("connect_error", (error) => {
         console.error("Connection error:", error);
      });

      this.socket.on("disconnect", (reason) => {
         console.log("Disconnected from socket server:", reason);
         this._currentRoomId = null;
      });

      this.socket.on("room_status", ({ status, roomId }) => {
         if (status === "active") {
            this._currentRoomId = roomId;
         } else {
            this._currentRoomId = null;
         }
      });

      this.socket.on("match_found", ({ roomId }) => {
         if (roomId) this._currentRoomId = roomId;
      });

      this.socket.on("partner_left", () => {
         this._currentRoomId = null;
      });
   }

   joinWaitingRoom(user) {
      try {
         this.socket.emit("join_waiting_room", user);
         return true;
      } catch (error) {
         console.error("Failed to join waiting room:", error);
         return false;
      }
   }

   onMatchFound(callback) {
      if (this.socket) {
         this.socket.on("match_found", callback);
         this.listeners.set("match_found", callback);
      }
   }

   onPartnerLeft(callback) {
      if (this.socket) {
         this.socket.on("partner_left", callback);
         this.listeners.set("partner_left", callback);
      }
   }

   joinChatRoom(roomId) {
      if (!this.socket || !roomId) return false;

      try {
         this._currentRoomId = roomId;
         this.socket.emit("join_room", roomId);
         return true;
      } catch (error) {
         console.error("Failed to join chat room:", error);
         this._currentRoomId = null;
         return false;
      }
   }

   sendMessage(roomId, message) {
      if (!this.socket || !roomId || roomId !== this._currentRoomId)
         return false;

      if (
         !message?.content ||
         message.content.length < 1 ||
         typeof message.content !== "string"
      ) {
         return false;
      }

      try {
         this.socket.emit("send_message", { roomId, message });
         return true;
      } catch (error) {
         console.error("Failed to send message:", error);
         return false;
      }
   }

   onReceiveMessage(callback) {
      if (this.socket) {
         this.socket.on("receive_message", callback);
         this.listeners.set("receive_message", callback);
      }
   }

   leaveRoom(roomId) {
      if (this.socket) {
         this.socket.emit("leave_room", roomId);
      }
   }

   disconnect() {
      if (this.socket) {
         this.listeners.forEach((callback, event) => {
            this.socket.off(event, callback);
         });
         this.listeners.clear();
         this.socket.disconnect();
         this.socket = null;
      }
   }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
