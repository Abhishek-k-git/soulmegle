import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import webRTCService from "../../services/webrtc";
import socketService from "../../services/socket";

const VideoComp = () => {
   const localVideoRef = useRef(null);
   const remoteVideoRef = useRef(null);
   const currentPartner = useSelector((state) => state.chat.currentPartner);
   const [isLocalMain, setIsLocalMain] = useState(true);
   const [isMicEnabled, setIsMicEnabled] = useState(true);
   const [isCameraEnabled, setIsCameraEnabled] = useState(true);
   const [localStream, setLocalStream] = useState(null);
   const [error, setError] = useState(null);

   useEffect(() => {
      if (!currentPartner?.roomId) {
         webRTCService.closeConnection();
         setLocalStream(null);
         return;
      }

      const initializeWebRTC = async () => {
         try {
            const stream = await webRTCService.initialize(
               socketService,
               (remoteStream) => {
                  if (remoteVideoRef.current) {
                     remoteVideoRef.current.srcObject = remoteStream;
                  }
               }
            );
            setLocalStream(stream);
            if (localVideoRef.current) {
               localVideoRef.current.srcObject = stream;
            }
            await webRTCService.initiateCall();
         } catch (err) {
            setError(
               "Failed to initialize video call. Please check your permissions."
            );
         }
      };

      initializeWebRTC();

      return () => {
         webRTCService.closeConnection();
         setLocalStream(null);
      };
   }, [currentPartner?.roomId]);

   const handleSwap = () => {
      setIsLocalMain(!isLocalMain);
      if (localVideoRef.current && remoteVideoRef.current) {
         const tempStream = localVideoRef.current.srcObject;
         localVideoRef.current.srcObject = remoteVideoRef.current.srcObject;
         remoteVideoRef.current.srcObject = tempStream;
      }
   };

   const toggleMediaTrack = (type) => {
      if (!localStream) return;

      if (type === "Audio") {
         const newState = !isMicEnabled;
         setIsMicEnabled(newState);
         webRTCService.toggleAudio(newState);
      } else {
         const newState = !isCameraEnabled;
         setIsCameraEnabled(newState);
         webRTCService.toggleVideo(newState);
      }
   };

   const toggleMicrophone = () => toggleMediaTrack("Audio");
   const toggleCamera = () => toggleMediaTrack("Video");

   if (error) {
      return (
         <div className="relative h-[600px] bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-white text-center p-4">
               <p className="text-xl mb-2">⚠️ {error}</p>
               <p className="text-sm">
                  Please check your camera and microphone permissions
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className="relative h-[600px] bg-gray-800 rounded-lg overflow-hidden">
         <video
            ref={isLocalMain ? localVideoRef : remoteVideoRef}
            autoPlay
            playsInline
            muted={isLocalMain}
            className="w-full h-full object-cover bg-black bg-opacity-20"
         />
         <span className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {isLocalMain ? "You" : "Partner"}
         </span>

         <div className="absolute bottom-4 left-4 flex space-x-2">
            <button
               onClick={toggleMicrophone}
               className={`p-2 rounded-full ${
                  isMicEnabled ? "bg-indigo-600" : "bg-red-600"
               } text-white hover:opacity-80 transition-opacity`}
            >
               {isMicEnabled ? "🎤" : "🚫🎤"}
            </button>
            <button
               onClick={toggleCamera}
               className={`p-2 rounded-full ${
                  isCameraEnabled ? "bg-indigo-600" : "bg-red-600"
               } text-white hover:opacity-80 transition-opacity`}
            >
               {isCameraEnabled ? "📷" : "🚫📷"}
            </button>
         </div>

         <div
            onClick={handleSwap}
            className="absolute bottom-4 right-4 w-48 h-36 cursor-pointer transition-transform hover:scale-105"
         >
            <video
               ref={isLocalMain ? remoteVideoRef : localVideoRef}
               autoPlay
               playsInline
               muted={!isLocalMain}
               className="w-full h-full object-cover bg-black bg-opacity-20 rounded-lg border-2 border-white"
            />
            <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
               {isLocalMain ? "Partner" : "You"}
            </span>
         </div>
      </div>
   );
};

export default VideoComp;
