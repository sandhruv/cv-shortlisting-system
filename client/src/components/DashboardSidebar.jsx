import { FaSignOutAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

function DashboardSidebar({ open, onClose, collapsed, onToggleCollapse, items, activeKey, onSelect, theme, userName, userRole, onLogout }) {
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch (_err) { return {}; }
  })();
  const displayName = userName || currentUser.name || currentUser.email || "User";
  const displayRole = userRole || currentUser.role || "User";
  const isCollapsed = collapsed;

  return (
    <>
      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-30 transition-all duration-300 lg:hidden ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose} />

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen border-r transition-all duration-300 ease-in-out flex flex-col
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "w-[72px]" : "w-64"}`}
        style={{ backgroundColor: theme.background || "#0f1219", borderColor: theme.border || "rgba(255,255,255,0.06)" }}>

        {/* Logo area */}
        <div className={`flex items-center border-b shrink-0 ${isCollapsed ? "justify-center px-2 py-4" : "justify-between px-5 py-5"}`}
          style={{ borderColor: theme.border || "rgba(255,255,255,0.06)" }}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-2xl border ${theme.border?.includes("255") ? "border-white/10" : "border-[#c5a059]/40"}`}
                style={{ backgroundColor: theme.card || "rgba(255,255,255,0.03)" }}>
                <img src="/vettora-logo.png" alt="Vettora" className="h-7 object-contain rounded-lg" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.15em] truncate"
                  style={{ color: theme.muted || "rgba(255,255,255,0.45)" }}>{displayRole === "Student" ? "Student Panel" : displayRole === "HR" ? "HR Panel" : "Admin Panel"}</div>
                <div className="text-sm font-bold truncate" style={{ color: theme.text || "#fff" }}>Workspace</div>
              </div>
            </div>
          )}
          <button onClick={onToggleCollapse}
            className="rounded-xl p-1.5 transition-all hover:opacity-80 shrink-0 hidden lg:flex"
            style={{ backgroundColor: theme.card || "rgba(255,255,255,0.03)", color: theme.muted || "rgba(255,255,255,0.45)" }}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {isCollapsed ? <FaChevronRight size={11} /> : <FaChevronLeft size={11} />}
          </button>
          {!isCollapsed && (
            <button onClick={onClose}
              className="rounded-xl p-1.5 transition-all hover:opacity-80 lg:hidden"
              style={{ backgroundColor: theme.card || "rgba(255,255,255,0.03)", color: theme.muted || "rgba(255,255,255,0.45)" }}
              aria-label="Close sidebar">
              <FaChevronLeft size={11} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = activeKey === item.key;
            return (
              <button key={item.key} onClick={() => onSelect(item.key)} title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-2xl transition-all duration-200 group relative
                  ${isCollapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"}
                  ${selected ? "" : "hover:opacity-90"}`}
                style={{
                  backgroundColor: selected ? (theme.activeBackground || "rgba(212,175,55,0.08)") : "transparent",
                  color: selected ? (theme.accent || "#d4af37") : (theme.muted || "rgba(255,255,255,0.45)"),
                }}>
                {selected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ backgroundColor: theme.accent || "#d4af37" }} />
                )}
                <Icon size={16} className="shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-left text-[13px]">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="min-w-[20px] rounded-lg px-1.5 py-0.5 text-center text-[10px] font-bold"
                        style={{
                          backgroundColor: selected ? `${theme.accent || "#d4af37"}20` : "rgba(255,255,255,0.04)",
                          color: selected ? (theme.accent || "#d4af37") : (theme.muted || "rgba(255,255,255,0.35)"),
                        }}>{item.count}</span>
                    )}
                  </>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
                    style={{ backgroundColor: theme.card || "rgba(255,255,255,0.06)", color: theme.text || "#fff", border: `1px solid ${theme.border || "rgba(255,255,255,0.08)"}`, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className={`border-t shrink-0 ${isCollapsed ? "px-2 py-3" : "px-4 py-4"}`}
          style={{ borderColor: theme.border || "rgba(255,255,255,0.06)" }}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: `${theme.accent || "#d4af37"}15`, color: theme.accent || "#d4af37" }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate" style={{ color: theme.text || "#fff" }}>{displayName}</div>
                <div className="text-[11px] truncate" style={{ color: theme.muted || "rgba(255,255,255,0.35)" }}>{displayRole}</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                title={displayName} style={{ backgroundColor: `${theme.accent || "#d4af37"}15`, color: theme.accent || "#d4af37" }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          {onLogout && (
            <button type="button" onClick={onLogout}
              className={`w-full flex items-center gap-3 rounded-2xl border text-left text-[13px] font-bold transition-all duration-200 hover:opacity-80
                ${isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
              style={{ borderColor: "rgba(139,26,26,0.2)", color: theme.danger || "#e57373", backgroundColor: theme.dangerBackground || "rgba(139,26,26,0.06)" }}
              title={isCollapsed ? "Sign out" : undefined}>
              <FaSignOutAlt size={14} className="shrink-0" />
              {!isCollapsed && <span>Sign out</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default DashboardSidebar;
