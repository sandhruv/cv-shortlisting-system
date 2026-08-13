import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

export default function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-5 right-5 z-[999] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl max-w-sm ${
              t.type === "success"
                ? "bg-green-950/80 border-green-500/30 text-green-200"
                : t.type === "error"
                ? "bg-rose-950/80 border-rose-500/30 text-rose-200"
                : "bg-[#1a2a40]/90 border-white/10 text-white"
            }`}
          >
            {t.type === "success" ? <FaCheckCircle className="text-green-400 shrink-0" /> :
             t.type === "error" ? <FaTimesCircle className="text-rose-400 shrink-0" /> :
             <FaInfoCircle className="text-blue-400 shrink-0" />}
            <span className="text-sm flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-white/40 hover:text-white shrink-0"><FaTimes size={12} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
