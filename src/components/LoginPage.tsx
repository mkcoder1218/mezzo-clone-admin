import { useState, type FormEvent } from "react";
import { 
  Shield, 
  Lock, 
  User,
  ChevronRight,
  Cpu,
  Globe
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { UserRole } from "../types";
import { authApi } from "../modules/auth/api";

interface LoginPageProps {
  onLogin: (role: UserRole, displayName: string) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setIsAuthenticating(true);
    setError(null);
    try {
      const id = identifier.trim();
      const res = await authApi.login(id.includes("@") ? { email: id, password } : { phoneNumber: id, password });
      const backendRole = res.user?.Role?.name || (res.user as any)?.role;
      const roleMap: Record<string, UserRole> = {
        super_admin: "SUPER_ADMIN",
        super_agent: "SUPER_AGENT",
        agent: "AGENT",
        shop_owner: "SHOP_OWNER"
      };
      const uiRole = roleMap[backendRole];
      if (!uiRole) {
        throw new Error("Access denied: insufficient permissions");
      }

      localStorage.setItem("accessToken", res.tokens.accessToken);
      if (res.tokens.refreshToken) localStorage.setItem("refreshToken", res.tokens.refreshToken);
      onLogin(uiRole, res.user?.displayName || identifier || "Admin");
    } catch (e: any) {
      setError(e?.message || "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#050505] flex items-center justify-center px-3 py-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ccff00]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ccff00]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-10" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#111111]/80 backdrop-blur-xl border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-20" />
          
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand flex items-center justify-center shadow-[0_0_30px_rgba(204,255,0,0.4)] mb-3 sm:mb-4">
              <Shield className="text-black w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight uppercase italic text-center">
              KINGS<span className="text-brand">BET</span>
            </h1>
            <p className="text-zinc-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.16em] sm:tracking-[0.2em] mt-2 text-center">Node Admin Authentication</p>
          </div>

          <motion.form 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit}
            className="space-y-5 sm:space-y-6"
          >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Email or Phone Number</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input 
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter your credential" 
                        className="w-full bg-zinc-900 border border-zinc-800 h-11 sm:h-12 pl-12 pr-4 focus:outline-none focus:border-brand rounded-xl text-white font-bold transition-all" 
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Access Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className="w-full bg-zinc-900 border border-zinc-800 h-11 sm:h-12 pl-12 pr-4 focus:outline-none focus:border-brand rounded-xl text-white font-bold transition-all" 
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isAuthenticating}
                  className="w-full h-12 sm:h-14 bg-brand text-black font-black uppercase tracking-widest rounded-xl sm:rounded-2xl hover:bg-brand-dark transition-all group overflow-hidden relative shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isAuthenticating ? "AUTHENTICATING..." : "BEGIN SEQUENCE"} <ChevronRight className="w-4 h-4" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                </Button>
                {error ? <p className="text-red-400 text-xs normal-case tracking-normal text-center">{error}</p> : null}

                <div className="pt-2 sm:pt-4 flex justify-between items-center text-[8px] sm:text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-1 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3" /> NODE: EU-WEST-01
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" /> VER: 4.8.2-DEV
                  </div>
                </div>
          </motion.form>
        </div>

        {/* Footer info */}
        <div className="mt-4 sm:mt-8 flex flex-col items-center gap-2">
          <div className="flex gap-4">
             <div className="w-1.5 h-1.5 rounded-full bg-brand" />
             <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
             <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
          </div>
          <p className="text-zinc-700 text-[8px] uppercase font-mono tracking-tighter">
            ENCRYPTION: AES-256 GCM • PROTOCOL: SECURE-SYNC-V4
          </p>
        </div>
      </motion.div>
    </div>
  );
};
