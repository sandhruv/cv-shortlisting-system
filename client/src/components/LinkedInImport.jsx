import { useState, useRef } from "react";
import {
  FaLinkedin, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaFilePdf, FaArrowRight, FaTimes, FaCloudUploadAlt, FaPaste,
} from "react-icons/fa";
import api from "../services/api";

const STEPS = [
  { id: "validate", label: "Profile text validated" },
  { id: "clean", label: "Content cleaned" },
  { id: "chunk", label: "Text chunked" },
  { id: "retrieve", label: "Relevant sections retrieved" },
  { id: "ai", label: "AI extraction completed" },
  { id: "validate2", label: "Profile validated" },
];

export default function LinkedInImport({ onProfileImported, onClose }) {
  const [mode, setMode] = useState("text");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [importing, setImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef();

  const simulateSteps = () => {
    setCurrentStep(0);
    const timers = [300, 600, 1000, 1500, 2200];
    timers.forEach((delay, idx) => {
      setTimeout(() => setCurrentStep(idx + 1), delay);
    });
  };

  const handleTextImport = async () => {
    if (!profileText.trim()) {
      setError("Please paste your LinkedIn profile text");
      return;
    }
    if (profileText.trim().length < 20) {
      setError("Profile text is too short. Paste at least 20 characters.");
      return;
    }

    setImporting(true);
    setError("");
    simulateSteps();

    try {
      const res = await api.post("/profile/import-linkedin-text", {
        profileText: profileText.trim(),
      });

      setCurrentStep(5);

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => onProfileImported?.(res.data.profile), 1000);
      } else {
        setError(res.data.message || "Import failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import profile");
    } finally {
      setImporting(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB");
      return;
    }

    setImporting(true);
    setError("");
    simulateSteps();

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await api.post("/profile/import-linkedin-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCurrentStep(5);

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => onProfileImported?.(res.data.profile), 1000);
      } else {
        setError(res.data.message || "PDF import failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process PDF");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0077b5]/10 rounded-xl">
            <FaLinkedin className="text-[#0077b5]" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Import LinkedIn Profile</h3>
            <p className="text-xs text-white/40">Auto-fill your profile with AI extraction</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/30 hover:text-white transition">
            <FaTimes size={16} />
          </button>
        )}
      </div>

      {/* Success State */}
      {success ? (
        <div className="text-center py-6">
          <FaCheckCircle className="text-green-400 mx-auto mb-3" size={40} />
          <p className="text-white font-medium">Profile Imported Successfully</p>
          <p className="text-white/40 text-xs mt-1">Populating your profile form...</p>
        </div>
      ) : importing ? (
        /* Progress State */
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/60 mb-4">
            <FaSpinner className="animate-spin text-[#ff6b2b]" size={16} />
            <span className="text-sm">Processing your profile...</span>
          </div>
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                idx < currentStep
                  ? "bg-green-500/20 text-green-400"
                  : idx === currentStep
                  ? "bg-[#ff6b2b]/20 text-[#ff6b2b]"
                  : "bg-white/5 text-white/20"
              }`}>
                {idx < currentStep ? <FaCheckCircle size={10} /> : idx + 1}
              </div>
              <span className={`text-xs ${idx <= currentStep ? "text-white/60" : "text-white/20"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Input State */
        <>
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setMode("text"); setError(""); }}
              className={`flex-1 p-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                mode === "text"
                  ? "bg-[#0077b5]/20 text-[#0077b5] border border-[#0077b5]/30"
                  : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
              }`}
            >
              <FaPaste size={12} /> Paste Text
            </button>
            <button
              onClick={() => { setMode("pdf"); setError(""); }}
              className={`flex-1 p-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                mode === "pdf"
                  ? "bg-[#ff6b2b]/20 text-[#ff6b2b] border border-[#ff6b2b]/30"
                  : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
              }`}
            >
              <FaFilePdf size={12} /> Upload PDF
            </button>
            <button
              onClick={() => { setMode("url"); setError(""); }}
              className={`flex-1 p-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                mode === "url"
                  ? "bg-[#0077b5]/20 text-[#0077b5] border border-[#0077b5]/30"
                  : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
              }`}
            >
              <FaLinkedin size={12} /> URL
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-3">
              <FaExclamationTriangle className="text-red-400 mt-0.5 shrink-0" size={12} />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Paste Text Mode */}
          {mode === "text" && (
            <div className="space-y-3">
              <div className="p-3 bg-[#0077b5]/5 border border-[#0077b5]/10 rounded-xl">
                <p className="text-xs text-white/50">
                  Go to your LinkedIn profile → Click "More" → "Save to PDF"
                  <br />OR copy text from your LinkedIn "About" page
                </p>
              </div>
              <textarea
                rows={8}
                value={profileText}
                onChange={(e) => { setProfileText(e.target.value); setError(""); }}
                placeholder={"Paste your LinkedIn profile text here...\n\nExample:\n\nNAME\nJohn Doe\n\nHEADLINE\nSoftware Engineer at Google\n\nABOUT\nComputer Science graduate with 3 years of experience...\n\nEXPERIENCE\nSoftware Engineer\nGoogle\nJan 2022 - Present\n\nEDUCATION\nMIT\nB.S. Computer Science\n2018 - 2022\n\nSKILLS\nPython\nReact\nNode.js"}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#0077b5] transition resize-none font-mono"
                disabled={importing}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30">{profileText.length} / 20,000 characters</span>
                <button
                  onClick={handleTextImport}
                  disabled={importing || !profileText.trim()}
                  className="px-5 py-2.5 bg-[#0077b5] hover:bg-[#006097] text-white rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FaLinkedin size={14} />
                  Extract with AI
                  <FaArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* PDF Mode */}
          {mode === "pdf" && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-[#ff6b2b]/30 rounded-xl p-8 text-center cursor-pointer transition"
              >
                <FaCloudUploadAlt className="text-white/20 mx-auto mb-3" size={32} />
                <p className="text-sm text-white/50">Click to upload your LinkedIn PDF</p>
                <p className="text-xs text-white/30 mt-1">Export from LinkedIn Settings &gt; Data Privacy &gt; Get a copy of your data</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handlePdfUpload}
                />
              </div>
            </div>
          )}

          {/* URL Mode */}
          {mode === "url" && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => { setLinkedinUrl(e.target.value); setError(""); }}
                  placeholder="https://www.linkedin.com/in/your-profile/"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0077b5] transition pr-10"
                  disabled={importing}
                />
                <FaLinkedin className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              </div>
              <button
                onClick={async () => {
                  if (!linkedinUrl.trim()) { setError("Enter a LinkedIn URL"); return; }
                  setImporting(true);
                  setError("");
                  simulateSteps();
                  try {
                    const res = await api.post("/profile/import-linkedin", { linkedinUrl: linkedinUrl.trim() });
                    setCurrentStep(5);
                    if (res.data.success) {
                      setSuccess(true);
                      setTimeout(() => onProfileImported?.(res.data.profile), 1000);
                    } else {
                      setError(res.data.message || "Import failed");
                    }
                  } catch (err) {
                    setError(err.response?.data?.message || "Failed to import");
                  } finally {
                    setImporting(false);
                  }
                }}
                disabled={importing || !linkedinUrl.trim()}
                className="w-full p-3 bg-[#0077b5] hover:bg-[#006097] text-white rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaLinkedin size={14} />
                Import with AI
                <FaArrowRight size={12} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
