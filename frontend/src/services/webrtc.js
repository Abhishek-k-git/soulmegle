import socketService from './socket';
class WebRTCService {
   constructor() {
      this.peerConnection = null;
   }

   initializePeerConnection = async () => {
      if (!this.peerConnection) {
         this.peerConnection = new RTCPeerConnection({
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

         this.peerConnection.ontrack = (event) => {
            console.log("Received remote track", event.streams[0]);
         };

         this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && window.socketService) {
               window.socketService.socket.emit("ice_candidate", {
                  candidate: event.candidate,
               });
            }
         };

         this.peerConnection.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", this.peerConnection.iceConnectionState);
         };
      }
   };

   getUserMedia = async () => {
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
   };

   createOffer = async () => {
      if (!this.peerConnection) return;
      try {
         const offer = await this.peerConnection.createOffer();
         console.log("Created offer:", offer);
         await this.peerConnection.setLocalDescription(offer);
         if (window.socketService) {
            window.socketService.socket.emit("offer", { offer });
         }
      } catch (error) {
         console.error("Offer creation error:", error);
         throw new Error("Failed to create or send offer.");
      }
   };

   handleOffer = async (offer) => {
      if (!this.peerConnection) return;
      try {
         console.log("Handling offer:", offer);
         await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
         );
         const answer = await this.peerConnection.createAnswer();
         await this.peerConnection.setLocalDescription(answer);
         if (window.socketService) {
            window.socketService.socket.emit("answer", { answer });
         }
      } catch (error) {
         console.error("Offer handling error:", error);
         throw new Error("Failed to process offer or create answer.");
      }
   };

   handleAnswer = async (answer) => {
      if (!this.peerConnection) return;
      try {
         console.log("Handling answer:", answer);
         await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
         );
      } catch (error) {
         console.error("Answer handling error:", error);
         throw new Error("Failed to process answer.");
      }
   };

   handleIceCandidate = async (candidate) => {
      if (!this.peerConnection) return;
      try {
         console.log("Adding ICE candidate:", candidate);
         await this.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
         );
      } catch (error) {
         console.error("ICE candidate error:", error);
         throw new Error("Failed to add ICE candidate.");
      }
   };

   closeConnection = () => {
      if (this.peerConnection) {
         this.peerConnection.close();
         this.peerConnection = null;
      }
   };
}

const webRTCService = new WebRTCService();
export default webRTCService;
