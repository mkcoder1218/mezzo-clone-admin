import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Receipt, 
  ListChecks,
  CheckCircle2,
  Shield, 
  Settings, 
  Database,
  Power,
  Bug,
  Wrench,
  Wallet,
  User as UserIcon,
  Target,
  TrendingUp,
  ChevronDown,
  LogOut,
  X
} from "lucide-react";
import { UserRole } from "../types";
import { useMemo, useState } from "react";

export const Sidebar = ({
  currentRole,
  onLogout,
  displayName,
  permissions,
  isOpen,
  onClose,
}: {
  currentRole: UserRole,
  onLogout: () => void,
  displayName?: string,
  permissions?: string[],
  isOpen?: boolean,
  onClose?: () => void,
}) => {
  const location = useLocation();
  const [oddsExpanded, setOddsExpanded] = useState(true);
  const [opsExpanded, setOpsExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const hasPermission = (key: string) => (permissions || []).includes(key);
  
  const topItems = [
    { name: "Analytics", path: "/", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "SUPER_AGENT", "AGENT", "SHOP_OWNER"] },
    { name: "Users", path: "/users", icon: Users, roles: ["SUPER_ADMIN", "AGENT", "SHOP_OWNER"] },
    { name: "Agents", path: "/agents", icon: Shield, roles: ["SUPER_ADMIN", "SUPER_AGENT"] },
    { name: "Staff", path: "/staff", icon: Users, roles: ["SUPER_AGENT", "AGENT", "SHOP_OWNER"] },
    { name: "Cashflow", path: "/cashflow", icon: TrendingUp, roles: ["SUPER_ADMIN", "SUPER_AGENT", "AGENT"] },
    { name: "Shops", path: "/shops", icon: Store, roles: ["SUPER_ADMIN", "AGENT"] },
    { name: "Limits", path: "/limits", icon: Wallet, roles: ["SUPER_ADMIN", "SUPER_AGENT", "AGENT", "SHOP_OWNER"] },
  ];

  const filteredTopItems = topItems.filter(item => item.roles.includes(currentRole));

  const oddsItems = useMemo(
    () =>
      [
        { name: "Data Fetch", path: "/data-fetching", icon: Database, roles: ["SUPER_ADMIN"] },
        { name: "Workers", path: "/workers", icon: Power, roles: ["SUPER_ADMIN"] },
        { name: "Odds Settings", path: "/odds-management/settings", icon: Target, roles: ["SUPER_ADMIN"] },
        { name: "APIfootball Leagues", path: "/odds-management/apifootball-leagues", icon: ListChecks, roles: ["SUPER_ADMIN"] },
        { name: "Mezzo League Mapping", path: "/odds-management/mezzo-league-mapping", icon: ListChecks, roles: ["SUPER_ADMIN"] },
        { name: "APIfootball Fixtures", path: "/odds-management/apifootball-fixtures", icon: Database, roles: ["SUPER_ADMIN"] },
        { name: "Odds Debug", path: "/odds-debug", icon: Bug, roles: ["SUPER_ADMIN"] },
      ].filter((i) => i.roles.includes(currentRole)),
    [currentRole]
  );

  const oddsActive = oddsItems.some((i) => location.pathname === i.path || location.pathname.startsWith(i.path + "/"));

  const opsItems = useMemo(
    () =>
      currentRole === "SUPER_ADMIN"
        ? [
        { name: "Bets", path: "/bets", icon: Receipt, roles: ["SUPER_ADMIN"] },
        { name: "Bet Queue", path: "/bet-queue", icon: Receipt, roles: ["SUPER_ADMIN"] },
        { name: "Redeem", path: "/redeem", icon: CheckCircle2, roles: ["SUPER_ADMIN"] },
        { name: "Results", path: "/results", icon: ListChecks, roles: ["SUPER_ADMIN"] },
        { name: "Results Run Now", path: "/results-run-now", icon: ListChecks, roles: ["SUPER_ADMIN"] },
        { name: "Unsettled Slips", path: "/results-unsettled", icon: Bug, roles: ["SUPER_ADMIN"] },
        { name: "Unsettled Markets", path: "/results-unsettled-markets", icon: Bug, roles: ["SUPER_ADMIN"] },
        { name: "Results Diagnostics", path: "/results-diagnostics", icon: Bug, roles: ["SUPER_ADMIN"] },
        { name: "APIfootball Events", path: "/apifootball-events", icon: ListChecks, roles: ["SUPER_ADMIN"] },
        { name: "Unmapped Fixtures", path: "/unmapped-fixtures", icon: Database, roles: ["SUPER_ADMIN"] },
        { name: "Mapped Fixtures", path: "/mapped-fixtures", icon: Database, roles: ["SUPER_ADMIN"] },
        { name: "Reports", path: "/reports", icon: LayoutDashboard, roles: ["SUPER_ADMIN"] },
      ].filter((i) => i.roles.includes(currentRole))
        : [],
    [currentRole]
  );
  const opsActive = opsItems.some((i) => location.pathname === i.path || location.pathname.startsWith(i.path + "/"));

  const adminItems = useMemo(
    () =>
      [
        { name: "Banners", path: "/banners", icon: Target, roles: ["SUPER_ADMIN"] },
        ...(hasPermission("cashback.view") ? [{ name: "Cashback Bonus", path: "/cashback", icon: Target, roles: ["SUPER_ADMIN"] }] : []),
        { name: "Cashback Config", path: "/cashback-config", icon: Target, roles: ["SUPER_ADMIN"] },
        { name: "Settlement Config", path: "/settlement-config", icon: Target, roles: ["SUPER_ADMIN"] },
        { name: "Roles", path: "/roles", icon: Settings, roles: ["SUPER_ADMIN"] },
        { name: "Settings", path: "/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
        { name: "Debug Tools", path: "/debug-tools", icon: Wrench, roles: ["SUPER_ADMIN"] },
      ].filter((i) => i.roles.includes(currentRole)),
    [currentRole, permissions]
  );
  const adminActive = adminItems.some((i) => location.pathname === i.path || location.pathname.startsWith(i.path + "/"));

  return (
    <div
      className={`fixed inset-y-0 left-0 w-64 bg-[#0A0A0A] border-r border-zinc-800 flex flex-col h-screen shrink-0 shadow-xl z-[70] transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-6 shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center shadow-[0_0_15px_rgba(163,230,53,0.3)]">
            <Target className="text-black w-5 h-5" />
          </div>
          <span className="text-xl font-bold font-sans tracking-tight text-white italic">
            KINGS<span className="text-lime-400">BET</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2 text-zinc-400 hover:text-white lg:hidden"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          {filteredTopItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-lime-400 text-black font-bold shadow-[0_0_20px_rgba(163,230,53,0.2)]" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {opsItems.length ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setOpsExpanded((v) => !v)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  opsActive ? "bg-lime-400/10 text-lime-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <Receipt className="w-5 h-5" />
                <span className="flex-1 text-left font-bold">Operations</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${opsExpanded ? "rotate-180" : ""}`} />
              </button>

              {opsExpanded ? (
                <div className="mt-1 ml-3 pl-3 border-l border-zinc-800/70 space-y-1">
                  {opsItems.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive ? "bg-lime-400 text-black font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-[13px]">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {oddsItems.length ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setOddsExpanded((v) => !v)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  oddsActive ? "bg-lime-400/10 text-lime-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <Target className="w-5 h-5" />
                <span className="flex-1 text-left font-bold">Odds</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${oddsExpanded ? "rotate-180" : ""}`} />
              </button>

              {oddsExpanded ? (
                <div className="mt-1 ml-3 pl-3 border-l border-zinc-800/70 space-y-1">
                  {oddsItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive ? "bg-lime-400 text-black font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-[13px]">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {adminItems.length ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAdminExpanded((v) => !v)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  adminActive ? "bg-lime-400/10 text-lime-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="flex-1 text-left font-bold">Admin</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${adminExpanded ? "rotate-180" : ""}`} />
              </button>

              {adminExpanded ? (
                <div className="mt-1 ml-3 pl-3 border-l border-zinc-800/70 space-y-1">
                  {adminItems.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive ? "bg-lime-400 text-black font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-[13px]">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
      </nav>

      <div className="mt-auto p-4 shrink-0 space-y-4 border-t border-zinc-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-rose-500 hover:bg-rose-500/5 transition-all duration-200 group font-bold text-xs uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>TERMINATE</span>
        </button>

        <div className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-3 border border-zinc-800 group cursor-pointer hover:border-zinc-700 transition-all">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:border-lime-400 transition-colors">
            <UserIcon className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName || "operator"}</p>
            <p className="text-[10px] text-zinc-500 truncate uppercase font-bold tracking-wider italic">{currentRole.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
