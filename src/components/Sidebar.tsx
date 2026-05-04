import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Receipt, 
  Shield, 
  Settings, 
  Database,
  User as UserIcon,
  Target
} from "lucide-react";
import { UserRole } from "../types";

export const Sidebar = ({ currentRole }: { currentRole: UserRole }) => {
  const location = useLocation();
  
  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "AGENT", "SHOP_OWNER"] },
    { name: "Users", path: "/users", icon: Users, roles: ["SUPER_ADMIN", "AGENT", "SHOP_OWNER"] },
    { name: "Agents", path: "/agents", icon: Shield, roles: ["SUPER_ADMIN"] },
    { name: "Shops", path: "/shops", icon: Store, roles: ["SUPER_ADMIN", "AGENT"] },
    { name: "Bets", path: "/bets", icon: Receipt, roles: ["SUPER_ADMIN", "AGENT", "SHOP_OWNER"] },
    { name: "Reports", path: "/reports", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "AGENT"] }, // Using LayoutDashboard as placeholder icon
    { name: "Data Fetch", path: "/data-fetching", icon: Database, roles: ["SUPER_ADMIN"] },
    { name: "Settings", path: "/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-zinc-800/50 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.3)]">
            <Target className="text-black w-5 h-5" />
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-white italic">
            MEZZO<span className="text-brand">BET</span>
          </span>
        </div>

        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-brand text-black font-bold shadow-[0_0_20px_rgba(204,255,0,0.2)]" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-800/50">
        <div className="bg-zinc-900/50 rounded-2xl p-4 flex items-center gap-3 border border-zinc-800/50 group cursor-pointer hover:border-zinc-700 transition-all">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:border-brand transition-colors">
            <UserIcon className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate lowercase">codemk1218</p>
            <p className="text-[10px] text-zinc-500 truncate uppercase font-bold tracking-wider italic">{currentRole.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
