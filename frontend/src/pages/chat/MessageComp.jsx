import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addMessage } from "../../store/slices/chatSlice";
import socketService from "../../services/socket";

function MessageComp() {
   const { currentPartner, messages } = useSelector((state) => state.chat);
   const { user } = useSelector((state) => state.auth);
   const [newMessage, setNewMessage] = useState("");
   const messagesEndRef = useRef(null);
   const dispatch = useDispatch();

   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   useEffect(() => {
      const handleReceiveMessage = (message) => {
         if (message.sender !== user._id) {
            dispatch(addMessage(message));
         }
      };

      socketService.onReceiveMessage(handleReceiveMessage);

      return () => {
         if (socketService.socket) {
            socketService.socket.off("receive_message", handleReceiveMessage);
         }
      };
   }, [dispatch, user._id]);

   const handleSendMessage = (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !currentPartner?.roomId) return;

      const messageData = {
         content: newMessage,
         sender: user._id,
         timestamp: new Date().toISOString(),
      };

      if (socketService.sendMessage(currentPartner.roomId, messageData)) {
         dispatch(addMessage(messageData));
         setNewMessage("");
      }
   };

   return (
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
         {/* Partner Info Header */}
         {currentPartner && (
            <div className="p-4 border-b bg-gray-50">
               <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                     <span className="text-white font-medium">
                        {currentPartner.email?.charAt(0).toUpperCase()}
                     </span>
                  </div>
                  <div>
                     <h3 className="font-medium text-gray-900">
                        {currentPartner.email}
                     </h3>
                     {currentPartner.commonInterests && (
                        <p className="text-sm text-gray-500">
                           Common Interests:{" "}
                           {currentPartner.commonInterests.join(", ")}
                        </p>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Messages */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => {
               const isOwnMessage = message.sender === user._id;
               return (
                  <div
                     key={index}
                     className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                     }`}
                  >
                     <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                           isOwnMessage
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-900"
                        }`}
                     >
                        <p className="break-words">{message.content}</p>
                        <span
                           className={`text-xs ${
                              isOwnMessage ? "text-indigo-100" : "text-gray-500"
                           }`}
                        >
                           {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                     </div>
                  </div>
               );
            })}
            <div ref={messagesEndRef} />
         </div>

         {/* Message Input */}
         <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
            <div className="flex space-x-2">
               <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
               />
               <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
               >
                  Send
               </button>
            </div>
         </form>
      </div>
   );
}

export default MessageComp;
