import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { FaTimes } from "react-icons/fa";

const SOCKET_SERVER_URL = import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:5000";
const ICE_SERVERS = [{ urls: ["stun:stun.l.google.com:19302"] }];

const VideoCall = ({ roomId, user, onClose }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const [status, setStatus] = useState("Connecting to call...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roomId) return;

    const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    const createPeerConnection = async (remoteSocketId, createOffer = false) => {
      if (!localStreamRef.current) return null;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

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
        }
      };

      peersRef.current[remoteSocketId] = pc;

      if (createOffer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("signal", {
          roomId,
          to: remoteSocketId,
          signal: offer,
        });
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
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { roomId, to: from, signal: answer });
        } else if (signal.type === "answer") {
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
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        socket.emit("join-room", { roomId, user });
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
    socket.on("connect_error", () => setError("Real-time connection failed. Check your network."));

    return () => {
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
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-white/95 border-b border-slate-200 px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Interview Room</p>
            <p className="text-xs text-slate-600 break-words">{roomId}</p>
            <p className="text-xs text-slate-600">{status}</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition"
          >
            <FaTimes /> End Call
          </button>
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
