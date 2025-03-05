const webRTCService = {
   peerConnection: null,

   initializePeerConnection: async () => {
      if (!webRTCService.peerConnection) {
         webRTCService.peerConnection = new RTCPeerConnection({
            iceServers: [
               { urls: "stun:stun.l.google.com:19302" },
               { urls: "stun:stun1.l.google.com:19302" },
               { urls: "stun:stun2.l.google.com:19302" },
               { urls: "stun:stun3.l.google.com:19302" },
               { urls: "stun:stun4.l.google.com:19302" }
            ],
            iceTransportPolicy: "all",
            iceCandidatePoolSize: 10
         });

         webRTCService.peerConnection.ontrack = (event) => {
            console.log("Received remote track", event.streams[0]);
         };

         webRTCService.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
               socketService.socket.emit("ice_candidate", {
                  candidate: event.candidate,
               });
            }
         };

         webRTCService.peerConnection.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", webRTCService.peerConnection.iceConnectionState);
         };
      }
   },

   getUserMedia: async () => {
      try {
         const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
         });
         return stream;
      } catch (error) {
         console.error("Media access error:", error);
         throw new Error(
            "Failed to access media devices. Please check your camera and microphone permissions."
         );
      }
   },

   createOffer: async () => {
      if (!webRTCService.peerConnection) return;
      try {
         const offer = await webRTCService.peerConnection.createOffer();
         console.log("Created offer:", offer);
         await webRTCService.peerConnection.setLocalDescription(offer);
         socketService.socket.emit("offer", { offer });
      } catch (error) {
         console.error("Offer creation error:", error);
         throw new Error("Failed to create or send offer.");
      }
   },

   handleOffer: async (offer) => {
      if (!webRTCService.peerConnection) return;
      try {
         console.log("Handling offer:", offer);
         await webRTCService.peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
         );
         const answer = await webRTCService.peerConnection.createAnswer();
         await webRTCService.peerConnection.setLocalDescription(answer);
         socketService.socket.emit("answer", { answer });
      } catch (error) {
         console.error("Offer handling error:", error);
         throw new Error("Failed to process offer or create answer.");
      }
   },

   handleAnswer: async (answer) => {
      if (!webRTCService.peerConnection) return;
      try {
         console.log("Handling answer:", answer);
         await webRTCService.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
         );
      } catch (error) {
         console.error("Answer handling error:", error);
         throw new Error("Failed to process answer.");
      }
   },

   handleIceCandidate: async (candidate) => {
      if (!webRTCService.peerConnection) return;
      try {
         console.log("Adding ICE candidate:", candidate);
         await webRTCService.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
         );
      } catch (error) {
         console.error("ICE candidate error:", error);
         throw new Error("Failed to add ICE candidate.");
      }
   },

   closeConnection: () => {
      if (webRTCService.peerConnection) {
         webRTCService.peerConnection.close();
         webRTCService.peerConnection = null;
      }
   },
};

export default webRTCService;
