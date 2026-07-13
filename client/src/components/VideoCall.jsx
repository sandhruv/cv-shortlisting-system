import React, { useEffect, useRef, useState } from "react";

const JITSI_SCRIPT_SRC = "https://meet.jit.si/external_api.js";

const VideoCall = ({ roomName, onClose }) => {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!roomName) return;

    const initJitsi = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      apiRef.current?.dispose();

      const domain = "meet.jit.si";
      const options = {
        roomName,
        width: "100%",
        height: "100%",
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_POWERED_BY: false,
          SHOW_JITSI_WATERMARK: false,
        },
      };
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current.addEventListener("videoConferenceLeft", onClose);
    };

    const existingScript = document.querySelector(`script[src="${JITSI_SCRIPT_SRC}"]`);

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else if (existingScript) {
      existingScript.addEventListener("load", initJitsi);
      existingScript.addEventListener("error", () => setLoadError(true));
    } else {
      const script = document.createElement("script");
      script.src = JITSI_SCRIPT_SRC;
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => setLoadError(true);
      document.body.appendChild(script);
    }

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [roomName, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center px-4 py-6">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl overflow-hidden shadow-xl">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-white/90 border-b border-slate-200 px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">Video call room</p>
            <p className="text-xs text-slate-600 break-words">{roomName}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://meet.jit.si/${encodeURIComponent(roomName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#0f172a] bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
            >
              Open in Jitsi
            </a>
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg"
            >
              End Call
            </button>
          </div>
        </div>
        {loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 p-6 text-center">
            <p className="text-lg font-semibold text-slate-900 mb-2">Unable to load the video call.</p>
            <p className="text-sm text-slate-600 mb-4">Please try opening the call in a new tab or refresh the page.</p>
            <a
              href={`https://meet.jit.si/${encodeURIComponent(roomName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#0f172a] underline"
            >
              Open the video call in Jitsi
            </a>
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0 mt-16" />
        )}
      </div>
    </div>
  );
};

export default VideoCall;
