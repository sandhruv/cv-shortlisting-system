import { motion } from "framer-motion";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Delete", confirmColor = "bg-rose-500 hover:bg-rose-600" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a2a40] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-rose-500/10"><FaExclamationTriangle className="text-rose-400" /></div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-white/60 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition text-white/60">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm text-white rounded-lg transition font-semibold ${confirmColor}`}>{confirmLabel}</button>
        </div>
      </motion.div>
    </div>
  );
}
