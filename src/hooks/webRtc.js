// src/hooks/useWebRTC.js

import { useEffect, useRef, useState } from "react";
import { getSocket } from "./socket";

export default function useWebRTC(roomId, { audio , video  } = {}) {
  const [remoteStream, setRemoteStream] = useState(null);
  const localMediaRef = useRef(null);   // <video> or <audio>
  const remoteMediaRef = useRef(null);  // <video> or <audio>
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const socket = getSocket();


  /** Create RTCPeerConnection and attach media */
  const createPeerConnection = async () => {

     console.log("createPeerConnection with:", { audio, video });

    // Configure ICE servers with multiple STUN servers for better connectivity
    const iceServers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" }
    ];




    
    const peer = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10,
    });
    
    const localStream = await navigator.mediaDevices.getUserMedia({ audio, video });
    localStreamRef.current = localStream;

    console.log("✅ Created local stream", localStream);
    console.log("📊 Local stream tracks:", {
      audio: localStream.getAudioTracks().length,
      video: localStream.getVideoTracks().length
    });
    
    // Log audio track details
    localStream.getAudioTracks().forEach((track, index) => {
      console.log(`🎤 Local Audio Track ${index}:`, {
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
    });

    tryAttachLocalStream();

    // attach to local media element
    if (localMediaRef.current) {
      localMediaRef.current.srcObject = localStream;
      console.log("✅ Attached local stream", { audio, video });
    }else{
      console.error("❌ localMediaRef is null");
    }

    // const peer = new RTCPeerConnection({
    //   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    // });
    
    // add local tracks
    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

    // Log what we're adding
    console.log('📤 Adding local tracks to peer connection:', {
      audio: localStream.getAudioTracks().length,
      video: localStream.getVideoTracks().length
    });

    // handle remote tracks
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      console.log("📡 Remote track received:", {
        kind: event.track.kind,
        enabled: event.track.enabled,
        muted: event.track.muted,
        readyState: event.track.readyState
      });
      console.log("📊 Remote stream tracks:", {
        audio: stream.getAudioTracks().length,
        video: stream.getVideoTracks().length
      });
      
      // Log all tracks in the stream
      stream.getTracks().forEach((track, index) => {
        console.log(`📡 Remote Track ${index} (${track.kind}):`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });
      
      setRemoteStream(stream);
      console.log("✅ Remote stream set in state:", stream);
    };

    // Monitor connection state
    peer.oniceconnectionstatechange = () => {
      console.log('🔗 ICE Connection State:', peer.iceConnectionState);
      if (peer.iceConnectionState === 'failed') {
        console.error('❌ ICE Connection failed - restarting ICE...');
        peer.restartIce();
      }
    };

    peer.onconnectionstatechange = () => {
      console.log('🔗 Connection State:', peer.connectionState);
      if (peer.connectionState === 'failed') {
        console.error('❌ Peer Connection failed');
      }
    };

    // Also log signaling state
    peer.onsignalingstatechange = () => {
      console.log('🔗 Signaling State:', peer.signalingState);
    };

    // send ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        console.log('📤 Sending ICE candidate');
        socket.emit("webrtc:ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      } else if (!event.candidate) {
        console.log('✅ All ICE candidates sent');
      }
    };
  peerRef.current = peer;
    return peer;
  };

  //  /** Attach remote stream when ref becomes available */
  // useEffect(() => {
  //   if (remoteStream && remoteVideoRef.current) {
  //     remoteVideoRef.current.srcObject = remoteStream;
  //     console.log("✅ Attached remoteStream to remoteVideoRef");
  //   }
  // }, [remoteStream, remoteVideoRef.current]);

  /** Caller: start a call (create offer) */
  const startCall = async () => {
    console.log('🎬 startCall() - Creating peer connection and offer');
    const res = await createPeerConnection(); 
    console.log("✅ createPeerConnection result:", res);

    const peer = peerRef.current;
    if (!peer) return console.error("❌ PeerConnection not initialized");

    console.log('📝 Creating offer...');
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    console.log('📤 Sending offer to room:', roomId);
    socket.emit("webrtc:offer", { roomId, sdp: offer });
  };

  /** Callee: accept call and send answer */
  const acceptCall = async (offer) => {
    if (!offer) {
      console.error("❌ acceptCall called with null offer");
      return;
    }
    console.log('📞 acceptCall() - Received offer, creating peer connection');
    await createPeerConnection();
    const peer = peerRef.current;
    if (!peer) return console.error("❌ PeerConnection not initialized");
    console.log("✅ acceptCall attaching local stream:", localStreamRef.current);

    console.log('📝 Setting remote description (offer)');
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('📝 Creating answer...');
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    console.log('📤 Sending answer to room:', roomId);
    socket.emit("webrtc:answer", { roomId, sdp: answer });
  };

 // replace tryAttachLocalStream
