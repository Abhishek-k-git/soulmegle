import socketService from "./socket";

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
         });

         webRTCService.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
               socketService.socket.emit("ice_candidate", {
                  candidate: event.candidate,
               });
            }
         };

         webRTCService.peerConnection.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
               const remoteStream = event.streams[0];
               const remoteStreamEvent = new CustomEvent(
                  "remote-stream-ready",
                  {
                     detail: { stream: remoteStream },
                  }
               );
               window.dispatchEvent(remoteStreamEvent);
            }
         };

         webRTCService.peerConnection.oniceconnectionstatechange = () => {
            console.log("ICE Connection State:", webRTCService.peerConnection.iceConnectionState);
         };

         webRTCService.peerConnection.onconnectionstatechange = () => {
            console.log("Connection State:", webRTCService.peerConnection.connectionState);
         };

         socketService.socket.on("offer", async ({ offer }) => {
            await webRTCService.handleOffer(offer);
         });

         socketService.socket.on("answer", async ({ answer }) => {
            await webRTCService.handleAnswer(answer);
         });

         socketService.socket.on("ice_candidate", async ({ candidate }) => {
            await webRTCService.handleIceCandidate(candidate);
         });
      }
   },

   getUserMedia: async () => {
      try {
         return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
         });
      } catch (error) {
         throw new Error(
            "Failed to access media devices. Please check your camera and microphone permissions."
         );
      }
   },

   createOffer: async () => {
      if (!webRTCService.peerConnection) return;
      try {
         const offer = await webRTCService.peerConnection.createOffer();
         await webRTCService.peerConnection.setLocalDescription(offer);
         socketService.socket.emit("offer", { offer });
      } catch (error) {
         throw new Error("Failed to create or send offer.");
      }
   },

   handleOffer: async (offer) => {
      if (!webRTCService.peerConnection) return;
      try {
         await webRTCService.peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
         );
         const answer = await webRTCService.peerConnection.createAnswer();
         await webRTCService.peerConnection.setLocalDescription(answer);
         socketService.socket.emit("answer", { answer });
      } catch (error) {
         throw new Error("Failed to process offer or create answer.");
      }
   },

   handleAnswer: async (answer) => {
      if (!webRTCService.peerConnection) return;
      try {
         await webRTCService.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
         );
      } catch (error) {
         throw new Error("Failed to process answer.");
      }
   },

   handleIceCandidate: async (candidate) => {
      if (!webRTCService.peerConnection) return;
      try {
         await webRTCService.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
         );
      } catch (error) {
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
