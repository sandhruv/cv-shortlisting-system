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
      <aside className={`fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "w-[72px]" : "w-[260px]"}`}
        style={{ background: "#0f1729" }}>

        {/* Logo area */}
        <div className="flex items-center justify-between px-5 py-5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-[45px] h-[45px] rounded-xl flex items-center justify-center text-[1.2rem] font-bold text-white shrink-0"
                style={{ backgroundColor: "#0d6e6e" }}>
                VI
              </div>
              <span className="text-[1.1rem] font-bold text-white font-['Montserrat',sans-serif]">Admin Panel</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-[45px] h-[45px] rounded-xl flex items-center justify-center text-[1.2rem] font-bold text-white mx-auto"
              style={{ backgroundColor: "#0d6e6e" }}>
              VI
            </div>
          )}
          {!isCollapsed && (
            <button onClick={onClose}
              className="text-white text-[1.3rem] bg-none border-none cursor-pointer lg:hidden"
              aria-label="Close sidebar">
              ×
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-0">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = activeKey === item.key;
            return (
              <button key={item.key} onClick={() => onSelect(item.key)} title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 border-none cursor-pointer transition-all duration-200 font-['Montserrat',sans-serif]
                  ${isCollapsed ? "justify-center px-2 py-3.5" : "px-5 py-3.5"}
                  ${selected ? "" : "hover:bg-white/5"}`}
                style={{
                  background: selected ? "#0d6e6e" : "transparent",
                  color: selected ? "#fff" : "rgba(255,255,255,0.7)",
                  fontSize: "0.95rem",
                  textAlign: "left",
                }}>
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="px-5 py-4 border-t shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[1rem] font-bold text-white shrink-0"
                  style={{ backgroundColor: "#0d6e6e" }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[0.9rem] font-semibold text-white truncate">{displayName}</div>
                  <div className="text-[0.75rem] text-white/60 capitalize">{displayRole}</div>
                </div>
              </div>
              {onLogout && (
                <button type="button" onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-[0.9rem] text-white/80 cursor-pointer transition-all border-none hover:bg-red-500/20 hover:text-red-400"
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  <FaSignOutAlt size={14} />
                  <span>Logout</span>
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[1rem] font-bold text-white"
                  title={displayName} style={{ backgroundColor: "#0d6e6e" }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
              {onLogout && (
                <button type="button" onClick={onLogout}
                  className="w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-white/80 cursor-pointer transition-all border-none hover:bg-red-500/20 hover:text-red-400"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  title="Sign out">
                  <FaSignOutAlt size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export default DashboardSidebar;
