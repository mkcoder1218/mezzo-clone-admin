import { useState } from "react";
import { 
  Shield, 
  Lock, 
  User as UserIcon, 
  ChevronRight, 
  Fingerprint, 
  Cpu, 
  Globe,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole } from "../types";

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<"input" | "biometric">("input");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setAuthStep("biometric");
    }
  };

  const handleBiometricAuth = () => {
    setIsAuthenticating(true);
    // Simulate network handshake
    setTimeout(() => {
      // For demo purposes, we assign roles based on keywords or default to SUPER_ADMIN
      const role: UserRole = 
        email.toLowerCase().includes("agent") ? "AGENT" : 
        email.toLowerCase().includes("shop") ? "SHOP_OWNER" : 
        "SUPER_ADMIN";
      
      onLogin(role);
      setIsAuthenticating(false);
    }, 2000);
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

          <AnimatePresence mode="wait">
            {authStep === "input" ? (
              <motion.form 
                key="input-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
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
                  className="w-full h-14 bg-brand text-black font-black uppercase tracking-widest rounded-2xl hover:bg-brand-dark transition-all group overflow-hidden relative"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    BEGIN SEQUENCE <ChevronRight className="w-4 h-4" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                </Button>

                <div className="pt-4 flex justify-between items-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3" /> NODE: EU-WEST-01
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" /> VER: 4.8.2-DEV
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="biometric-form"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-4 space-y-8"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white uppercase italic font-display">Biometric Verification</h3>
                  <p className="text-zinc-500 text-xs text-balance">Verify identity for Operator: <span className="text-brand font-mono">{email}</span></p>
                </div>

                <button 
                  onClick={handleBiometricAuth}
                  disabled={isAuthenticating}
                  className={`w-32 h-32 rounded-full border-2 flex items-center justify-center transition-all relative group ${
                    isAuthenticating ? 'border-brand animate-pulse' : 'border-zinc-800 hover:border-brand/50'
                  }`}
                >
                  {isAuthenticating ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-12 h-12 text-brand" />
                    </motion.div>
                  ) : (
                    <>
                      <Fingerprint className="w-12 h-12 text-zinc-500 group-hover:text-brand transition-colors" />
                      <div className="absolute inset-0 rounded-full bg-brand/5 scale-0 group-hover:scale-100 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] animate-pulse">
                    {isAuthenticating ? "Synchronizing Credentials..." : "Place ID component for scan"}
                  </p>
                </div>

                {!isAuthenticating && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setAuthStep("input")}
                    className="text-zinc-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
                  >
                    Return to credentials
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
