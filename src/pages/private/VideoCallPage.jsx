import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff, 
  Camera, Maximize2, Minimize2, Settings, Users,
  Monitor, Volume2, VolumeX, MoreVertical
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useWebRTC from '../../hooks/webRtc';
import { getSocket } from '../../hooks/socket';
import { toast } from 'react-toastify';
import { useGetProfileQuery } from '../../features/auth/authApi';
import { useUploadScreenshotMutation } from '../../features/screenshot/screenshotApi';

export default function VideoCallPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get parameters from URL
  const roomId = searchParams.get('roomId');
  const callType = searchParams.get('type') || 'video'; // 'video' or 'audio'
  const petitionId = searchParams.get('petitionId');
  const userName = searchParams.get('userName') || 'User';
  const isInitiator = searchParams.get('initiator') === 'true'; // true if this user started the call
  
  // State
  const [callTimer, setCallTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting'); // 'connecting', 'connected', 'ended'
  const [remoteUserName, setRemoteUserName] = useState(userName);
  
  const timerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const ringToneRef = useRef(null);
  const callingToneRef = useRef(null);
  const socket = getSocket();
  
  const { data: profileData } = useGetProfileQuery();
  const [uploadScreenshot] = useUploadScreenshotMutation();
  
  const currentUser = profileData?.data;
  
  // WebRTC Hook
  const {
    localMediaRef,
    remoteMediaRef,
    toggleVideo: toggleVideoTrack,
    toggleAudio: toggleAudioTrack,
    startCall,
    endCall: endWebRTCCall,
    remoteStream,
    peerRef,
  } = useWebRTC(roomId, { 
    audio: true, 
    video: callType === 'video' 
  });

  // Start timer when connected
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Check connection status
  useEffect(() => {
    if (remoteStream) {
      setCallStatus('connected');
      toast.success('Call connected!');
      // Stop all tones when connected
      if (ringToneRef.current) {
        ringToneRef.current.pause();
        ringToneRef.current.currentTime = 0;
      }
      if (callingToneRef.current) {
        callingToneRef.current.pause();
        callingToneRef.current.currentTime = 0;
      }
    }
  }, [remoteStream]);

  // Monitor peer connection state
  useEffect(() => {
    const peer = peerRef?.current;
    if (!peer) return;

    const checkConnectionState = setInterval(() => {
      if (peer.connectionState === 'failed' || peer.iceConnectionState === 'failed') {
        console.error('❌ Connection failed, attempting recovery...');
        // Try to restart ice
        if (peer.restartIce) {
          peer.restartIce();
        }
      }
      
      // Also check if we have a connected state
      if ((peer.connectionState === 'connected' || peer.iceConnectionState === 'connected') && callStatus === 'connecting') {
        console.log('✅ Connection established via peer state');
        setCallStatus('connected');
      }
    }, 1000);

    return () => clearInterval(checkConnectionState);
  }, [callStatus]);

  // Force unmute remote audio when stream is available
  useEffect(() => {
    if (remoteStream && remoteMediaRef.current) {
      console.log('🔊 Forcing remote media unmute');
      remoteMediaRef.current.muted = false;
      remoteMediaRef.current.volume = 1.0;
      
      // Enable all tracks
      remoteStream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log('🎤 Enabled remote audio track:', track.label);
      });
      
      remoteStream.getVideoTracks().forEach(track => {
        track.enabled = true;
        console.log('📹 Enabled remote video track:', track.label);
      });
      
      // Force play
      remoteMediaRef.current.play().catch(err => {
        console.warn('⚠️ Autoplay blocked:', err);
        // User interaction might be needed
      });
      
      console.log('✅ Remote media element configured:', {
        muted: remoteMediaRef.current.muted,
        volume: remoteMediaRef.current.volume,
        paused: remoteMediaRef.current.paused
      });
    }
  }, [remoteStream, remoteMediaRef]);

  // Play tones while connecting - use calling for initiator, ringing for receiver
  useEffect(() => {
    if (callStatus === 'connecting') {
      if (isInitiator && callingToneRef.current) {
        // Caller hears calling tone
        callingToneRef.current.loop = true;
        callingToneRef.current.play().catch((err) => {
          console.warn('Calling tone autoplay blocked:', err);
        });
        // Stop ringing if playing
        if (ringToneRef.current) {
          ringToneRef.current.pause();
          ringToneRef.current.currentTime = 0;
        }
      } else if (!isInitiator && ringToneRef.current) {
        // Receiver hears ringing tone
        ringToneRef.current.loop = true;
        ringToneRef.current.play().catch((err) => {
          console.warn('Ringing tone autoplay blocked:', err);
        });
        // Stop calling if playing
        if (callingToneRef.current) {
          callingToneRef.current.pause();
          callingToneRef.current.currentTime = 0;
        }
      }
    } else {
      // Stop all tones when not connecting
      if (ringToneRef.current) {
        ringToneRef.current.pause();
        ringToneRef.current.currentTime = 0;
      }
      if (callingToneRef.current) {
        callingToneRef.current.pause();
        callingToneRef.current.currentTime = 0;
      }
    }
    return () => {
      if (ringToneRef.current) {
        ringToneRef.current.pause();
        ringToneRef.current.currentTime = 0;
      }
      if (callingToneRef.current) {
        callingToneRef.current.pause();
        callingToneRef.current.currentTime = 0;
      }
    };
  }, [callStatus, isInitiator]);

  // Initialize call - runs once on mount
  useEffect(() => {
    if (!roomId) {
      toast.error('Invalid room ID');
      navigate(-1);
      return;
    }

    // Only initiator starts the call (creates offer)
    // Receiver waits for incoming offer via socket listener in useWebRTC
    const initCall = async () => {
      if (isInitiator) {
        // Caller: Wait for receiver to ACCEPT the call before creating offer
        console.log('🎬 Caller waiting for receiver to accept call:', roomId);
        setCallStatus('connecting'); // Show "waiting for other user"
        
        // Listen for call acceptance - ONLY then create peer connection
        const handleCallAccepted = async () => {
          console.log('✅ Receiver accepted! Creating peer connection and sending offer');
          try {
            await startCall();
          } catch (error) {
            console.error('Failed to start call:', error);
            toast.error('Failed to start call');
          }
        };

        socket.on('call:accepted', handleCallAccepted);

        return () => {
          socket.off('call:accepted', handleCallAccepted);
        };
      } else {
        // Receiver: We already accepted in IncomingCallListener
        // Now just wait for the offer from caller
        console.log('📞 Receiver ready, waiting for offer from caller:', roomId);
        setCallStatus('connecting');
      }
    };

    initCall();

    // Cleanup ONLY when component truly unmounts (navigating away)
    return () => {
      console.log('🧹 VideoCallPage unmounting, cleaning up call');
      endWebRTCCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - run once on mount, cleanup on unmount

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleCallEnded = () => {
      toast.info('Call ended by other user');
      handleEndCall();
    };

    socket.on('call:ended', handleCallEnded);
    
    return () => {
      socket.off('call:ended', handleCallEnded);
    };
  }, [socket]);

  // Auto-hide controls
  useEffect(() => {
    const resetTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (callStatus === 'connected') {
          setShowControls(false);
        }
      }, 3000);
    };

    if (callStatus === 'connected') {
      resetTimeout();
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [callStatus]);

  // Format timer
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle mute
  const handleToggleMute = () => {
    const isMuted = toggleAudioTrack();
    setMuted(isMuted);
  };

  // Toggle camera
  const handleToggleCamera = () => {
    if (callType === 'audio') return;
    const isCameraOff = toggleVideoTrack();
    setCameraOff(isCameraOff);
  };

  // Toggle speaker
  const handleToggleSpeaker = () => {
    if (remoteMediaRef.current) {
      remoteMediaRef.current.muted = !remoteMediaRef.current.muted;
      setSpeakerOff(!speakerOff);
    }
  };

  // Screenshot
  const handleScreenshot = async () => {
    if (!remoteMediaRef?.current || callType !== 'video') return;
    
    try {
      const video = remoteMediaRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (blob && petitionId) {
          const formData = new FormData();
          const filename = `screenshot-${petitionId}-${Date.now()}.png`;
          formData.append('screenshot', blob, filename);
          formData.append('roomId', roomId);
          formData.append('petitionId', petitionId);
          
          const participants = [
            {
              userId: currentUser._id,
              name: currentUser.name,
              role: currentUser.role
            },
            {
              userId: 'remote',
              name: remoteUserName,
              role: 'User'
            }
          ];
          formData.append('participants', JSON.stringify(participants));
          
          const metadata = {
            customerName: remoteUserName,
            agentName: currentUser.name,
          };
          formData.append('metadata', JSON.stringify(metadata));

          await uploadScreenshot(formData).unwrap();
          toast.success('Screenshot captured and saved!');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Screenshot error:', err);
      toast.error('Failed to capture screenshot');
    }
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // End call
  const handleEndCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    // Stop all tones
    if (ringToneRef.current) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
    }
    if (callingToneRef.current) {
      callingToneRef.current.pause();
      callingToneRef.current.currentTime = 0;
    }
    endWebRTCCall();
    if (roomId && socket) {
      socket.emit('call:end', { roomId });
    }
    setCallStatus('ended');
    setTimeout(() => {
      // Redirect Agent/QA/TL back to the specific query if available
      const role = profileData?.data?.role;
      const rolePath = role?.toLowerCase();
      if (petitionId && rolePath && ['agent', 'qa', 'tl'].includes(rolePath)) {
        navigate(`/${rolePath}/query/${petitionId}`, { replace: true });
      } else {
        navigate(-1);
      }
    }, 1000);
  };

  // Mouse move handler
  const handleMouseMove = () => {
    if (callStatus === 'connected') {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-gray-900 overflow-hidden"
      onMouseMove={handleMouseMove}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Ring Tone & Calling Tone Audio */}
      <audio ref={ringToneRef} src="/ringing.mp3" preload="auto" />
      <audio ref={callingToneRef} src="/calling.mp3" preload="auto" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black opacity-50 pointer-events-none" />
      
      {/* Remote Video (Main Display) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {callType === 'video' ? (
          <div className="relative w-full h-full bg-gray-900">
            <video
              ref={remoteMediaRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-contain"
            />
            
            {/* No video placeholder */}
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                </div>
                <p className="text-white text-lg sm:text-xl font-semibold mb-2">{remoteUserName}</p>
                <p className="text-gray-400 text-sm sm:text-base">
                  {callStatus === 'connecting' ? 'Connecting...' : 'Waiting for video...'}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Audio call display
          <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black">
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
              <Phone className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-white" />
            </div>
            <p className="text-white text-2xl sm:text-3xl font-bold mb-2">{remoteUserName}</p>
            <p className="text-gray-400 text-base sm:text-lg">
              {callStatus === 'connecting' ? 'Connecting...' : 'Audio Call'}
            </p>
            
            {/* Audio elements - NOT muted for remote */}
            <audio ref={remoteMediaRef} autoPlay muted={false} />
            <audio ref={localMediaRef} autoPlay muted />
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) - Only for video calls */}
      {callType === 'video' && (
        <div 
          className={`
            absolute z-20 bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-600 overflow-hidden
            right-4 sm:right-6 md:right-8
            top-2 sm:top-6 md:top-20
            w-32 h-24 sm:w-40 sm:h-30 md:w-52 md:h-40 lg:w-64 lg:h-48
          `}
        >
          <video
            ref={localMediaRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          
          {/* Camera off indicator */}
          {cameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
              <VideoOff className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          )}
          
          {/* Local user label */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-xs font-medium">
            You
          </div>
        </div>
      )}

      {/* Top Bar - Always visible on mobile, auto-hide on desktop */}
      <div 
        className={`
          absolute top-0 left-0 right-0 z-30 
          bg-gradient-to-b from-black via-black/80 to-transparent
          px-4 sm:px-6 py-4 sm:py-3
          transition-all duration-300
          ${showControls ? 'translate-y-0 opacity-100' : 'md:-translate-y-full md:opacity-0'}
        `}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Call Info */}
          <div className="flex items-center gap-3 sm:gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm sm:text-base md:text-lg">
                {remoteUserName}
              </h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                <p className="text-gray-300 text-xs sm:text-sm">
                  {callStatus === 'connected' ? formatTime(callTimer) : isInitiator ? 'Waiting for other user...' : 'Connecting...'}
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            {callType === 'video' && (
              <button
                onClick={handleToggleFullscreen}
                className="hidden sm:flex p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                ) : (
                  <Maximize2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                )}
              </button>
            )}
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
              title="Settings"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div 
        className={`
          absolute bottom-0 left-0 right-0 z-30
          bg-gradient-to-t from-black via-black/80 to-transparent
          px-4 sm:px-6 py-3 sm:py-8
          transition-all duration-300
          ${showControls ? 'translate-y-0 opacity-100' : 'md:translate-y-full md:opacity-0'}
        `}
      >
        <div className="max-w-3xl mx-auto">
          {/* Main Control Buttons */}
          <div className="flex items-center justify-center gap-3 sm:gap-2 md:gap-6 mb-4">
            {/* Microphone */}
            <button
              onClick={handleToggleMute}
              className={`
                p-2 sm:p-5 md:p-6 rounded-full transition-all transform hover:scale-110 active:scale-95
                ${muted 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                }
              `}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>

            {/* Camera (Video calls only) */}
            {callType === 'video' && (
              <button
                onClick={handleToggleCamera}
                className={`
                  p-2 sm:p-5 md:p-6 rounded-full transition-all transform hover:scale-110 active:scale-95
                  ${cameraOff 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                  }
                `}
                title={cameraOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {cameraOff ? (
                  <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </button>
            )}

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="p-5 sm:p-6 md:p-7 bg-red-600 hover:bg-red-700 rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-2xl"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>

            {/* Screenshot (Video calls only, Agent/QA/Admin only) */}
            {callType === 'video' && petitionId && currentUser?.role !== 'Customer' && (
              <button
                onClick={handleScreenshot}
                disabled={callStatus !== 'connected'}
                className="p-2 sm:p-5 md:p-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Take Screenshot"
              >
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            )}

            {/* Speaker */}
            <button
              onClick={handleToggleSpeaker}
              className={`
                p-2 sm:p-5 md:p-6 rounded-full transition-all transform hover:scale-110 active:scale-95
                ${speakerOff 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                }
              `}
              title={speakerOff ? "Unmute Speaker" : "Mute Speaker"}
            >
              {speakerOff ? (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
          </div>

          {/* Connection Status Indicator */}
          {callStatus === 'connecting' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-yellow-300 text-sm font-medium">Establishing connection...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute right-4 top-20 z-40 w-72 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-2">
          <h3 className="text-white font-semibold mb-4">Call Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Call Type</span>
              <span className="text-white font-medium text-sm uppercase">{callType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Room ID</span>
              <span className="text-white font-mono text-xs">{roomId?.substring(0, 8)}...</span>
            </div>
            {petitionId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Petition ID</span>
                <span className="text-blue-400 font-mono text-xs">{petitionId}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Status</span>
              <span className={`text-sm font-medium ${callStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}`}>
                {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      )}

      {/* Call Ended Overlay */}
      {callStatus === 'ended' && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <PhoneOff className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Call Ended</h2>
            <p className="text-gray-400 mb-4">Duration: {formatTime(callTimer)}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
