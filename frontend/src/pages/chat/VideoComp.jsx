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
      console.log(
         "[VideoComp] Effect triggered with roomId:",
         currentPartner?.roomId
      );
      if (!currentPartner?.roomId) {
         console.log("[VideoComp] No room ID - cleaning up resources");
         if (localStream) {
            console.log("[VideoComp] Stopping local stream tracks");
            localStream.getTracks().forEach((track) => {
               track.stop();
            });
            setLocalStream(null);
         }
         webRTCService.closeConnection();
         return;
      }

      let isComponentMounted = true;

      const handleRemoteStream = (event) => {
         if (!isComponentMounted) return;
         console.log("[VideoComp] Remote stream event received", {
            hasStream: !!event.detail?.stream,
            trackKind: event.detail?.trackKind,
            trackEnabled: event.detail?.trackEnabled,
            tracks: event.detail?.stream
               ?.getTracks()
               .map((t) => ({ kind: t.kind, enabled: t.enabled })),
         });
         if (remoteVideoRef.current && event.detail?.stream) {
            if (remoteVideoRef.current.srcObject !== event.detail.stream) {
               remoteVideoRef.current.srcObject = event.detail.stream;
               console.log(
                  "[VideoComp] Remote stream attached to video element"
               );
               remoteVideoRef.current.play().catch((error) => {
                  console.error(
                     "[VideoComp] Error playing remote video:",
                     error
                  );
               });
            }
         }
      };

      window.addEventListener("remote-stream-ready", handleRemoteStream);
      console.log("[VideoComp] Added remote stream event listener");

      const initializeWebRTC = async () => {
         if (!isComponentMounted) return;
         console.log("[VideoComp] Initializing WebRTC...");
         try {
            // Clean up existing peer connection and tracks
            webRTCService.closeConnection();
            if (localStream) {
               localStream.getTracks().forEach((track) => track.stop());
               setLocalStream(null);
            }

            console.log("[VideoComp] Requesting user media...");
            const stream = await webRTCService.getUserMedia();
            if (!isComponentMounted) {
               stream.getTracks().forEach((track) => track.stop());
               return;
            }

            console.log("[VideoComp] User media obtained", {
               videoTracks: stream.getVideoTracks().length,
               audioTracks: stream.getAudioTracks().length,
            });
            setLocalStream(stream);
            if (localVideoRef.current) {
               localVideoRef.current.srcObject = stream;
               console.log(
                  "[VideoComp] Local stream attached to video element"
               );
            }

            console.log("[VideoComp] Initializing peer connection...");
            await webRTCService.initializePeerConnection();

            if (!isComponentMounted) return;

            console.log("[VideoComp] Adding tracks to peer connection...");
            stream.getTracks().forEach((track) => {
               webRTCService.peerConnection.addTrack(track, stream);
               console.log(
                  `[VideoComp] Added ${track.kind} track to peer connection`
               );
            });

            if (currentPartner.isInitiator) {
               console.log("[VideoComp] Creating offer as initiator...");
               await webRTCService.createOffer();
            }
         } catch (err) {
            if (!isComponentMounted) return;
            console.error("[VideoComp] Error in WebRTC initialization:", err);
            setError(err.message || "Failed to initialize video chat");
         }
      };

      initializeWebRTC();

      return () => {
         isComponentMounted = false;
         console.log("[VideoComp] Cleanup - Component unmounting");
         if (localStream) {
            console.log("[VideoComp] Stopping local stream tracks");
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
         console.log("[VideoComp] Cleanup complete");
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
      console.log(`[VideoComp] Toggling ${type} track...`);
      if (!localStream || !webRTCService.peerConnection) {
         console.warn(
            `[VideoComp] Cannot toggle ${type} - missing stream or peer connection`
         );
         return;
      }

      const tracks = localStream[`get${type}Tracks`]();
      const track = tracks[0];
      if (!track) {
         console.warn(`[VideoComp] No ${type.toLowerCase()} track found`);
         return;
      }

      if (type === "Audio") {
         setIsMicEnabled(!isMicEnabled);
      } else {
         setIsCameraEnabled(!isCameraEnabled);
      }

      const sender = webRTCService.peerConnection
         .getSenders()
         .find((s) => s.track?.kind === type.toLowerCase());

      if (!sender) {
         console.warn(
            `[VideoComp] No sender found for ${type.toLowerCase()} track`
         );
         return;
      }

      if (track.enabled) {
         console.log(`[VideoComp] Disabling ${type.toLowerCase()} track`);
         track.enabled = false;
         track.stop();
         if (sender.track) {
            sender.track.enabled = false;
            sender.track.stop();
         }
      } else {
         try {
            console.log(
               `[VideoComp] Requesting new ${type.toLowerCase()} track...`
            );
            const constraints =
               type === "Audio" ? { audio: true } : { video: true };
            const newStream = await navigator.mediaDevices.getUserMedia(
               constraints
            );
            const newTrack = newStream[`get${type}Tracks`]()[0];

            if (newTrack) {
               console.log(
                  `[VideoComp] Replacing ${type.toLowerCase()} track...`
               );
               await sender.replaceTrack(newTrack);
               tracks.forEach((t) => {
                  t.stop();
                  localStream.removeTrack(t);
               });
               localStream.addTrack(newTrack);
               if (type === "Video" && localVideoRef.current) {
                  localVideoRef.current.srcObject = localStream;
                  console.log("[VideoComp] Updated local video stream");
               }
            }
         } catch (err) {
            console.error(
               `[VideoComp] Error toggling ${type.toLowerCase()}:`,
               err
            );
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

