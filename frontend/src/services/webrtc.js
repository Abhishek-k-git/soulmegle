import socketService from './socket';
class WebRTCService {
   constructor() {
      this.peerConnection = null;
      this.localStream = null;
      this.isInitiator = false;
   }

   initializePeerConnection = async (isInitiator = false) => {
      if (this.peerConnection) {
         await this.closeConnection();
      }
      this.isInitiator = isInitiator;

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
         const [remoteStream] = event.streams;
         console.log("Received remote track", remoteStream);
         const remoteVideo = document.getElementById('remoteVideo');
         if (remoteVideo && remoteStream) {
            remoteVideo.srcObject = remoteStream;
         }
      };

      this.peerConnection.onicecandidate = (event) => {
         if (event.candidate && window.socketService?.socket) {
            window.socketService.socket.emit("ice_candidate", {
               candidate: event.candidate,
            });
         }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
         console.log("ICE connection state:", this.peerConnection.iceConnectionState);
         if (this.peerConnection.iceConnectionState === 'disconnected' || 
             this.peerConnection.iceConnectionState === 'failed' || 
             this.peerConnection.iceConnectionState === 'closed') {
            this.closeConnection();
         }
      };

      this.peerConnection.onconnectionstatechange = () => {
         console.log("Connection state:", this.peerConnection.connectionState);
         if (this.peerConnection.connectionState === 'failed') {
            this.closeConnection();
         }
      };
   };

   getUserMedia = async () => {
      try {
         if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
         }

         this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
         });

         const localVideo = document.getElementById('localVideo');
         if (localVideo) {
            localVideo.srcObject = this.localStream;
         }

         return this.localStream;
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
         await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
         
         const stream = await this.getUserMedia();
         stream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, stream);
         });

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
         const currentState = this.peerConnection.signalingState;
         if (currentState === "have-local-offer") {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
         } else {
            console.warn("Received answer in incorrect signaling state:", currentState);
         }
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

   closeConnection = async () => {
      if (this.localStream) {
         this.localStream.getTracks().forEach(track => track.stop());
         this.localStream = null;

         const localVideo = document.getElementById('localVideo');
         if (localVideo) {
            localVideo.srcObject = null;
         }
      }

      if (this.peerConnection) {
         const remoteVideo = document.getElementById('remoteVideo');
         if (remoteVideo) {
            remoteVideo.srcObject = null;
         }

         this.peerConnection.close();
         this.peerConnection = null;
      }
   };
}

const webRTCService = new WebRTCService();
export default webRTCService;
