class WebRTCService {
   constructor() {
      this.peerConnection = null;
      this.localStream = null;
      this.socket = null;
      this.onRemoteStream = null;

      this.configuration = {
         iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
         ],
      };
   }

   async initialize(socket, onRemoteStream) {
      this.socket = socket;
      this.onRemoteStream = onRemoteStream;
      await this.setupLocalStream();
      this.setupSocketListeners();
   }

   async setupLocalStream() {
      try {
         this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
         });
         return this.localStream;
      } catch (error) {
         console.error("Error accessing media devices:", error);
         throw error;
      }
   }

   setupSocketListeners() {
      this.socket.onOffer(async (offer) => {
         await this.handleOffer(offer);
      });

      this.socket.onAnswer(async (answer) => {
         await this.handleAnswer(answer);
      });

      this.socket.onIceCandidate(async (candidate) => {
         await this.handleNewICECandidate(candidate);
      });
   }

   async createPeerConnection() {
      try {
         this.peerConnection = new RTCPeerConnection(this.configuration);

         this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
               this.socket.emitIceCandidate(event.candidate);
            }
         };

         this.peerConnection.ontrack = (event) => {
            if (this.onRemoteStream) {
               this.onRemoteStream(event.streams[0]);
            }
         };

         this.localStream.getTracks().forEach((track) => {
            this.peerConnection.addTrack(track, this.localStream);
         });
      } catch (error) {
         console.error("Error creating peer connection:", error);
         throw error;
      }
   }

   async initiateCall() {
      await this.createPeerConnection();
      try {
         const offer = await this.peerConnection.createOffer();
         await this.peerConnection.setLocalDescription(offer);
         this.socket.emitOffer(offer);
      } catch (error) {
         console.error("Error creating offer:", error);
         throw error;
      }
   }

   async handleOffer(offer) {
      if (!this.peerConnection) {
         await this.createPeerConnection();
      }

      try {
         await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
         );
         const answer = await this.peerConnection.createAnswer();
         await this.peerConnection.setLocalDescription(answer);
         this.socket.emitAnswer(answer);
      } catch (error) {
         console.error("Error handling offer:", error);
         throw error;
      }
   }

   async handleAnswer(answer) {
      try {
         await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
         );
      } catch (error) {
         console.error("Error handling answer:", error);
         throw error;
      }
   }

   async handleNewICECandidate(candidate) {
      try {
         await this.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
         );
      } catch (error) {
         console.error("Error adding ICE candidate:", error);
         throw error;
      }
   }

   closeConnection() {
      if (this.peerConnection) {
         this.peerConnection.close();
         this.peerConnection = null;
      }

      if (this.localStream) {
         this.localStream.getTracks().forEach((track) => track.stop());
         this.localStream = null;
      }

      if (this.socket) {
         this.socket.off('offer');
         this.socket.off('answer');
         this.socket.off('ice-candidate');
      }
   }

   toggleAudio(enabled) {
      if (this.localStream) {
         this.localStream
            .getAudioTracks()
            .forEach((track) => {
               track.enabled = enabled;
               if (this.peerConnection) {
                  const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'audio');
                  if (sender) sender.track.enabled = enabled;
               }
            });
      }
   }

   toggleVideo(enabled) {
      if (this.localStream) {
         this.localStream
            .getVideoTracks()
            .forEach((track) => {
               track.enabled = enabled;
               if (this.peerConnection) {
                  const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                  if (sender) sender.track.enabled = enabled;
               }
            });
      }
   }
}

const webRTCService = new WebRTCService();
export default webRTCService;
