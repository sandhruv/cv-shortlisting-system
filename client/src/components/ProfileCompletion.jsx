import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaTimes } from "react-icons/fa";
import api from "../services/api";

const LABELS = {
  photo: "Profile Photo",
  headline: "Headline",
  about: "About Section",
  location: "Location",
  phone: "Phone Number",
  experiences: "Work Experience",
  education: "Education",
  skills: "Skills (3+)",
  certifications: "Certifications",
  projects: "Projects",
};

export default function ProfileCompletion({ onNavigate }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/profile/completion").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return null;

  const color = data.score >= 80 ? "#4ade80" : data.score >= 50 ? "#fbbf24" : "#ff6b2b";

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80">Profile Strength</h3>
        <span className="text-lg font-bold" style={{ color }}>{data.score}%</span>
      </div>

      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
        <motion.div initial={{ width: 0 }} animate={{ width: `${data.score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full" style={{ background: color }} />
      </div>

      <div className="space-y-1.5">
        {Object.entries(data.sections).map(([key, done]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            {done ? <FaCheck className="text-green-400" size={10} /> : <FaTimes className="text-white/20" size={10} />}
            <span className={done ? "text-white/60" : "text-white/30"}>{LABELS[key]}</span>
          </div>
        ))}
      </div>

      {data.score < 100 && (
        <button onClick={() => onNavigate && onNavigate()}
          className="mt-4 w-full py-2 text-xs font-medium text-[#ff6b2b] border border-[#ff6b2b]/30 rounded-xl hover:bg-[#ff6b2b]/10 transition">
          Complete Profile
        </button>
      )}
    </div>
  );
}
