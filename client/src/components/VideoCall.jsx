import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { FaTimes, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";

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
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const [status, setStatus] = useState("Connecting to call...");
  const [error, setError] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [iceConnectionState, setIceConnectionState] = useState("new");
  const [participants, setParticipants] = useState(1);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
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

  useEffect(() => {
    if (!roomId) return;

    setCallDuration(0);
    setParticipants(1);
    setStatus("Connecting to call...");
    setIceConnectionState("new");

    const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    const isStable = (pc) => pc && pc.signalingState === "stable";
    const createPeerConnection = async (remoteSocketId, createOffer = false) => {
      if (!localStreamRef.current) return null;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.isMakingOffer = false;
      pc.isSettingRemoteAnswerPending = false;
      pc.polite = socket.id > remoteSocketId;

      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));

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
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setStatus("Connected");
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("Connected");
        } else if (pc.connectionState === "disconnected") {
          setStatus("Disconnected");
        } else if (pc.connectionState === "failed") {
          setStatus("Connection failed");
          setError("WebRTC connection failed. Please retry.");
        }
      };

      pc.oniceconnectionstatechange = () => {
        setIceConnectionState(pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          setError("ICE negotiation failed. Check network or browser permissions.");
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          if (pc.isMakingOffer) return;
          pc.isMakingOffer = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("signal", {
            roomId,
            to: remoteSocketId,
            signal: offer,
          });
        } catch (err) {
          console.error("Negotiation error", err);
        } finally {
          pc.isMakingOffer = false;
        }
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

      const offerCollision = signal.type === "offer" && (pc.isMakingOffer || !isStable(pc));
      const ignoreOffer = !pc.polite && offerCollision;

      try {
        if (signal.type === "offer") {
          if (ignoreOffer) {
            console.warn("Ignoring offer collision from", from);
            return;
          }
          pc.isSettingRemoteAnswerPending = signal.type === "answer";
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { roomId, to: from, signal: answer });
        } else if (signal.type === "answer") {
          if (!pc.isMakingOffer && pc.signalingState !== "have-local-offer") {
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
      }
      for (const member of others) {
        if (!peersRef.current[member.socketId]) {
          await createPeerConnection(member.socketId, true);
        }
      }
    };

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        updateLocalTrackStates();
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        socket.emit("join-room", { roomId, user });
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
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
    socket.on("disconnect", (reason) => {
      setStatus(`Disconnected (${reason})`);
    });
    socket.on("connect_error", () => setError("Real-time connection failed. Check your network."));

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
      socket.emit("leave-room", { roomId });
      socket.disconnect();
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [roomId, user]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center px-4 py-6">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-xl overflow-hidden shadow-xl">
        <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-3 bg-white/95 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Interview Room</p>
            <p className="text-xs text-slate-600 break-words">{roomId}</p>
            <p className="text-xs text-slate-600">{status}</p>
            <p className="text-xs text-slate-600">Participants: {participants}</p>
            <p className="text-xs text-slate-600">ICE state: {iceConnectionState}</p>
            <p className="text-xs text-slate-600">Duration: {formatDuration(callDuration)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAudio}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${audioEnabled ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
            >
              {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />} {audioEnabled ? "Mute" : "Unmute"}
            </button>
            <button
              type="button"
              onClick={toggleVideo}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${videoEnabled ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
            >
              {videoEnabled ? <FaVideo /> : <FaVideoSlash />} {videoEnabled ? "Stop Video" : "Start Video"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition"
            >
              <FaTimes /> End Call
            </button>
          </div>
        </div>

        <div className="grid h-full gap-4 grid-cols-1 lg:grid-cols-2 p-4 pt-20">
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-950 text-white">
            <div className="bg-slate-900 px-4 py-3 text-sm font-semibold">My Camera</div>
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-[calc(100%-48px)] object-cover bg-black" />
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-950 text-white">
            <div className="bg-slate-900 px-4 py-3 text-sm font-semibold">Remote Participant</div>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-[calc(100%-48px)] object-cover bg-black" />
          </div>
        </div>

        {error && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-red-50 text-red-700 text-sm border-t border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
