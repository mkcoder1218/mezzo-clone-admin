import { 
  Bell, 
  ChevronRight,
  LogOut,
  Menu
} from "lucide-react";
import { UserRole } from "../types";

export const TopNav = ({ currentRole, onLogout, displayName, onOpenSidebar }: {
  currentRole: UserRole, 
  onLogout: () => void,
  displayName: string,
  onOpenSidebar?: () => void
}) => {
  return (
    <header className="h-14 sm:h-20 border-b border-zinc-800/50 bg-[#0A0A0A] px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-50">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="mr-2 p-2 text-zinc-400 hover:text-white lg:hidden"
        title="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden md:flex items-center text-zinc-500 text-[10px] font-extrabold uppercase tracking-widest gap-2">
           <span>Central Command</span>
           <ChevronRight className="w-4 h-4 text-zinc-700" />
           <span className="text-brand">
             {window.location.pathname === "/" ? "Status" : window.location.pathname.substring(1)}
           </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-6 ml-auto">
        <div className="hidden sm:block h-8 w-[1px] bg-zinc-800" />

        <button className="p-2 text-zinc-400 hover:text-brand transition-colors relative group">
          <Bell className="w-5 h-5 group-hover:animate-shake" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0A0A0A]"></span>
        </button>

        <button 
          onClick={onLogout}
          className="p-2 text-zinc-400 hover:text-rose-500 transition-colors group"
          title="Terminate Session"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white uppercase tracking-tight italic">{displayName}</p>
            <p className="text-[10px] text-emerald-500 font-mono">{currentRole.replace("_", " ")}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-zinc-900 border border-zinc-800 text-brand font-black flex items-center justify-center hover:border-brand transition-all cursor-pointer">
            MZ
          </div>
        </div>
      </div>
    </header>
  );
};
