import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
   setSearching,
   clearChat,
   setPartner,
} from "../../store/slices/chatSlice";
import socketService from "../../services/socket";
import MessageComp from "./MessageComp";
import VideoComp from "./VideoComp";

function ChatPage() {
   const dispatch = useDispatch();
   const { currentPartner, isSearching } = useSelector((state) => state.chat);
   const { user } = useSelector((state) => state.auth);

   useEffect(() => {
      if (!user?._id) return;

      socketService.connect();

      const handleMatch = ({ roomId, partner }) => {
         if (roomId && partner) {
            dispatch(setPartner({ ...partner, roomId }));
            socketService.joinChatRoom(roomId);
         }
         dispatch(setSearching(false));
      };

      const handlePartnerLeft = () => {
         dispatch(clearChat());
         dispatch(setPartner(null));
      };

      socketService.onMatchFound(handleMatch);
      socketService.onPartnerLeft(handlePartnerLeft);

      return () => socketService.disconnect();
   }, [dispatch, user?._id]);

   const handleFindPartner = () => {
      if (currentPartner) {
         socketService.leaveRoom(currentPartner.roomId);
      }
      dispatch(clearChat());
      dispatch(setSearching(true));
      socketService.joinWaitingRoom(user);
   };

   return (
      <div className="min-h-screen bg-gray-100">
         <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {!currentPartner && !isSearching ? (
               <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                     Ready to Chat?
                  </h2>
                  <button
                     onClick={handleFindPartner}
                     className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                     Find a Partner
                  </button>
               </div>
            ) : isSearching ? (
               <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Finding a chat partner...</p>
               </div>
            ) : (
               <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b flex justify-between items-center">
                     <h3 className="text-lg font-medium text-gray-900">
                        Chat Room
                     </h3>
                     <button
                        onClick={handleFindPartner}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                     >
                        Skip
                     </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                     <VideoComp />
                     <MessageComp />
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}

export default ChatPage;
