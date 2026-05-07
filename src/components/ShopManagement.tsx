import { useMemo, useState } from "react";
import { 
  Store, 
  MapPin, 
  Users, 
  Activity, 
  Search, 
  Plus, 
  ShieldCheck,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Globe
} from "lucide-react";
import { 
  Shop, 
  UserRole, 
  MOCK_SHOPS,
  MOCK_USERS
} from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Modular Sub-components ---

const ShopCard = ({ shop }: { shop: Shop }) => (
  <Card key={shop.id} className="bg-[#1A1A1A] border-none shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Store className="w-20 h-20 text-brand" />
    </div>
    <CardHeader className="pb-4">
      <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2">
               <Store className="text-zinc-400 w-6 h-6" />
          </div>
          <Badge variant="outline" className={`uppercase text-[10px] tracking-widest font-bold ${shop.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            {shop.status === 'active' ? 'Online' : 'Offline'}
          </Badge>
      </div>
      <CardTitle className="text-xl font-bold text-white group-hover:text-brand transition-colors">{shop.name}</CardTitle>
      <CardDescription className="flex items-center gap-1.5 text-zinc-500 italic">
          <MapPin className="w-3 h-3" /> Node #{shop.id.split('_')[1] || shop.id}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
       <div className="grid grid-cols-2 gap-4">
           <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Credit Limit</p>
               <p className="text-lg font-bold text-white">${shop.creditLimit.toLocaleString()}</p>
           </div>
           <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Used Credit</p>
               <p className="text-lg font-bold text-white">${shop.usedCredit.toLocaleString()}</p>
           </div>
       </div>

       <div className="space-y-2">
         <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
            <span>Limit Utilization</span>
            <span className="text-brand">
                {Math.round((shop.usedCredit / shop.creditLimit) * 100)}%
            </span>
         </div>
         <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
            <div 
                className="h-full bg-brand shadow-[0_0_8px_rgba(204,255,0,0.4)] transition-all duration-1000" 
                style={{ width: `${(shop.usedCredit / shop.creditLimit) * 100}%` }}
            />
         </div>
       </div>

       <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/50 pt-4">
           <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-brand" />
               <span>Assigned to Agent#{shop.agentId.substring(1)}</span>
           </div>
           <Button variant="ghost" size="sm" className="text-[10px] font-bold hover:text-white uppercase transition-all">Manage Node</Button>
       </div>
    </CardContent>
  </Card>
);

const RegionalDistribution = () => (
  <Card className="bg-[#1A1A1A] border-none shadow-2xl">
      <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand" />
            Regional Distribution
          </CardTitle>
          <CardDescription>Network nodes by geographical location</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="space-y-6">
              {[
                { region: "Lagos Mainland", count: 42, volume: "$125k" },
                { region: "Lagos Island", count: 28, volume: "$240k" },
                { region: "Abuja Central", count: 15, volume: "$95k" },
                { region: "Port Harcourt", count: 12, volume: "$72k" },
              ].map((reg, i) => (
                <div key={i} className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50">
                    <div className="flex items-center gap-4">
                        <MapPin className="text-zinc-600 w-5 h-5" />
                        <div>
                            <span className="text-sm font-bold text-white block">{reg.region}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{reg.count} Active Nodes</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-bold text-brand">{reg.volume}</span>
                        <TrendingUp className="w-4 h-4 text-emerald-500 inline ml-2 scale-75" />
                    </div>
                </div>
              ))}
          </div>
      </CardContent>
  </Card>
);

const HardwareMonitor = () => (
  <Card className="bg-[#1A1A1A] border-none shadow-2xl">
      <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Hardware Monitor
          </CardTitle>
          <CardDescription>Terminal health and connectivity logs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/20 transition-all">
                <Activity className="text-emerald-500 w-5 h-5 shrink-0" />
                <div className="flex-1">
                    <p className="text-xs font-bold text-white">Terminal #{4000+i} Restored</p>
                    <p className="text-[10px] text-zinc-500 italic">Central Gateway synchronization complete.</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-600 uppercase">12:15 PM</span>
            </div>
          ))}
          <Button variant="outline" className="w-full border-zinc-800 text-zinc-500 hover:text-white rounded-xl h-12">
              View System Logs
          </Button>
      </CardContent>
  </Card>
);

// --- Main Page ---

export const ShopManagementPage = ({ role }: { role: UserRole }) => {
  const [shops] = useState<Shop[]>(MOCK_SHOPS);
  const CURRENT_USER_ID = role === "SUPER_ADMIN" ? "u1" : role === "AGENT" ? "a1" : "s1";
  
  const filteredShops = useMemo(() => {
    if (role === "SUPER_ADMIN") return shops;
    if (role === "AGENT") return shops.filter(s => s.agentId === CURRENT_USER_ID);
    if (role === "SHOP_OWNER") return shops.filter(s => s.ownerId === CURRENT_USER_ID);
    return [];
  }, [shops, role, CURRENT_USER_ID]);

  const agents = MOCK_USERS.filter(u => u.role === "AGENT");
  const canRegister = role === "SUPER_ADMIN" || role === "AGENT";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
            Network <span className="text-brand">Nodes</span>
          </h1>
          <p className="text-zinc-400 mt-1">Monitor physical shops, cash-out points and digital terminals.</p>
        </div>
        
        {canRegister && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-brand text-black hover:bg-brand-dark font-bold px-8 h-12 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.15)] transition-all">
                <Plus className="w-5 h-5 mr-1" /> REGISTER SHOP
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase italic font-bold">Register New node</DialogTitle>
                <DialogDescription className="text-zinc-500">Provision a new physical betting terminal location.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 font-sans">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Shop Name</label>
                  <Input placeholder="Main Street Branch" className="bg-zinc-800 border-zinc-700 h-11 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Assign Agent</label>
                      <Select defaultValue={role === "AGENT" ? CURRENT_USER_ID : undefined}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 h-11 text-white">
                          <SelectValue placeholder="Select Agent" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white font-sans">
                          {role === "SUPER_ADMIN" ? (
                            agents.map(agent => (
                              <SelectItem key={agent.id} value={agent.id}>{agent.username}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value={CURRENT_USER_ID}>Current Agent</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Initial Limit</label>
                      <Input type="number" placeholder="50000" className="bg-zinc-800 border-zinc-700 h-11 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Location Details</label>
                  <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input placeholder="Central Market St, Abuja" className="pl-10 bg-zinc-800 border-zinc-700 h-11 text-white" />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                 <Button className="bg-brand text-black font-bold h-12 w-full rounded-xl hover:bg-brand-dark transition-all">INITIATE DEPLOYMENT</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredShops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RegionalDistribution />
          <HardwareMonitor />
      </div>
    </div>
  )
}

