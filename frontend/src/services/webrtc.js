import socketService from "./socket";

const webRTCService = {
   peerConnection: null,

   initializePeerConnection: async () => {
      try {
         if (!webRTCService.peerConnection) {
            webRTCService.peerConnection = new RTCPeerConnection({
               iceServers: [
                  { urls: "stun:stun.l.google.com:19302" },
                  { urls: "stun:stun1.l.google.com:19302" },
                  { urls: "stun:stun2.l.google.com:19302" },
                  { urls: "stun:stun3.l.google.com:19302" },
                  { urls: "stun:stun4.l.google.com:19302" },
               ],
            });

            webRTCService.peerConnection.onicecandidate = (event) => {
               console.log(
                  "ICE Candidate Event:",
                  event.candidate ? "New candidate" : "Null candidate"
               );
               if (event.candidate) {
                  console.log("ICE Candidate Details:", {
                     type: event.candidate.type,
                     protocol: event.candidate.protocol,
                     address: event.candidate.address,
                     port: event.candidate.port,
                  });
                  socketService.socket.emit("ice_candidate", {
                     candidate: event.candidate,
                  });
               }
            };

            webRTCService.peerConnection.ontrack = (event) => {
               console.log("Track Event Details:", {
                  kind: event.track.kind,
                  id: event.track.id,
                  label: event.track.label,
                  enabled: event.track.enabled,
                  readyState: event.track.readyState,
               });
               if (event.streams && event.streams[0]) {
                  const tracks = event.streams[0].getTracks();
                  console.log(
                     "Remote Stream Tracks:",
                     tracks.map((track) => ({
                        kind: track.kind,
                        id: track.id,
                        label: track.label,
                        enabled: track.enabled,
                        readyState: track.readyState,
                     }))
                  );
                  const remoteStream = event.streams[0];
                  
                  // Dispatch event for components that listen for it
                  const remoteStreamEvent = new CustomEvent(
                     "remote-stream-ready",
                     {
                        detail: { stream: remoteStream },
                     }
                  );
                  window.dispatchEvent(remoteStreamEvent);
                  
                  // Log more detailed information about the stream
                  console.log("Remote stream received:", {
                     id: remoteStream.id,
                     active: remoteStream.active,
                     trackCount: remoteStream.getTracks().length
                  });
               } else {
                  console.log("Track event received but no streams available");
               }
            };

            webRTCService.peerConnection.oniceconnectionstatechange = () => {
               const state = webRTCService.peerConnection.iceConnectionState;
               console.log("ICE Connection State Change:", {
                  state,
                  timestamp: new Date().toISOString(),
               });
            };

            webRTCService.peerConnection.onconnectionstatechange = () => {
               const state = webRTCService.peerConnection.connectionState;
               console.log("Connection State Change:", {
                  state,
                  timestamp: new Date().toISOString(),
                  iceGatheringState:
                     webRTCService.peerConnection.iceGatheringState,
                  signalingState: webRTCService.peerConnection.signalingState,
               });
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
      } catch(error) {
         console.log(error);
         throw new Error("Failed to initialize peer connection");
      }
   },

   getUserMedia: async () => {
      try {
         const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
         });
         if (webRTCService.peerConnection) {
            stream.getTracks().forEach((track) => {
               webRTCService.peerConnection.addTrack(track, stream);
            });
         }
         return stream;
      } catch (error) {
         console.log(error);
         throw new Error(
            "Failed to access media devices. Please check your camera and microphone permissions."
         );
      }
   },

   createOffer: async () => {
      if (!webRTCService.peerConnection) return;
      try {
         console.log("Creating WebRTC offer...");
         const offer = await webRTCService.peerConnection.createOffer();
         console.log("Offer created:", offer);
         await webRTCService.peerConnection.setLocalDescription(offer);
         console.log("Local description set");
         socketService.socket.emit("offer", { offer });
      } catch (error) {
         console.log(error);
         throw new Error("Failed to create or send offer.");
      }
   },

   handleOffer: async (offer) => {
      if (!webRTCService.peerConnection) return;
      try {
         console.log("Received offer:", offer);
         await webRTCService.peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
         );
         console.log("Remote description set");
         const answer = await webRTCService.peerConnection.createAnswer();
         console.log("Answer created:", answer);
         await webRTCService.peerConnection.setLocalDescription(answer);
         console.log("Local description set");
         socketService.socket.emit("answer", { answer });
      } catch (error) {
         console.log(error);
         throw new Error("Failed to process offer or create answer.");
      }
   },

   handleAnswer: async (answer) => {
      if (!webRTCService.peerConnection) return;
      try {
         console.log('Received answer:', answer);
         await webRTCService.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
         );
         console.log('Successfully set remote description from answer');
      } catch (error) {
         console.log(error);
         throw new Error("Failed to process answer.");
      }
   },

   handleIceCandidate: async (candidate) => {
      if (!webRTCService.peerConnection) return;
      try {
         console.log('Adding ICE candidate:', candidate);
         await webRTCService.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
         );
         console.log('Successfully added ICE candidate');
      } catch (error) {
         console.log(error);
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
