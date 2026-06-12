/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
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
import { UserHierarchyPage } from "./components/UserHierarchyPage";
import { BetManagementPage } from "./components/BetManagement";
import { RedeemTicketsPage } from "./components/RedeemTicketsPage";
import { CashbackConfigPage } from "./components/CashbackConfigPage";
import { CashbackBonusDashboardPage } from "./components/CashbackBonusDashboardPage";
import { CashbackBonusConfigurationsPage } from "./components/CashbackBonusConfigurationsPage";
import { CashbackBonusHistoryPage } from "./components/CashbackBonusHistoryPage";
import { SettlementConfigPage } from "./components/SettlementConfigPage";
import { ResultsRunNowPage } from "./components/ResultsRunNowPage";
import { ResultsDiagnosticsPage } from "./components/ResultsDiagnosticsPage";
import { ApiFootballEventsLookupPage } from "./components/ApiFootballEventsLookupPage";
import { ResultsUnsettledPage } from "./components/ResultsUnsettledPage";
import { UnsettledMarketsPage } from "./components/UnsettledMarketsPage";
import { ManualSettlementPage } from "./components/ManualSettlementPage";
import { UnmappedFixturesPage } from "./components/UnmappedFixturesPage";
import { MappedFixturesPage } from "./components/MappedFixturesPage";
import { ShopManagementPage } from "./components/ShopManagement";
import { AgentsPage } from "./components/AgentsPage";
import { RolesPage } from "./components/RolesPage";
import { LimitsPage } from "./components/LimitsPage";
import { StaffPage } from "./components/StaffPage";
import { CashflowPage } from "./components/CashflowPage";
import { ResultsPage } from "./components/ResultsPage";
import { ReportsPage } from "./components/ReportsPage";
import { SettingsPage } from "./components/SettingsPage";
import { BannersPage } from "./components/BannersPage";
import { BetQueuePage } from "./components/BetQueuePage";
import { DataFetchingPage } from "./modules/data-fetching/DataFetchingPage";
import { WorkersPage } from "./modules/workers/WorkersPage";
import { OddsDebugPage } from "./modules/odds-debug/OddsDebugPage";
import { DebugToolsPage } from "./modules/debug-tools/DebugToolsPage";
import { OddsSettingsPage } from "./modules/odds-management/OddsSettingsPage";
import { ApiFootballLeaguesPage } from "./modules/odds-management/ApiFootballLeaguesPage";
import { ApiFootballFixturesPage } from "./modules/odds-management/ApiFootballFixturesPage";
import { ApiFootballFixtureDetailPage } from "./modules/odds-management/ApiFootballFixtureDetailPage";
import { MezzoLeagueMappingPage } from "./modules/odds-management/MezzoLeagueMappingPage";
import { TheStatsApiPage } from "./modules/thestatsapi/TheStatsApiPage";
import { ProviderMatchingPage } from "./modules/provider-matching/ProviderMatchingPage";
import { Button } from "@/components/ui/button";
import { authApi } from "./modules/auth/api";

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>("SUPER_ADMIN");
  const [displayName, setDisplayName] = useState("Operator");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        const perms = Array.isArray(me.user?.Role?.Permissions) ? me.user.Role.Permissions.map((p) => p.key).filter(Boolean) : [];

        const roleMap: Record<string, UserRole> = {
          super_admin: "SUPER_ADMIN",
          super_agent: "SUPER_AGENT",
          agent: "AGENT",
          shop_owner: "SHOP_OWNER"
        };

        const uiRole = backendRole ? roleMap[backendRole] : undefined;
        if (!uiRole) {
          // Token exists but not allowed for admin.
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("kingsbet_session");
          setIsAuthenticated(false);
          setBooting(false);
          return;
        }

        setIsAuthenticated(true);
        setCurrentRole(uiRole);
        setPermissions(perms);
        setDisplayName(me.user.displayName || me.user.email || "Operator");
        localStorage.setItem("kingsbet_session", JSON.stringify({ role: uiRole, displayName: me.user.displayName || me.user.email || "Operator", permissions: perms }));
      } catch {
        // Invalid token or API not reachable
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("kingsbet_session");
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
    localStorage.setItem("kingsbet_session", JSON.stringify({ role, displayName: name }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setDisplayName("Operator");
    setPermissions([]);
    setSidebarOpen(false);
    localStorage.removeItem("kingsbet_session");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const hasPermission = (key: string) => permissions.includes(key);

  if (booting) {
    return <div className="min-h-screen bg-[#0A0A0A] text-zinc-400 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-[#0A0A0A] selection:bg-brand selection:text-black">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] lg:hidden"
          />
        ) : null}

        <Sidebar
          currentRole={currentRole}
          onLogout={handleLogout}
          displayName={displayName}
          permissions={permissions}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 flex flex-col min-w-0">
          <TopNav
            currentRole={currentRole}
            onLogout={handleLogout}
            displayName={displayName}
            onOpenSidebar={() => setSidebarOpen(true)}
          />

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8 xl:p-12 max-w-7xl mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={window.location.hash + currentRole}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Routes>
                    <Route path="/" element={<DashboardPage role={currentRole} />} />
                    <Route path="/users" element={<UserHierarchyPage role={currentRole} />} />
                    <Route path="/shops" element={<ShopManagementPage role={currentRole} />} />
                    <Route
                      path="/staff"
                      element={
                        currentRole === "SUPER_ADMIN" || currentRole === "SUPER_AGENT" || currentRole === "AGENT" || currentRole === "SHOP_OWNER" ? (
                          <StaffPage role={currentRole} />
                        ) : (
                          <div className="p-8 text-zinc-400">Forbidden.</div>
                        )
                      }
                    />
                    <Route path="/bets" element={<BetManagementPage role={currentRole} />} />
                    <Route path="/bet-queue" element={<BetQueuePage />} />
                    <Route path="/redeem" element={<RedeemTicketsPage />} />
                    <Route path="/cashback-config" element={<CashbackConfigPage />} />
                    <Route path="/cashback" element={currentRole === "SUPER_ADMIN" && hasPermission("cashback.view") ? <CashbackBonusDashboardPage /> : <div className="p-8 text-zinc-400">Forbidden.</div>} />
                    <Route path="/cashback/configurations" element={currentRole === "SUPER_ADMIN" && hasPermission("cashback.view") ? <CashbackBonusConfigurationsPage canManage={hasPermission("cashback.manage")} /> : <div className="p-8 text-zinc-400">Forbidden.</div>} />
                    <Route path="/cashback/history" element={currentRole === "SUPER_ADMIN" && hasPermission("cashback.view") ? <CashbackBonusHistoryPage canRetry={hasPermission("cashback.retry")} /> : <div className="p-8 text-zinc-400">Forbidden.</div>} />
                    <Route path="/settlement-config" element={<SettlementConfigPage />} />
                    <Route path="/results-run-now" element={<ResultsRunNowPage />} />
                    <Route path="/results-unsettled" element={<ResultsUnsettledPage />} />
                    <Route path="/results-unsettled-markets" element={<UnsettledMarketsPage />} />
                    <Route path="/manual-settlement" element={currentRole === "SUPER_ADMIN" ? <ManualSettlementPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>} />
                    <Route path="/results-diagnostics" element={<ResultsDiagnosticsPage />} />
                    <Route path="/apifootball-events" element={<ApiFootballEventsLookupPage />} />
                    <Route path="/results" element={<ResultsPage />} />
                    <Route
                      path="/reports"
                      element={
                        currentRole === "SUPER_ADMIN" || currentRole === "SUPER_AGENT" || currentRole === "AGENT" || currentRole === "SHOP_OWNER" ? (
                          <ReportsPage />
                        ) : (
                          <div className="p-8 text-zinc-400">Forbidden.</div>
                        )
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        currentRole === "SUPER_ADMIN" ? <SettingsPage /> : <div className="p-8 text-zinc-400">Forbidden.</div>
                      }
                    />
                    <Route
                      path="/banners"
                      element={
                        currentRole === "SUPER_ADMIN" ? <BannersPage /> : <div className="p-8 text-zinc-400">Forbidden.</div>
                      }
                    />
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
                    <Route
                      path="/money-made"
                      element={
                        currentRole === "SUPER_ADMIN" || currentRole === "SUPER_AGENT" || currentRole === "AGENT" || currentRole === "SHOP_OWNER" ? (
                          <ReportsPage defaultTab="money" />
                        ) : (
                          <div className="p-8 text-zinc-400">Forbidden.</div>
                        )
                      }
                    />
                    <Route
                      path="/workers"
                      element={
                        currentRole === "SUPER_ADMIN" ? <WorkersPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    <Route
                      path="/debug-tools/*"
                      element={
                        currentRole === "SUPER_ADMIN" ? <DebugToolsPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    <Route
                      path="/odds-debug/*"
                      element={
                        currentRole === "SUPER_ADMIN" ? <OddsDebugPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    <Route
                      path="/odds-management/apifootball-leagues"
                      element={
                        currentRole === "SUPER_ADMIN" ? <ApiFootballLeaguesPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    <Route
                      path="/odds-management/apifootball-fixtures"
                      element={
                        currentRole === "SUPER_ADMIN" ? <ApiFootballFixturesPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    <Route
                      path="/odds-management/apifootball-fixtures/:id"
                      element={
                        currentRole === "SUPER_ADMIN" ? <ApiFootballFixtureDetailPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    <Route
                      path="/odds-management/settings"
                      element={
                        currentRole === "SUPER_ADMIN" ? <OddsSettingsPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    <Route
                      path="/odds-management/mezzo-league-mapping"
                      element={
                        currentRole === "SUPER_ADMIN" ? <MezzoLeagueMappingPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    <Route
                      path="/providers/thestatsapi"
                      element={
                        currentRole === "SUPER_ADMIN" ? <TheStatsApiPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    <Route
                      path="/provider-matching"
                      element={
                        currentRole === "SUPER_ADMIN" ? <ProviderMatchingPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>
                      }
                    />
                    
                    <Route
                      path="/agents"
                      element={
                        currentRole === "SUPER_ADMIN" || currentRole === "SUPER_AGENT" ? (
                          <AgentsPage role={currentRole} />
                        ) : (
                          <div className="p-8 text-zinc-400">Forbidden.</div>
                        )
                      }
                    />

                    <Route
                      path="/cashflow"
                      element={
                        currentRole === "SUPER_ADMIN" || currentRole === "SUPER_AGENT" || currentRole === "AGENT" ? (
                          <CashflowPage role={currentRole} />
                        ) : (
                          <div className="p-8 text-zinc-400">Forbidden.</div>
                        )
                      }
                    />

                    <Route
                      path="/unmapped-fixtures"
                      element={currentRole === "SUPER_ADMIN" ? <UnmappedFixturesPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>}
                    />
                    <Route
                      path="/mapped-fixtures"
                      element={currentRole === "SUPER_ADMIN" ? <MappedFixturesPage /> : <div className="p-8 text-zinc-400">Forbidden: super admin only.</div>}
                    />

                    <Route
                      path="/roles"
                      element={
                        currentRole === "SUPER_ADMIN" ? <RolesPage /> : <div className="p-8 text-zinc-400">Forbidden.</div>
                      }
                    />

                    <Route
                      path="/limits"
                      element={
                        currentRole === "SUPER_ADMIN" || currentRole === "SUPER_AGENT" || currentRole === "AGENT" || currentRole === "SHOP_OWNER" ? (
                          <LimitsPage role={currentRole} />
                        ) : (
                          <div className="p-8 text-zinc-400">Forbidden.</div>
                        )
                      }
                    />

                    <Route
                      path="/staff"
                      element={
                        currentRole === "SUPER_AGENT" || currentRole === "AGENT" || currentRole === "SHOP_OWNER" ? (
                          <StaffPage role={currentRole} />
                        ) : (
                          <div className="p-8 text-zinc-400">Forbidden.</div>
                        )
                      }
                    />

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