const tryAttachLocalStream = () => {
  const interval = setInterval(() => {
    if (localMediaRef.current && localStreamRef.current) {
      if (!localMediaRef.current.srcObject) {
        localMediaRef.current.srcObject = localStreamRef.current;
        console.log("✅ Attached local stream (retry)");
      }
      clearInterval(interval);
    }
  }, 100);

  setTimeout(() => clearInterval(interval), 5000);
};


  useEffect(() => {
  if (remoteStream && remoteMediaRef.current) {
    console.log('🔗 Attaching remote stream to media element');
    remoteMediaRef.current.srcObject = remoteStream;
    
    // Force unmute for both audio and video elements
    remoteMediaRef.current.muted = false;
    remoteMediaRef.current.volume = 1.0;
    
    // Add more detailed logging
    console.log('🎛️ Media element settings:', {
      tagName: remoteMediaRef.current.tagName,
      muted: remoteMediaRef.current.muted,
      volume: remoteMediaRef.current.volume,
      streamId: remoteStream.id
    });
    
    // Log remote stream audio tracks
    const audioTracks = remoteStream.getAudioTracks();
    const videoTracks = remoteStream.getVideoTracks();
    console.log('🔊 Remote stream tracks:', { audio: audioTracks.length, video: videoTracks.length });
    
    audioTracks.forEach((track, index) => {
      console.log(`🎤 Remote Audio Track ${index}:`, {
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      });
      
      // Ensure track is enabled
      if (!track.enabled) {
        console.warn('⚠️ Audio track was disabled, enabling it');
        track.enabled = true;
      }
    });

    videoTracks.forEach((track, index) => {
      console.log(`📹 Remote Video Track ${index}:`, {
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      });
      
      // Ensure video track is enabled
      if (!track.enabled) {
        console.warn('⚠️ Video track was disabled, enabling it');
        track.enabled = true;
      }
    });

    // For video elements, ensure audio tracks are enabled
    if (remoteMediaRef.current.tagName === 'VIDEO') {
      console.log('📹 Video element - audio should be included in stream');
    }

    // Attempt to play with error handling
    const playPromise = remoteMediaRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("✅ Remote stream playing successfully");
          console.log('🔊 Audio should be audible now');
        })
        .catch((err) => {
          console.warn("⚠️ Autoplay blocked, waiting for user gesture", err.message);
          // This is normal - browser autoplay restrictions
        });
    }
  }
}, [remoteStream]);


  /** Signaling listeners */
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ sdp }) => {
      console.log("📡 [RECEIVER] Got offer via socket → running acceptCall()");
      await acceptCall(sdp);
    };

    const handleAnswer = async ({ sdp }) => {
      console.log("📡 [CALLER] Got answer via socket");
      const peer = peerRef.current;
      if (peer) {
        console.log('📝 Setting remote description (answer)');
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log('✅ Answer processed, connection should establish');
      }
    };

    const handleCandidate = async ({ candidate }) => {
      console.log('📥 Received ICE candidate');
      try {
        if (peerRef.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('✅ ICE candidate added');
        }
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    };

    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleCandidate);

    return () => {
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleCandidate);
    };
  }, [socket, roomId]);

  /** Cleanup on unmount */
  useEffect(() => {
    return () => {
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** End call and cleanup */
  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localMediaRef.current) {
      localMediaRef.current.srcObject = null;
    }
    if (remoteMediaRef.current) {
      remoteMediaRef.current.srcObject = null;
    }
    setRemoteStream(new MediaStream());

    if (roomId) {
      socket.emit("call:end", { roomId });
    }
  };

  /** Toggle video track */
  const toggleVideo = () => {
    if (!localStreamRef.current) return false;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      console.log('📹 Video toggled:', videoTrack.enabled ? 'ON' : 'OFF');
      return !videoTrack.enabled; // return true if camera is OFF
    }
    return false;
  };

  /** Toggle audio track */
  const toggleAudio = () => {
    if (!localStreamRef.current) return false;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      console.log('🎤 Audio toggled:', audioTrack.enabled ? 'ON' : 'OFF');
      return !audioTrack.enabled; // return true if muted
    }
    return false;
  };

  return {
    localMediaRef,
    remoteMediaRef,
    remoteStream,
    startCall,
    acceptCall,
    endCall,
    toggleVideo,
    toggleAudio,
    peerRef, // useful for screen sharing / track replacement
  };
}
