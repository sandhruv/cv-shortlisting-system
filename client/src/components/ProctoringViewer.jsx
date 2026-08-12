import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const C = {
  bg:      "#0b0b12",
  panel:   "#10101a",
  card:    "#14141f",
  brd:     "#1e1e2e",
  brd2:    "#252535",
  text:    "#e8e8f4",
  mid:     "#8888a8",
  dim:     "#505068",
  maroon:  "#8B1A1A",
  gold:    "#F5A623",
  green:   "#22c55e",
  red:     "#ef4444",
  blue:    "#60a5fa",
};

/* ─────────────────────────────────────────────────────────────────
   ProctoringViewer
   Props:
     test    – the CodingTest object (must have proctorSnapshots, status)
     onClose – close callback
───────────────────────────────────────────────────────────────── */
export default function ProctoringViewer({ test, onClose }) {
  const [tab, setTab] = useState(test?.status === "in_progress" ? "live" : "snapshots");
  const [liveFrame, setLiveFrame] = useState(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [selectedSnap, setSelectedSnap] = useState(null);
  const socketRef = useRef(null);

  /* ── Live feed via Socket.IO ─────────────────────────────────── */
  useEffect(() => {
    if (tab !== "live" || !test?._id) return;

    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const socketUrl = isDev ? "http://localhost:5000" : window.location.origin;

    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem("token") },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-proctor", { testId: test._id });
      setLiveConnected(true);
    });

    socket.on("proctor-frame", ({ frame }) => {
      setLiveFrame(frame);
    });

    socket.on("disconnect", () => setLiveConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tab, test?._id]);

  const snapshots = test?.proctorSnapshots || [];
  const isLive = test?.status === "in_progress";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99998,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: C.panel, border: `1px solid ${C.brd}`, borderRadius: 16,
        width: "min(880px, 96vw)", maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: `1px solid ${C.brd}`,
          background: C.card,
        }}>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>
              🎥 Proctoring Monitor
            </div>
            <div style={{ color: C.mid, fontSize: 12, marginTop: 2 }}>
              {test?.title} · {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} captured
              {isLive && (
                <span style={{
                  marginLeft: 10, color: C.green, fontWeight: 700,
                  padding: "2px 8px", background: "#0a1f12", borderRadius: 20, fontSize: 11,
                }}>
                  ● LIVE
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setTab("snapshots")}
              style={{
                padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${tab === "snapshots" ? C.gold : C.brd}`,
                background: tab === "snapshots" ? "#2a1e06" : C.panel,
                color: tab === "snapshots" ? C.gold : C.mid,
              }}
            >
              📷 Snapshots ({snapshots.length})
            </button>
            {isLive && (
              <button
                onClick={() => setTab("live")}
                style={{
                  padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  border: `1px solid ${tab === "live" ? C.green : C.brd}`,
                  background: tab === "live" ? "#0a1f12" : C.panel,
                  color: tab === "live" ? C.green : C.mid,
                }}
              >
                ● Live Camera
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 14, cursor: "pointer",
                border: `1px solid ${C.brd}`, background: C.card, color: C.mid,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

          {/* ── LIVE TAB ─────────────────────────────────────────── */}
          {tab === "live" && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                marginBottom: 16, padding: "6px 16px", borderRadius: 20,
                background: liveConnected ? "#0a1f12" : "#1f0f0f",
                border: `1px solid ${liveConnected ? C.green : C.red}`,
                color: liveConnected ? C.green : C.red,
                fontSize: 12, fontWeight: 700,
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: liveConnected ? C.green : C.red,
                  display: "inline-block",
                  animation: "pulse 1.4s ease-in-out infinite",
                }} />
                {liveConnected ? "Connected – Awaiting frames from student" : "Connecting to student camera…"}
              </div>

              {liveFrame ? (
                <img
                  src={liveFrame}
                  alt="Live student feed"
                  style={{
                    width: "100%", maxWidth: 520, borderRadius: 12,
                    border: `2px solid ${C.green}`,
                    boxShadow: "0 4px 24px rgba(34,197,94,0.2)",
                  }}
                />
              ) : (
                <div style={{
                  width: "100%", maxWidth: 520, margin: "0 auto",
                  height: 280, borderRadius: 12,
                  border: `2px dashed ${C.brd2}`,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  color: C.dim, gap: 10,
                }}>
                  <div style={{ fontSize: 40 }}>📷</div>
                  <div style={{ fontSize: 13 }}>
                    {liveConnected
                      ? "Waiting for student to activate camera…"
                      : "Connecting to proctor socket…"}
                  </div>
                </div>
              )}
              <p style={{ color: C.dim, fontSize: 11, marginTop: 12 }}>
                Frames refresh every ~3 seconds · Low-resolution to minimise bandwidth
              </p>
            </div>
          )}

          {/* ── SNAPSHOTS TAB ────────────────────────────────────── */}
          {tab === "snapshots" && (
            <>
              {snapshots.length === 0 ? (
                <div style={{
                  textAlign: "center", color: C.dim, padding: "60px 20px",
                  fontSize: 14,
                }}>
                  No snapshots captured yet.
                  {isLive && " Snapshots are taken every 1 minute during the test."}
                </div>
              ) : (
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 10, marginBottom: 16,
                  }}>
                    {snapshots.map((snap, i) => (
                      <div
                        key={snap._id || i}
                        onClick={() => setSelectedSnap(snap)}
                        style={{
                          cursor: "pointer",
                          border: `2px solid ${selectedSnap?._id === snap._id ? C.gold : C.brd}`,
                          borderRadius: 8, overflow: "hidden",
                          background: C.card,
                          transition: "border-color 0.2s, transform 0.15s",
                          position: "relative",
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <img
                          src={`${API_BASE}${snap.imagePath}`}
                          alt={`Snapshot ${i + 1}`}
                          style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                          loading="lazy"
                        />
                        <div style={{
                          padding: "5px 8px", color: C.dim, fontSize: 10,
                        }}>
                          #{i + 1} · {new Date(snap.capturedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Enlarged view */}
                  {selectedSnap && (
                    <div style={{
                      border: `1px solid ${C.gold}`, borderRadius: 12,
                      overflow: "hidden", marginTop: 8,
                      boxShadow: "0 4px 24px rgba(245,166,35,0.15)",
                    }}>
                      <img
                        src={`${API_BASE}${selectedSnap.imagePath}`}
                        alt="Snapshot enlarged"
                        style={{ width: "100%", display: "block", maxHeight: 400, objectFit: "contain", background: "#000" }}
                      />
                      <div style={{
                        padding: "8px 14px", background: C.card, color: C.mid, fontSize: 12,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <span>Captured at {new Date(selectedSnap.capturedAt).toLocaleString()}</span>
                        <a
                          href={`${API_BASE}${selectedSnap.imagePath}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: C.gold, fontSize: 12, textDecoration: "none", fontWeight: 700 }}
                        >
                          ⬇ Download
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}
