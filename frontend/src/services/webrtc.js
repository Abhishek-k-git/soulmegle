import socketService from "./socket";

const webRTCService = {
   peerConnection: null,
   iceCandidateBuffer: [],
   mediaStream: null,
   isInitialized: false,

   initializePeerConnection: async () => {
      if (!webRTCService.peerConnection && !webRTCService.isInitialized) {
         webRTCService.isInitialized = true;
         webRTCService.iceCandidateBuffer = [];
         webRTCService.peerConnection = new RTCPeerConnection({
            iceServers: [
               { urls: "stun:stun.l.google.com:19302" },
               { urls: "stun:stun1.l.google.com:19302" },
               { urls: "stun:stun2.l.google.com:19302" },
            ],
            iceCandidatePoolSize: 10,
         });

         webRTCService.peerConnection.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
               const remoteStream = event.streams[0];
               // Ensure we're working with a MediaStream object
               if (remoteStream instanceof MediaStream) {
                  // Add track change listeners
                  event.track.onmute = () => {
                     console.log("Remote track muted:", event.track.kind);
                  };
                  event.track.onunmute = () => {
                     console.log("Remote track unmuted:", event.track.kind);
                  };
                  event.track.onended = () => {
                     console.log("Remote track ended:", event.track.kind);
                  };

                  window.dispatchEvent(
                     new CustomEvent("remote-stream-ready", {
                        detail: {
                           stream: remoteStream,
                           trackKind: event.track.kind,
                           trackEnabled: event.track.enabled,
                        },
                     })
                  );
               }
            }
         };

         webRTCService.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
               socketService.socket.emit("ice_candidate", {
                  candidate: event.candidate,
               });
            }
         };

         webRTCService.peerConnection.onconnectionstatechange = () => {
            const state = webRTCService.peerConnection.connectionState;
            window.dispatchEvent(
               new CustomEvent("webrtc-connection-state-change", {
                  detail: { state },
               })
            );

            if (state === "failed" || state === "disconnected") {
               console.log(
                  `Connection state changed to ${state}. Attempting to reconnect...`
               );
               webRTCService.peerConnection.restartIce();
               webRTCService.createOffer();
            } else if (state === "connected") {
               console.log("WebRTC connection established successfully");
               webRTCService.iceCandidateBuffer = [];
            }
         };

         socketService.socket.on("offer", async ({ offer }) => {
            try {
               await webRTCService.peerConnection.setRemoteDescription(
                  new RTCSessionDescription(offer)
               );
               const answer = await webRTCService.peerConnection.createAnswer();
               await webRTCService.peerConnection.setLocalDescription(answer);
               socketService.socket.emit("answer", { answer });

               for (const candidate of webRTCService.iceCandidateBuffer) {
                  await webRTCService.peerConnection.addIceCandidate(
                     new RTCIceCandidate(candidate)
                  );
               }
               webRTCService.iceCandidateBuffer = [];
            } catch (err) {
               console.error("Error handling offer:", err);
            }
         });

         socketService.socket.on("answer", async ({ answer }) => {
            try {
               await webRTCService.peerConnection.setRemoteDescription(
                  new RTCSessionDescription(answer)
               );
               for (const candidate of webRTCService.iceCandidateBuffer) {
                  await webRTCService.peerConnection.addIceCandidate(
                     new RTCIceCandidate(candidate)
                  );
               }
               webRTCService.iceCandidateBuffer = [];
            } catch (error) {
               console.error("Error handling answer:", error);
            }
         });

         socketService.socket.on("ice_candidate", async ({ candidate }) => {
            try {
               if (webRTCService.peerConnection.remoteDescription) {
                  await webRTCService.peerConnection.addIceCandidate(
                     new RTCIceCandidate(candidate)
                  );
               } else {
                  webRTCService.iceCandidateBuffer.push(candidate);
               }
            } catch (err) {
               webRTCService.iceCandidateBuffer.push(candidate);
            }
         });
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
         console.error("Failed to create or send offer:", error);
      }
   },

   closeConnection: () => {
      if (webRTCService.peerConnection) {
         webRTCService.peerConnection.close();
         webRTCService.peerConnection = null;
         webRTCService.iceCandidateBuffer = [];
         webRTCService.isInitialized = false;

         if (webRTCService.mediaStream) {
            webRTCService.mediaStream
               .getTracks()
               .forEach((track) => track.stop());
            webRTCService.mediaStream = null;
         }

         window.dispatchEvent(
            new CustomEvent("webrtc-connection-state-change", {
               detail: { state: "closed" },
            })
         );
      }
   },
};

export default webRTCService;

