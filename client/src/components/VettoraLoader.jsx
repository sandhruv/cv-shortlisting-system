import { motion } from "framer-motion";

/* ════════════════════════════════════════════════════════════════
   VettoraLoader — Animated Vettora Logo Loading Screen

   Props:
     message   — text shown below the logo
     theme     — "dark" | "light" (default: "dark")
     fullScreen — position fixed overlay (default: true)
═════════════════════════════════════════════════════════════════ */

const BRAND = "VETTORA";

const THEMES = {
  dark: {
    bg: "#080c14",
    glow1: "rgba(212,175,55,0.10)",
    glow2: "rgba(139,26,26,0.08)",
    orbitRing: "rgba(212,175,55,0.10)",
    orbitRingDash: "rgba(212,175,55,0.07)",
    orbitDot: "#d4af37",
    letterGrad: "linear-gradient(160deg, #f3e5ab 0%, #d4af37 30%, #c5a059 60%, #d4af37 100%)",
    underline: "linear-gradient(90deg, transparent, #d4af37, transparent)",
    tagline: "rgba(212,175,55,0.45)",
    barBg: "rgba(255,255,255,0.04)",
    barFill: "linear-gradient(90deg, transparent, #d4af37, transparent)",
    message: "rgba(255,255,255,0.3)",
    toggleBg: "#1a1f2e",
    toggleBorder: "rgba(255,255,255,0.1)",
    toggleIcon: "#d4af37",
  },
  light: {
    bg: "#f5f0e8",
    glow1: "rgba(212,175,55,0.15)",
    glow2: "rgba(139,26,26,0.06)",
    orbitRing: "rgba(160,120,32,0.12)",
    orbitRingDash: "rgba(160,120,32,0.08)",
    orbitDot: "#a07820",
    letterGrad: "linear-gradient(160deg, #5c3a00 0%, #8B6914 30%, #a07820 60%, #8B6914 100%)",
    underline: "linear-gradient(90deg, transparent, #8B6914, transparent)",
    tagline: "rgba(90,60,10,0.5)",
    barBg: "rgba(0,0,0,0.06)",
    barFill: "linear-gradient(90deg, transparent, #8B6914, transparent)",
    message: "rgba(60,40,10,0.4)",
    toggleBg: "#e8e0d0",
    toggleBorder: "rgba(0,0,0,0.1)",
    toggleIcon: "#5c3a00",
  },
};

const GOLD = "#d4af37";

const letterVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.7, filter: "blur(5px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.3,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function VettoraLoader({ message = "Loading…", theme = "dark", fullScreen = true }) {
  const t = THEMES[theme] || THEMES.dark;
  const totalLetters = BRAND.length;
  const entranceEnd = totalLetters * 0.3 + 0.6;

  return (
    <div
      className={`vettora-loader-wrap ${fullScreen ? "vettora-loader-fixed" : ""}`}
      style={{ background: t.bg }}
    >
      {/* ── Ambient glow blobs ── */}
      <div className="vettora-loader-glow" style={{ background: `radial-gradient(circle, ${t.glow1} 0%, transparent 70%)` }} />
      <div className="vettora-loader-glow vettora-loader-glow-2" style={{ background: `radial-gradient(circle, ${t.glow2} 0%, transparent 70%)` }} />

      {/* ── Main content ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="vettora-loader-content"
      >
        {/* ── Orbiting rings ── */}
        <div className="vettora-orbit-wrap">
          <div className="vettora-orbit-ring vettora-orbit-1" style={{ borderColor: t.orbitRing }} />
          <div className="vettora-orbit-ring vettora-orbit-2" style={{ borderColor: t.orbitRingDash, borderStyle: "dashed" }} />
          <div className="vettora-orbit-ring vettora-orbit-3" style={{ borderColor: t.orbitRing }} />
          <div className="vettora-orbit-dot" style={{ background: t.orbitDot, boxShadow: `0 0 8px ${t.orbitDot}99, 0 0 20px ${t.orbitDot}44` }} />
        </div>

        {/* ═══════════════════════════════════════════════════════
            ANIMATED LOGO — letter-by-letter entrance + glow
        ═══════════════════════════════════════════════════════ */}
        <div className="vettora-logo-row" aria-label="Vettora">
          {BRAND.split("").map((char, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={letterVariants}
              initial="hidden"
              animate="visible"
              className="vettora-letter"
            >
              <motion.span
                className="vettora-letter-inner"
                style={{
                  background: t.letterGrad,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                initial={{ textShadow: `0 0 6px ${GOLD}33` }}
                animate={{
                  textShadow: [
                    `0 0 6px ${GOLD}11`,
                    `0 0 14px ${GOLD}66, 0 0 35px ${GOLD}33`,
                    `0 0 6px ${GOLD}11`,
                  ],
                }}
                transition={{
                  delay: entranceEnd + i * 0.1,
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {char}
              </motion.span>
            </motion.span>
          ))}
        </div>

        {/* ── Underline accent ── */}
        <motion.div
          className="vettora-underline"
          style={{ background: t.underline }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: entranceEnd + 0.1, duration: 0.5, ease: "easeOut" }}
        />

        {/* ── Tagline ── */}
        <motion.p
          className="vettora-tagline"
          style={{ color: t.tagline }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: entranceEnd + 0.3, duration: 0.5 }}
        >
          Intelligence Behind Every Hire
        </motion.p>

        {/* ── Loading bar ── */}
        <motion.div
          className="vettora-loader-bar-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: entranceEnd + 0.4 }}
        >
          <div className="vettora-loader-bar" style={{ background: t.barBg }}>
            <div className="vettora-loader-bar-fill" style={{ background: t.barFill }} />
          </div>
        </motion.div>

        {/* ── Status message ── */}
        <motion.p
          className="vettora-loader-message"
          style={{ color: t.message }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0.6, 1] }}
          transition={{ delay: entranceEnd + 0.5, duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
