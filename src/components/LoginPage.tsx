import { useState, type FormEvent } from "react";
import { 
  Shield, 
  Lock, 
  User as UserIcon, 
  ChevronRight,
  Cpu,
  Globe
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole } from "../types";
import { authApi } from "../modules/auth/api";

interface LoginPageProps {
  onLogin: (role: UserRole, displayName: string) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsAuthenticating(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      const backendRole = res.user?.Role?.name || (res.user as any)?.role;
      const roleMap: Record<string, UserRole> = {
        super_admin: "SUPER_ADMIN",
        agent: "AGENT",
        shop_owner: "SHOP_OWNER"
      };
      const uiRole = roleMap[backendRole];
      if (!uiRole) {
        throw new Error("Access denied: only super admin, agent, and shop owner can login here");
      }

      localStorage.setItem("accessToken", res.tokens.accessToken);
      if (res.tokens.refreshToken) localStorage.setItem("refreshToken", res.tokens.refreshToken);
      onLogin(uiRole, res.user?.displayName || res.user?.email || "Admin");
    } catch (e: any) {
      setError(e?.message || "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/src/assets/images/cyber_command_login_bg_1777878580135.png" 
          className="w-full h-full object-cover opacity-20 scale-110 blur-sm"
          alt="Security background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#111111]/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-20" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-[0_0_30px_rgba(204,255,0,0.4)] mb-4">
              <Shield className="text-black w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight uppercase italic italic">
              MEZZO<span className="text-brand">BET</span>
            </h1>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-2">Central Node Authentication</p>
          </div>

          <motion.form 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Email Address</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <Input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="operator@mezzobet.io" 
                        className="bg-zinc-900 border-zinc-800 h-12 pl-12 focus-visible:ring-brand rounded-xl text-white" 
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Access Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <Input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className="bg-zinc-900 border-zinc-800 h-12 pl-12 focus-visible:ring-brand rounded-xl text-white" 
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isAuthenticating}
                  className="w-full h-14 bg-brand text-black font-black uppercase tracking-widest rounded-2xl hover:bg-brand-dark transition-all group overflow-hidden relative"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isAuthenticating ? "AUTHENTICATING..." : "BEGIN SEQUENCE"} <ChevronRight className="w-4 h-4" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                </Button>
                {error ? <p className="text-red-400 text-xs normal-case tracking-normal text-center">{error}</p> : null}

                <div className="pt-4 flex justify-between items-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-1">
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
        <div className="mt-8 flex flex-col items-center gap-2">
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
