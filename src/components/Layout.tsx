import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "仪表盘", icon: "📊" },
  { to: "/schemes", label: "方案管理", icon: "📦" },
  { to: "/backups", label: "备份管理", icon: "💾" },
  { to: "/settings", label: "设置", icon: "⚙️" },
];

export function Layout() {
  return (
    <div className="flex h-full">
      <nav className="w-52 bg-slate-800 text-slate-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white">Rime Updater</h1>
          <p className="text-xs text-slate-400 mt-1">输入法方案管理工具</p>
        </div>
        <ul className="flex-1 py-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-slate-700 hover:text-white"
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
          v0.1.0
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
