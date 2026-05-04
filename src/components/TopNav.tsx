import { 
  Shield, 
  Bell, 
  ChevronRight,
  Target
} from "lucide-react";
import { UserRole } from "../types";

export const TopNav = ({ currentRole, setCurrentRole }: { 
  currentRole: UserRole, 
  setCurrentRole: (r: UserRole) => void 
}) => {
  return (
    <header className="h-20 border-b border-zinc-800/50 bg-[#0A0A0A] px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="hidden md:flex items-center text-zinc-500 text-[10px] font-extrabold uppercase tracking-widest gap-2">
           <span>Central Command</span>
           <ChevronRight className="w-4 h-4 text-zinc-700" />
           <span className="text-brand">
             {window.location.pathname === "/" ? "Status" : window.location.pathname.substring(1)}
           </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Role Switcher (Simulator) */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 hover:border-zinc-700 transition-all group">
           <Shield className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Identity Simulation</span>
              <select 
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-transparent border-none text-xs font-bold text-white outline-none focus:ring-0 cursor-pointer p-0 h-4 leading-none"
              >
                <option value="SUPER_ADMIN" className="bg-zinc-900">Super Admin</option>
                <option value="AGENT" className="bg-zinc-900">Network Agent</option>
                <option value="SHOP_OWNER" className="bg-zinc-900">Shop Manager</option>
              </select>
           </div>
        </div>

        <div className="h-8 w-[1px] bg-zinc-800" />

        <button className="p-2 text-zinc-400 hover:text-brand transition-colors relative group">
          <Bell className="w-5 h-5 group-hover:animate-shake" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0A0A0A]"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white uppercase tracking-tight italic">Root Access</p>
            <p className="text-[10px] text-emerald-500 font-mono">ID: SEC-ROOT-01</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-brand font-black flex items-center justify-center hover:border-brand transition-all cursor-pointer">
            MZ
          </div>
        </div>
      </div>
    </header>
  );
};
