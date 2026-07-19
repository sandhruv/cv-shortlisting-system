import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { FaTimes, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaExpand } from "react-icons/fa";

const SOCKET_SERVER_URL = import.meta.env.VITE_WEBSOCKET_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000" : window.location.origin);
const ICE_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
    ],
  },
];

const VideoCall = ({ roomId, user, onClose }) => {
  // Existing refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pipLoopRef = useRef(null);
  const screenVideoRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const canvasStreamRef = useRef(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  
  // New refs for added features
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Audio recording for AI
  const aiAudioRecorderRef = useRef(null);
  const aiAudioChunksRef = useRef([]);
  const aiAudioContextRef = useRef(null);
  const aiAudioDestRef = useRef(null);

  // Existing states
  const [status, setStatus] = useState("Connecting to call...");
  const [error, setError] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [iceConnectionState, setIceConnectionState] = useState("new");
  const [participants, setParticipants] = useState(1);
  const [connectionReady, setConnectionReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // New states for added features
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPIP, setIsPIP] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('good');
  const [bitrate, setBitrate] = useState(0);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState('');
  const [reactions, setReactions] = useState([]);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [useNoiseSuppression, setUseNoiseSuppression] = useState(true);
  const [useEchoCancellation, setUseEchoCancellation] = useState(true);
  const [useVirtualBackground, setUseVirtualBackground] = useState(false);
  const [bgColor, setBgColor] = useState('#1a1a2e');

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Full screen handlers
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  // Audio analyzer setup
  const setupAudioAnalyzer = (stream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Start monitoring audio level
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();
    }
  };

  // Network quality monitoring
  const monitorNetworkQuality = () => {
    const pc = Object.values(peersRef.current)[0];
    if (!pc) return;
    
    pc.getStats().then(stats => {
      let currentBitrate = 0;
      
      stats.forEach(report => {
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          currentBitrate = report.bytesSent / 1000;
        }
        
        if (report.type === 'candidate-pair' && report.nominated) {
          const rtt = report.currentRoundTripTime * 1000;
          if (rtt > 300) {
            setNetworkQuality('poor');
          } else if (rtt > 150) {
            setNetworkQuality('fair');
          } else {
            setNetworkQuality('good');
          }
        }
      });
      
      setBitrate(currentBitrate);
    });
  };

  // Get available cameras
  const getAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0 && !currentDevice) {
        setCurrentDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
    }
  };

  // Switch camera
  const switchCamera = async (deviceId) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: true
      });
      
      if (localStreamRef.current) {
        const videoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        
        if (oldVideoTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        
        localStreamRef.current.addTrack(videoTrack);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        
        Object.values(peersRef.current).forEach(pc => {
          const senders = pc.getSenders();
          const sender = senders.find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        setCurrentDevice(deviceId);
      }
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera');
    }
  };

  // Picture-in-Picture
  const togglePictureInPicture = async () => {
    if (!remoteVideoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPIP(false);
      } else {
        await remoteVideoRef.current.requestPictureInPicture();
        setIsPIP(true);
      }
    } catch (err) {
      console.error('PIP error:', err);
    }
  };

  // Screenshot capture
  const captureScreenshot = () => {
    if (!remoteVideoRef.current) return;
    
    const video = remoteVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
    ctx.font = '14px Arial';
    ctx.fillText(`Interview ${new Date().toLocaleString()}`, 10, 20);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${new Date().toISOString()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // Recording
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    
    try {
      const combinedStream = new MediaStream();
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          combinedStream.addTrack(track.clone());
        });
      }
      
      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach(track => {
          combinedStream.addTrack(track.clone());
        });
      }
      
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      recordedChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-recording-${new Date().toISOString()}.webm`;
        a.click();
        
        URL.revokeObjectURL(url);
      };
      
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording');
    }
  };

  // Reactions
  const sendReaction = (emoji) => {
    const id = Date.now();
    setReactions(prev => [...prev, { id, emoji }]);
    
    if (socketRef.current) {
      socketRef.current.emit("reaction", { roomId, emoji });
    }
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  // Virtual background (simplified version)
  const applyVirtualBackground = () => {
    if (!localStreamRef.current) return;
    setUseVirtualBackground(!useVirtualBackground);
    
    if (!useVirtualBackground) {
      // Simple color overlay effect
      const video = document.createElement('video');
      video.srcObject = localStreamRef.current;
      video.play();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const processFrame = () => {
        if (!video.videoWidth || !video.videoHeight) {
          requestAnimationFrame(processFrame);
          return;
        }
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw video with some transparency
        ctx.globalAlpha = 0.85;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
        
        requestAnimationFrame(processFrame);
      };
      
      processFrame();
      
      const stream = canvas.captureStream(30);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } else {
      // Restore original stream
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  };

  const updateLocalTrackStates = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = audioEnabled;
    });
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = videoEnabled;
    });
  };

  useEffect(() => {
    updateLocalTrackStates();
  }, [audioEnabled, videoEnabled]);

  const toggleAudio = () => setAudioEnabled((enabled) => !enabled);
  const toggleVideo = () => setVideoEnabled((enabled) => !enabled);

  const replaceVideoTrack = (newTrack) => {
    Object.values(peersRef.current).forEach((pc) => {
      const senders = pc.getSenders();
      const sender = senders.find((s) => s.track && s.track.kind === "video");
      if (sender) {
        sender.replaceTrack(newTrack).catch((err) => {
          console.error("Failed to replace track", err);
        });
      }
    });
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false
      });
      screenStreamRef.current = screenStream;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const screenVideo = document.createElement("video");
      screenVideo.srcObject = screenStream;
      screenVideo.autoplay = true;
      screenVideo.playsInline = true;
      screenVideo.muted = true;
      screenVideoRef.current = screenVideo;

      await new Promise((resolve) => {
        screenVideo.onloadedmetadata = () => {
          screenVideo.play().then(resolve);
        };
      });

      canvas.width = screenVideo.videoWidth || 1280;
      canvas.height = screenVideo.videoHeight || 720;

      let cameraVideo = null;
      if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
        cameraVideo = document.createElement("video");
        cameraVideo.srcObject = localStreamRef.current;
        cameraVideo.autoplay = true;
        cameraVideo.playsInline = true;
        cameraVideo.muted = true;
        cameraVideoRef.current = cameraVideo;
        await new Promise((resolve) => {
          cameraVideo.onloadedmetadata = () => {
            cameraVideo.play().then(resolve);
          };
        });
      }

      const drawFrame = () => {
        if (!screenStream.active) {
          stopScreenShare();
          return;
        }

        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

        if (videoEnabled && cameraVideo && cameraVideo.readyState >= 2) {
          const pipWidth = canvas.width * 0.22;
          const pipHeight = (cameraVideo.videoHeight / cameraVideo.videoWidth) * pipWidth;
          const x = canvas.width - pipWidth - 20;
          const y = canvas.height - pipHeight - 20;

          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(x - 4, y - 4, pipWidth + 8, pipHeight + 8);
          ctx.strokeStyle = "#d4a843";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, pipWidth, pipHeight);

          ctx.drawImage(cameraVideo, x, y, pipWidth, pipHeight);
        }

        pipLoopRef.current = requestAnimationFrame(drawFrame);
      };

      drawFrame();

      const canvasStream = canvas.captureStream(30);
      canvasStreamRef.current = canvasStream;
      const canvasTrack = canvasStream.getVideoTracks()[0];

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = canvasStream;
      }

      replaceVideoTrack(canvasTrack);

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setScreenSharing(true);
    } catch (err) {
      console.error("Error sharing screen:", err);
      if (err.name !== "NotAllowedError") {
        setError("Failed to share screen. Make sure permissions are granted.");
      }
    }
  };

  const stopScreenShare = () => {
    if (pipLoopRef.current) {
      cancelAnimationFrame(pipLoopRef.current);
      pipLoopRef.current = null;
    }

    if (screenVideoRef.current) {
      screenVideoRef.current.pause();
      screenVideoRef.current.srcObject = null;
      screenVideoRef.current = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.pause();
      cameraVideoRef.current.srcObject = null;
      cameraVideoRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach((track) => track.stop());
      canvasStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      replaceVideoTrack(cameraTrack);
    }

    setScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  const attachRemoteStream = (stream) => {
    if (!remoteVideoRef.current || !stream) return;
    remoteVideoRef.current.srcObject = stream;
    remoteVideoRef.current.muted = false;
    remoteVideoRef.current.play().catch(() => {});
  };

  useEffect(() => {
    if (!roomId) return;

    setCallDuration(0);
    setParticipants(1);
    setStatus("Connecting to call...");
    setIceConnectionState("new");
    setConnectionReady(false);
    setIsConnecting(true);

    // Get available devices
    getAvailableDevices();

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token: token || "",
        role: user?.role || "Student",
        name: user?.name || user?.email || "Guest",
      },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
    });
    socketRef.current = socket;

    const createPeerConnection = async (remoteSocketId, createOffer = false) => {
      if (!localStreamRef.current) return null;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.isMakingOffer = false;
      pc.isSettingRemoteAnswerPending = false;
      pc.polite = socket.id > remoteSocketId;

      localStreamRef.current.getTracks().forEach((track) => {
        if (track.kind === "video" && canvasStreamRef.current) {
          const canvasTrack = canvasStreamRef.current.getVideoTracks()[0];
          if (canvasTrack && canvasTrack.readyState === "live") {
            pc.addTrack(canvasTrack, canvasStreamRef.current);
            return;
          }
        }
        pc.addTrack(track, localStreamRef.current);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", {
            roomId,
            to: remoteSocketId,
            signal: { candidate: event.candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        const incomingStream = event.streams?.[0] || (event.track ? new MediaStream([event.track]) : null);
        if (incomingStream) {
          attachRemoteStream(incomingStream);
          setStatus("Connected");
          setConnectionReady(true);
          setIsConnecting(false);

          // Connect remote stream to AI audio destination if available
          if (aiAudioContextRef.current && aiAudioDestRef.current) {
            try {
              const remoteSource = aiAudioContextRef.current.createMediaStreamSource(incomingStream);
              remoteSource.connect(aiAudioDestRef.current);
            } catch (err) {
              console.error("Failed to connect remote audio to AI recorder:", err);
            }
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("Connected");
          setIsConnecting(false);
        } else if (pc.connectionState === "disconnected") {
          setStatus("Disconnected");
        } else if (pc.connectionState === "failed") {
          setStatus("Connection failed");
          setError("WebRTC connection failed. Please retry.");
        }
      };

      pc.oniceconnectionstatechange = () => {
        setIceConnectionState(pc.iceConnectionState);
        if (pc.iceConnectionState === "connected") {
          setIsConnecting(false);
        }
        if (pc.iceConnectionState === "failed") {
          setError("ICE negotiation failed. Check network or browser permissions.");
        }
      };

      pc.onaddstream = (event) => {
        attachRemoteStream(event.stream);
      };

      peersRef.current[remoteSocketId] = pc;

      if (createOffer) {
        try {
          pc.isMakingOffer = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("signal", {
            roomId,
            to: remoteSocketId,
            signal: offer,
          });
        } catch (err) {
          console.error("Offer creation failed", err);
        } finally {
          pc.isMakingOffer = false;
        }
      }

      return pc;
    };

    const handleSignal = async ({ from, signal }) => {
      if (!signal || !from) return;
      let pc = peersRef.current[from];
      if (!pc) {
        pc = await createPeerConnection(from, false);
      }
      if (!pc) return;

      try {
        if (signal.type === "offer") {
          if (pc.signalingState !== "stable") {
            console.warn("Ignoring offer in unstable state", pc.signalingState);
            return;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { roomId, to: from, signal: answer });
        } else if (signal.type === "answer") {
          if (pc.signalingState !== "have-local-offer") {
            console.warn("Received answer in wrong state", pc.signalingState);
            return;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error("WebRTC signal error", err);
      }
    };

    const handleRoomUsers = async (members) => {
      const others = (members || []).filter((member) => member.socketId !== socket.id);
      setParticipants(others.length + 1);
      if (!others.length) {
        setStatus("Waiting for participant...");
        setIsConnecting(true);
      }
      for (const member of others) {
        if (!peersRef.current[member.socketId]) {
          const shouldCreateOffer = socket.id < member.socketId;
          await createPeerConnection(member.socketId, shouldCreateOffer);
        }
      }
    };

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: {
            echoCancellation: useEchoCancellation,
            noiseSuppression: useNoiseSuppression,
            autoGainControl: true,
            sampleRate: 48000,
            sampleSize: 16
          }
        });
        localStreamRef.current = stream;
        setupAudioAnalyzer(stream);
        updateLocalTrackStates();
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        socket.emit("join-room", { roomId, user: user || { id: "guest", role: "Student", name: "Guest" } });
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
        
        // Start automatic AI audio recording immediately
        if (user?.role === "HR" || user?.role === "Admin") {
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            aiAudioContextRef.current = audioCtx;
            const dest = audioCtx.createMediaStreamDestination();
            aiAudioDestRef.current = dest;

            if (stream) {
              const localSource = audioCtx.createMediaStreamSource(stream);
              localSource.connect(dest);
            }

            aiAudioRecorderRef.current = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
            aiAudioChunksRef.current = [];

            aiAudioRecorderRef.current.ondataavailable = (e) => {
              if (e.data.size > 0) aiAudioChunksRef.current.push(e.data);
            };

            aiAudioRecorderRef.current.start(1000);
          } catch (err) {
            console.error("AI Audio recording failed to start:", err);
          }
        }

        // Start network monitoring
        const networkInterval = setInterval(monitorNetworkQuality, 3000);
        return () => clearInterval(networkInterval);
      } catch (err) {
        console.error("media error", err);
        setError("Unable to access camera or microphone. Please allow permissions.");
      }
    };

    socket.on("connect", () => {
      setStatus("Connected to signaling server");
      initMedia();
    });
    socket.on("room-users", handleRoomUsers);
    socket.on("signal", handleSignal);
    
    socket.on("reaction", ({ emoji }) => {
      const id = Date.now();
      setReactions(prev => [...prev, { id, emoji }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 3000);
    });

    socket.on("disconnect", (reason) => {
      setStatus(`Disconnected (${reason})`);
    });
    socket.on("connect_error", (err) => {
      console.error("Socket connect error", err);
      setError(`Real-time connection failed: ${err.message || "Check your network."}`);
    });
    socket.on("connect_timeout", () => {
      setError("Real-time connection timed out. Please refresh and try again.");
    });

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
      socket.emit("leave-room", { roomId });
      socket.disconnect();

      // Handle AI audio upload
      if (aiAudioRecorderRef.current && aiAudioRecorderRef.current.state !== "inactive") {
        aiAudioRecorderRef.current.stop();
      }

      if (aiAudioContextRef.current) {
        aiAudioContextRef.current.close().catch(console.error);
      }

      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      canvasStreamRef.current?.getTracks().forEach((track) => track.stop());
      canvasStreamRef.current = null;
      if (pipLoopRef.current) {
        cancelAnimationFrame(pipLoopRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [roomId, user]);

  // Audio Waveform component
  const AudioWaveform = () => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
      if (!analyserRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const draw = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / dataArray.length) * 2.5;
        let x = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#d4af37');
          gradient.addColorStop(0.5, '#f0d060');
          gradient.addColorStop(1, '#ffd700');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
        
        requestAnimationFrame(draw);
      };
      
      draw();
    }, []);
    
    return (
      <canvas 
        ref={canvasRef}
        width={300} 
        height={60}
        className="rounded-lg bg-black/50 backdrop-blur-sm"
      />
    );
  };

  const handleEndCall = async () => {
    setStatus("Uploading AI Analysis...");
    if (aiAudioRecorderRef.current && aiAudioRecorderRef.current.state !== "inactive") {
      await new Promise((resolve) => {
        aiAudioRecorderRef.current.onstop = async () => {
          if (aiAudioChunksRef.current.length > 0) {
            const audioBlob = new Blob(aiAudioChunksRef.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append("audio", audioBlob, "interview-audio.webm");
            
            try {
              const token = localStorage.getItem("token");
              await fetch(`${SOCKET_SERVER_URL}/api/interviews/${roomId}/analyze-audio`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`
                },
                body: formData
              });
            } catch (err) {
              console.error("Failed to upload audio for AI analysis:", err);
            }
          }
          resolve();
        };
        aiAudioRecorderRef.current.stop();
      });
    }
    onClose();
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
    >
      <div className={`relative w-full max-w-6xl h-[90vh] bg-[#0d131f] rounded-2xl overflow-hidden shadow-2xl border border-[#d4af37]/20 ${isFullScreen ? 'max-w-full h-full rounded-none border-none' : ''}`}>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 bg-gradient-to-b from-black/80 to-transparent flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#d4af37] shadow-lg shadow-[#d4af37]/20">
              <FaVideo className="text-[#0d131f] text-sm" />
            </div>
            <span className="text-white font-semibold text-sm tracking-wider">Interview Room</span>
            <span className="text-[#d4af37] text-xs bg-[#d4af37]/10 px-3 py-1 rounded-full border border-[#d4af37]/20 truncate max-w-[150px]">
              {roomId?.substring(0, 12) || "N/A"}
            </span>
            
            {/* Camera selector */}
            <select
              onChange={(e) => switchCamera(e.target.value)}
              value={currentDevice}
              className="bg-black/50 text-white text-xs px-2 py-1 rounded border border-[#d4af37]/30"
              onClick={getAvailableDevices}
            >
              {availableDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${availableDevices.indexOf(device) + 1}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Network quality indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                networkQuality === 'good' ? 'bg-green-400' :
                networkQuality === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <span className="text-white/40 text-xs">
                {bitrate > 0 ? `${(bitrate / 1024).toFixed(1)} Mbps` : '--'}
              </span>
            </div>
            
            <span className="text-white/60 text-xs">{status}</span>
            <span className="text-[#d4af37] text-xs bg-[#d4af37]/10 px-3 py-1 rounded-full border border-[#d4af37]/20">
              👤 {participants}
            </span>
            <span className="text-white/40 text-xs">⏱ {formatDuration(callDuration)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              iceConnectionState === "connected" ? "text-green-400 bg-green-900/30" :
              iceConnectionState === "new" ? "text-yellow-400 bg-yellow-900/30" :
              "text-red-400 bg-red-900/30"
            }`}>
              {iceConnectionState}
            </span>
            
            {/* Audio level indicator */}
            {audioLevel > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-4 bg-[#d4af37] rounded-full" style={{ height: `${audioLevel * 20 + 4}px` }} />
                <div className="w-1 h-4 bg-[#d4af37] rounded-full" style={{ height: `${audioLevel * 30 + 4}px` }} />
                <div className="w-1 h-4 bg-[#d4af37] rounded-full" style={{ height: `${audioLevel * 40 + 4}px` }} />
              </div>
            )}
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid h-full gap-4 grid-cols-1 lg:grid-cols-2 p-4 pt-20">
          <div className="rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#0a0a0a] relative">
            <div className="bg-[#1a1a1a] px-4 py-2 text-xs font-medium text-[#b8a88a] border-b border-[#2a2a2a] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              My Camera
              {useVirtualBackground && (
                <span className="ml-2 text-[#d4af37] text-[10px]">🎨 BG</span>
              )}
            </div>
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-[calc(100%-40px)] object-cover bg-black" />
            
            {/* Audio waveform overlay */}
            {audioLevel > 0.1 && (
              <div className="absolute bottom-2 left-2 opacity-50">
                <AudioWaveform />
              </div>
            )}
          </div>
          
          <div className="rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#0a0a0a] relative">
            <div className="bg-[#1a1a1a] px-4 py-2 text-xs font-medium text-[#b8a88a] border-b border-[#2a2a2a] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d4af43] animate-pulse" />
              Remote Participant
              {isPIP && (
                <span className="ml-2 text-blue-400 text-[10px]">📺 PIP</span>
              )}
            </div>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-[calc(100%-40px)] object-cover bg-black" />
            
            {/* Reactions overlay */}
            {reactions.map((reaction) => (
              <div
                key={reaction.id}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce pointer-events-none"
              >
                {reaction.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Connecting overlay */}
        {isConnecting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d131f]/90 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full border-4 border-[#d4af37]/30 border-t-[#d4af37] animate-spin mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">Joining Interview</h3>
            <p className="text-white/40 text-sm">{status}</p>
          </div>
        )}

        {/* Reaction buttons */}
        <div className="absolute right-6 bottom-24 z-20 flex gap-2">
          {['👍', '👏', '💯', '🎉', '🤔'].map(emoji => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-2xl transition-all duration-200 hover:scale-110 backdrop-blur-sm"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-6 py-4 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex justify-center items-center gap-2 flex-wrap">
            {/* Main controls group */}
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-all duration-200 ${
                  audioEnabled
                    ? "bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37]"
                    : "bg-red-500/80 hover:bg-red-600 text-white"
                }`}
                title={audioEnabled ? "Mute Audio" : "Unmute Audio"}
              >
                {audioEnabled ? <FaMicrophone size={16} /> : <FaMicrophoneSlash size={16} />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all duration-200 ${
                  videoEnabled
                    ? "bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37]"
                    : "bg-red-500/80 hover:bg-red-600 text-white"
                }`}
                title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {videoEnabled ? <FaVideo size={16} /> : <FaVideoSlash size={16} />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-all duration-200 ${
                  screenSharing
                    ? "bg-red-500/80 hover:bg-red-600 text-white"
                    : "bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37]"
                }`}
                title={screenSharing ? "Stop Sharing" : "Share Screen"}
              >
                <FaDesktop size={16} />
              </button>
            </div>

            {/* Feature controls group */}
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37]"
                }`}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M20 12c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8 8-3.6 8-8z" />
                </svg>
              </button>

              <button
                onClick={captureScreenshot}
                className="p-3 rounded-full bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] transition-all duration-200"
                title="Take Screenshot"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button
                onClick={togglePictureInPicture}
                className="p-3 rounded-full bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] transition-all duration-200"
                title="Picture in Picture"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>

              <button
                onClick={applyVirtualBackground}
                className={`p-3 rounded-full transition-all duration-200 ${
                  useVirtualBackground
                    ? "bg-[#d4af37] text-black"
                    : "bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37]"
                }`}
                title="Virtual Background"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" />
                </svg>
              </button>

              {useVirtualBackground && (
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer border-2 border-[#d4af37]/30 p-0"
                  title="Choose Background Color"
                />
              )}
            </div>

            {/* Utility controls */}
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
              <button
                onClick={toggleFullScreen}
                className="p-3 rounded-full bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] transition-all duration-200"
                title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
              >
                <FaExpand size={16} />
              </button>

              <button
                onClick={handleEndCall}
                className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                title="End Call"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-red-500/90 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm border border-red-400/30">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;