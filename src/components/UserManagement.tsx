import { useState, useMemo } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreVertical,
  Shield,
  Wallet,
  Mail,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  DollarSign,
  Activity
} from "lucide-react";
import { 
  User, 
  UserRole, 
  MOCK_USERS 
} from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const TransferCreditModal = ({ remainingLimit, recipients }: { remainingLimit: number, recipients: User[] }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" className="border-zinc-700 text-brand hover:bg-brand/10 font-bold h-12 rounded-xl">
        <Wallet className="w-4 h-4 mr-2" /> TRANSFER CREDIT
      </Button>
    </DialogTrigger>
    <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl font-display uppercase italic text-white">Distribute Credit Limit</DialogTitle>
        <DialogDescription className="text-zinc-500">Your remaining allocatable limit: ${remainingLimit.toLocaleString()}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
         <div className="space-y-2">
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Select Recipient</label>
             <Select>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 h-11 text-white">
                  <SelectValue placeholder="Select subordinate" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white font-sans">
                  {recipients.filter(u => u.role !== "PUNTER" && u.role !== "CASHIER").map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.username} ({u.role.replace("_", " ")})</SelectItem>
                  ))}
                </SelectContent>
             </Select>
         </div>
         <div className="space-y-2">
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Amount to Transfer</label>
             <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                <Input type="number" max={remainingLimit} placeholder="0.00" className="pl-10 bg-zinc-800 border-zinc-700 h-11 text-white" />
             </div>
         </div>
      </div>
      <DialogFooter>
          <Button className="bg-brand text-black font-bold w-full h-12 rounded-xl hover:bg-brand-dark transition-all">Confirm Transfer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const CreateOperatorModal = ({ remainingLimit, viewableRoles }: { remainingLimit: number, viewableRoles: string[] }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button className="bg-brand text-black hover:bg-brand-dark font-bold px-8 h-12 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.15)] transition-all">
        <Plus className="w-5 h-5 mr-1" /> CREATE OPERATOR
      </Button>
    </DialogTrigger>
    <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md rounded-2xl shadow-2xl">
      <DialogHeader>
        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
           <Shield className="text-brand w-6 h-6" />
        </div>
        <DialogTitle className="text-2xl font-display uppercase italic text-white font-bold">New Network Operator</DialogTitle>
        <DialogDescription className="text-zinc-500">Assign roles and initial credit limits for the new account.</DialogDescription>
      </DialogHeader>
      <div className="space-y-6 py-4 font-sans">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase pb-1 block tracking-widest pl-1">Username</label>
              <Input placeholder="johndoe" className="bg-zinc-800 border-zinc-700 focus-visible:ring-brand h-11 text-white" />
          </div>
          <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase pb-1 block tracking-widest pl-1">Role</label>
              <Select>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 h-11 text-white">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white font-sans">
                  {viewableRoles.map(r => (
                    <SelectItem key={r} value={r} className="focus:bg-brand focus:text-black">{r.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase pb-1 block tracking-widest pl-1">Initial Credit Limit</label>
          <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
              <Input type="number" max={remainingLimit} placeholder="0.00" className="pl-10 bg-zinc-800 border-zinc-700 h-11 text-white" />
          </div>
          <p className="text-[10px] text-zinc-500 italic">Deducted from your total allocatable limit.</p>
        </div>
      </div>
      <DialogFooter className="gap-3">
        <Button variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white rounded-xl">Cancel</Button>
        <Button className="bg-brand text-black hover:bg-brand-dark font-bold rounded-xl grow">Provision Account</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const UserSummaryCards = ({ totalUsers }: { totalUsers: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-zinc-800/50 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
              <Shield className="text-brand w-6 h-6" />
          </div>
          <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Network Stability</p>
              <p className="text-lg font-bold text-white">Nominal</p>
          </div>
      </div>
      <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-zinc-800/50 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="text-blue-400 w-6 h-6" />
          </div>
          <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Operators</p>
              <p className="text-lg font-bold text-white">{totalUsers}</p>
          </div>
      </div>
      <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-zinc-800/50 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="text-emerald-400 w-6 h-6" />
          </div>
          <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verified Nodes</p>
              <p className="text-lg font-bold text-white">99.4%</p>
          </div>
      </div>
  </div>
);

// --- Main Page ---

export const UserManagementPage = ({ role }: { role: UserRole }) => {
  const [users] = useState<User[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  
  const CURRENT_USER_ID = role === "SUPER_ADMIN" ? "u1" : role === "AGENT" ? "a1" : "s1";
  const currentUser = users.find(u => u.id === CURRENT_USER_ID);

  const filteredUsers = useMemo(() => {
    let base = users;
    
    if (role === "AGENT") {
      base = users.filter(u => u.agentId === CURRENT_USER_ID || u.parentId === CURRENT_USER_ID);
    } else if (role === "SHOP_OWNER") {
      base = users.filter(u => u.shopId === currentUser?.shopId && u.role !== "SHOP_OWNER");
    }

    return base.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm, role, CURRENT_USER_ID, currentUser]);

  const viewableRoles = useMemo(() => {
    if (role === "SUPER_ADMIN") return ["AGENT", "SHOP_OWNER", "PUNTER"];
    if (role === "AGENT") return ["SHOP_OWNER", "CASHIER", "PUNTER"];
    if (role === "SHOP_OWNER") return ["CASHIER", "PUNTER"];
    return [];
  }, [role]);

  const remainingLimit = (currentUser?.creditLimit || 0) - (currentUser?.usedCredit || 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
            User <span className="text-brand">Registry</span>
          </h1>
          <p className="text-zinc-400 mt-1">Manage accounts and distribute your remaining limit of <span className="text-brand font-bold">${remainingLimit.toLocaleString()}</span>.</p>
        </div>
        <div className="flex gap-4">
            <TransferCreditModal remainingLimit={remainingLimit} recipients={filteredUsers} />
            <CreateOperatorModal remainingLimit={remainingLimit} viewableRoles={viewableRoles} />
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-800/50 shadow-lg">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
          <Input 
            className="pl-12 bg-zinc-900/50 border-zinc-800 focus-visible:ring-brand h-12 text-sm rounded-xl text-white" 
            placeholder="Search by username, email or operator ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="border-zinc-800 text-zinc-400 rounded-xl px-5 h-12 hover:border-zinc-700 flex-1 md:flex-none font-bold text-[10px] uppercase">
              <Filter className="w-4 h-4 mr-2" /> REPUTATION
            </Button>
            <Button variant="outline" className="border-zinc-800 text-zinc-400 rounded-xl px-5 h-12 hover:border-zinc-700 flex-1 md:flex-none font-bold text-[10px] uppercase">
              <Activity className="w-4 h-4 mr-2" /> LAST ACTIVE
            </Button>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-2xl border border-zinc-800/50 overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-zinc-900/80">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest py-5 px-6">Identity</TableHead>
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest">Clearance</TableHead>
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest">Credit Status (Distributed/Total)</TableHead>
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest">Node Status</TableHead>
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest">Activation Date</TableHead>
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-all group">
                <TableCell className="py-6 px-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-brand/40 transition-colors">
                        <UserIcon className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-brand transition-colors">{user.username}</span>
                        <span className="text-[10px] text-zinc-600 font-mono tracking-tighter">{user.email}</span>
                      </div>
                   </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-lg py-1 px-3 border transition-colors ${
                     user.role === 'SUPER_ADMIN' ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-300' : 
                     user.role === 'AGENT' ? 'bg-brand/10 border-brand/20 text-brand' :
                     user.role === 'SHOP_OWNER' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                     'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}>
                    {user.role.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono font-bold text-white py-6">
                   {user.role === "PUNTER" || user.role === "CASHIER" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-500 text-xs">$</span>
                        <span className="text-lg">{user.balance.toLocaleString()}</span>
                      </div>
                   ) : (
                      <div className="space-y-1.5 min-w-[150px]">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                            <span>Allocated</span>
                            <span>{Math.round((user.usedCredit / user.creditLimit) * 100)}%</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand" style={{ width: `${(user.usedCredit / user.creditLimit) * 100}%` }} />
                        </div>
                        <div className="flex text-[10px] gap-2 pt-1">
                            <span className="text-white">${user.usedCredit.toLocaleString()}</span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-zinc-400">${user.creditLimit.toLocaleString()}</span>
                        </div>
                      </div>
                   )}
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                        {user.status === 'active' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${user.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {user.status}
                        </span>
                   </div>
                </TableCell>
                <TableCell className="text-zinc-600 text-xs font-mono">{user.created_at}</TableCell>
                <TableCell className="text-right px-6 text-white">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-white transition-colors">
                            <MoreVertical className="w-5 h-5" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white min-w-[180px] p-2 rounded-xl">
                         <DropdownMenuLabel className="text-[10px] font-bold text-zinc-500 uppercase ps-2 pt-2 tracking-widest">OPERATIONS</DropdownMenuLabel>
                         <DropdownMenuItem className="focus:bg-brand focus:text-black font-medium cursor-pointer rounded-lg p-2 text-xs">
                            <Wallet className="w-4 h-4 mr-2" /> Adjust Limit
                         </DropdownMenuItem>
                         <DropdownMenuItem className="focus:bg-brand focus:text-black font-medium cursor-pointer rounded-lg p-2 text-xs">
                            <Edit2 className="w-4 h-4 mr-2" /> Modify Access
                         </DropdownMenuItem>
                         <DropdownMenuSeparator className="bg-zinc-800" />
                         <DropdownMenuItem className="focus:bg-rose-500 focus:text-white text-rose-400 font-medium cursor-pointer rounded-lg p-2 text-xs">
                            <Trash2 className="w-4 h-4 mr-2" /> Revoke Clearance
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
         </Table>
      </div>

      <UserSummaryCards totalUsers={filteredUsers.length} />
    </div>
  )
}
