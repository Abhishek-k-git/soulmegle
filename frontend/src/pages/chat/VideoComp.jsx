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
   const [connectionStatus, setConnectionStatus] = useState(null);
   const [debugInfo, setDebugInfo] = useState({});

   useEffect(() => {
      if (!currentPartner?.roomId) {
         if (localStream) {
            localStream.getTracks().forEach((track) => {
               track.stop();
            });
            setLocalStream(null);
         }
         return;
      }

      const handleRemoteStream = (event) => {
         if (remoteVideoRef.current && event.detail?.stream) {
            remoteVideoRef.current.srcObject = event.detail.stream;
            remoteVideoRef.current.play().catch((err) => {
               console.error("Error playing remote video:", err);
            });
         }
      };

      window.addEventListener("remote-stream-ready", handleRemoteStream);

      // 
      webRTCService.peerConnection.oniceconnectionstatechange = () => {
         const state = webRTCService.peerConnection.iceConnectionState;
         console.log("ICE Connection State Change:", {
            state,
            timestamp: new Date().toISOString(),
         });
         setConnectionStatus(state);
         setDebugInfo((prev) => ({
            ...prev,
            iceConnectionState: state,
            timestamp: new Date().toISOString(),
         }));
      };

      webRTCService.peerConnection.onconnectionstatechange = () => {
         const state = webRTCService.peerConnection.connectionState;
         console.log("Connection State Change:", {
            state,
            timestamp: new Date().toISOString(),
            iceGatheringState: webRTCService.peerConnection.iceGatheringState,
            signalingState: webRTCService.peerConnection.signalingState,
         });
         setConnectionStatus(state);
         setDebugInfo((prev) => ({
            ...prev,
            connectionState: state,
            iceGatheringState: webRTCService.peerConnection.iceGatheringState,
            signalingState: webRTCService.peerConnection.signalingState,
         }));
      };
      // 

      const initializeWebRTC = async () => {
         try {
            const stream = await webRTCService.getUserMedia();
            setLocalStream(stream);
            if (localVideoRef.current) {
               localVideoRef.current.srcObject = stream;
               localVideoRef.current.play().catch((err) => {
                  console.error("Error playing local video:", err);
               });
            }

            if (!webRTCService.peerConnection) {
               await webRTCService.initializePeerConnection();
            }

            stream.getTracks().forEach((track) => {
               webRTCService.peerConnection.addTrack(track, stream);
            });

            if (currentPartner.isInitiator) {
               await webRTCService.createOffer();
            }
         } catch (err) {
            console.error("WebRTC initialization error:", err);
            setError(err.message || "Failed to initialize video chat");
         }
      };

      initializeWebRTC();

      return () => {
         if (localStream) {
            localStream.getTracks().forEach((track) => {
               track.stop();
            });
            setLocalStream(null);
         }
         webRTCService.closeConnection();
         socketService.socket.off("offer");
         socketService.socket.off("answer");
         socketService.socket.off("ice_candidate");
         window.removeEventListener("remote-stream-ready", handleRemoteStream);
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

   const toggleMediaTrack = async (type) => {
      if (!localStream || !webRTCService.peerConnection) return;

      const tracks = localStream[`get${type}Tracks`]();
      const track = tracks[0];
      if (!track) return;

      if (type === "Audio") {
         setIsMicEnabled(!isMicEnabled);
      } else {
         setIsCameraEnabled(!isCameraEnabled);
      }

      const sender = webRTCService.peerConnection
         .getSenders()
         .find((s) => s.track?.kind === type.toLowerCase());

      if (!sender) return;

      if (track.enabled) {
         track.enabled = false;
         track.stop();
         if (sender.track) {
            sender.track.enabled = false;
            sender.track.stop();
         }
      } else {
         try {
            const constraints =
               type === "Audio" ? { audio: true } : { video: true };
            const newStream = await navigator.mediaDevices.getUserMedia(
               constraints
            );
            const newTrack = newStream[`get${type}Tracks`]()[0];

            if (newTrack) {
               await sender.replaceTrack(newTrack);
               tracks.forEach((t) => {
                  t.stop();
                  localStream.removeTrack(t);
               });
               localStream.addTrack(newTrack);
               if (type === "Video" && localVideoRef.current) {
                  localVideoRef.current.srcObject = localStream;
               }
            }
         } catch (err) {
            if (type === "Audio") {
               setIsMicEnabled(false);
            } else {
               setIsCameraEnabled(false);
            }
            setError(
               `Failed to enable ${type.toLowerCase()}. Please check your permissions.`
            );
         }
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
