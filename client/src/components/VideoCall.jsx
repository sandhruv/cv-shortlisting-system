import React, { useEffect, useRef } from "react";

const VideoCall = ({ roomName, onClose }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!roomName) return;

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => {
      if (window.JitsiMeetExternalAPI && containerRef.current) {
        const domain = "meet.jit.si";
        const options = {
          roomName: roomName,
          width: "100%",
          height: "100%",
          parentNode: containerRef.current,
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
          },
        };
        const api = new window.JitsiMeetExternalAPI(domain, options);
        api.addEventListener("videoConferenceLeft", onClose);
      }
    };
    document.body.appendChild(script);

    return () => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe) iframe.remove();
    };
  }, [roomName, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl overflow-hidden shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg"
        >
          End Call
        </button>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default VideoCall;
