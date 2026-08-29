import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCheck, FaTimes, FaStar, FaLightbulb, FaChevronDown, FaChevronUp,
  FaUser, FaHeading, FaInfoCircle, FaBriefcase, FaTools, FaGraduationCap,
  FaProjectDiagram, FaCertificate, FaLink,
} from "react-icons/fa";
import api from "../services/api";

const SECTION_ICONS = {
  completeness: FaUser,
  headline: FaHeading,
  about: FaInfoCircle,
  experience: FaBriefcase,
  skills: FaTools,
  education: FaGraduationCap,
  projects: FaProjectDiagram,
  certifications: FaCertificate,
  consistency: FaLink,
};

export default function ProfileCompletion({ onNavigate }) {
  const [analysis, setAnalysis] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/profile/analyze")
      .then((r) => setAnalysis(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <div className="text-white/30 text-xs">Analyzing profile...</div>
      </div>
    );
  }

  if (!analysis) return null;

  const { score, grade, gradeColor, sections, suggestions } = analysis;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
      {/* Score Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white/80">Professional Score</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: gradeColor }}>{score}</span>
          <span className="text-xs text-white/40">/100</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${gradeColor}20`, color: gradeColor }}>
          {grade}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: gradeColor }}
        />
      </div>

      {/* Score Breakdown */}
      <div className="space-y-1.5 mb-4">
        {Object.entries(sections).map(([key, section]) => {
          const Icon = SECTION_ICONS[key] || FaStar;
          const sectionScore = Math.round((section.earned / section.max) * 100);
          const isExpanded = expanded === key;

          return (
            <div key={key}>
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 transition group"
              >
                <Icon className={sectionScore >= 70 ? "text-green-400" : sectionScore >= 40 ? "text-yellow-400" : "text-white/30"} size={10} />
                <span className="flex-1 text-left text-white/60 group-hover:text-white/80">{section.label}</span>
                <span className={`font-mono text-[10px] ${sectionScore >= 70 ? "text-green-400" : sectionScore >= 40 ? "text-yellow-400" : "text-white/30"}`}>
                  {section.earned}/{section.max}
                </span>
                {section.suggestions.length > 0 && (
                  isExpanded ? <FaChevronUp className="text-white/20" size={8} /> : <FaChevronDown className="text-white/20" size={8} />
                )}
              </button>

              {/* Expanded Feedback */}
              {isExpanded && section.suggestions.length > 0 && (
                <div className="ml-5 mb-2 space-y-1">
                  {section.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-white/40">
                      <FaLightbulb className="text-yellow-400/60 mt-0.5 shrink-0" size={8} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Top Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <h4 className="text-xs font-medium text-white/50 mb-2 flex items-center gap-1.5">
            <FaLightbulb className="text-[#ff6b2b]" size={10} />
            Top Actions
          </h4>
          <div className="space-y-1.5">
            {suggestions.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <span className="text-[#ff6b2b] font-mono">{i + 1}.</span>
                <span className="text-white/50">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {score < 100 && (
        <button
          onClick={() => onNavigate && onNavigate()}
          className="mt-4 w-full py-2 text-xs font-medium text-[#ff6b2b] border border-[#ff6b2b]/30 rounded-xl hover:bg-[#ff6b2b]/10 transition"
        >
          Improve Profile
        </button>
      )}
    </div>
  );
}
