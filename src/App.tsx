/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { 
  Shield, 
  Activity,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserRole
} from "./types";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { LoginPage } from "./components/LoginPage";
import { DashboardPage } from "./components/Dashboard";
import { UserManagementPage } from "./components/UserManagement";
import { BetManagementPage } from "./components/BetManagement";
import { ShopManagementPage } from "./components/ShopManagement";
import { DataFetchingPage } from "./modules/data-fetching/DataFetchingPage";
import { Button } from "@/components/ui/button";
import { authApi } from "./modules/auth/api";

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>("SUPER_ADMIN");
  const [displayName, setDisplayName] = useState("Operator");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setBooting(false);
        return;
      }

      try {
        const me = await authApi.me();
        const backendRole = me.user?.Role?.name;

        const roleMap: Record<string, UserRole> = {
          super_admin: "SUPER_ADMIN",
          agent: "AGENT",
          shop_owner: "SHOP_OWNER"
        };

        const uiRole = backendRole ? roleMap[backendRole] : undefined;
        if (!uiRole) {
          // Token exists but not allowed for admin.
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("mezzobet_session");
          setIsAuthenticated(false);
          setBooting(false);
          return;
        }

        setIsAuthenticated(true);
        setCurrentRole(uiRole);
        setDisplayName(me.user.displayName || me.user.email || "Operator");
        localStorage.setItem("mezzobet_session", JSON.stringify({ role: uiRole, displayName: me.user.displayName || me.user.email || "Operator" }));
      } catch {
        // Invalid token or API not reachable
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("mezzobet_session");
        setIsAuthenticated(false);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const handleLogin = (role: UserRole, name: string) => {
    setIsAuthenticated(true);
    setCurrentRole(role);
    setDisplayName(name);
    localStorage.setItem("mezzobet_session", JSON.stringify({ role, displayName: name }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setDisplayName("Operator");
    localStorage.removeItem("mezzobet_session");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  if (booting) {
    return <div className="min-h-screen bg-[#0A0A0A] text-zinc-400 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-[#0A0A0A] selection:bg-brand selection:text-black">
        <Sidebar currentRole={currentRole} onLogout={handleLogout} displayName={displayName} />
        
        <main className="flex-1 flex flex-col min-w-0">
          <TopNav currentRole={currentRole} onLogout={handleLogout} displayName={displayName} />

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={window.location.pathname + currentRole}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Routes>
                    <Route path="/" element={<DashboardPage role={currentRole} />} />
                    <Route path="/users" element={<UserManagementPage role={currentRole} />} />
                    <Route path="/shops" element={<ShopManagementPage role={currentRole} />} />
                    <Route path="/bets" element={<BetManagementPage role={currentRole} />} />
                    <Route
                      path="/data-fetching"
                      element={
                        currentRole === "SUPER_ADMIN" ? (
                          <DataFetchingPage />
                        ) : (
                          <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                        )
                      }
                    />
                    
                    {/* Placeholder Views */}
                    <Route path="/agents" element={
                      <div className="flex flex-col items-center justify-center p-20 text-center bg-[#1A1A1A] rounded-3xl border border-zinc-800/50 shadow-2xl">
                          <Shield className="w-20 h-20 text-brand/30 mb-8 animate-pulse" />
                          <h2 className="text-3xl font-display font-bold text-white mb-4 uppercase italic">Agent <span className="text-brand">Protocol</span></h2>
                          <p className="text-zinc-500 max-w-lg text-lg">Detailed agent level hierarchical management is currently being migrated to the new core engine. Please use the User Registry to manage agent accounts.</p>
                          <Button className="mt-10 bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 rounded-xl px-10 h-14 font-bold uppercase tracking-widest text-xs">VIEW SYSTEM STATUS</Button>
                      </div>
                    } />

                    <Route path="*" element={
                      <div className="flex flex-col items-center justify-center p-32 text-center">
                          <Activity className="w-16 h-16 text-zinc-800 mb-8" />
                          <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter italic font-display italic">Endpoint Pending</h2>
                          <p className="text-zinc-600 max-w-md">The requested module simulation is currently locked under current protocol restrictions.</p>
                          <Link to="/" className="mt-10">
                             <Button className="bg-brand text-black font-extrabold px-10 h-14 rounded-full shadow-lg hover:scale-105 transition-transform uppercase italic">INITIALIZE HOME</Button>
                          </Link>
                      </div>
                    } />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
}
