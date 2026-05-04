import { User as UserIcon, Users, Store, Shield, DollarSign, Activity, Settings, LayoutDashboard, Search, Filter, Plus, Trash2, Edit2, ChevronRight, BarChart3, Receipt, Wallet } from "lucide-react";

export type UserRole = "SUPER_ADMIN" | "AGENT" | "SHOP_OWNER" | "CASHIER" | "PUNTER";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  balance: number; // For Punters
  creditLimit: number; // For Agents and Shop Owners
  usedCredit: number; // How much of their limit they've distributed to subordinates
  status: "active" | "suspended";
  created_at: string;
  parentId?: string; // High-level hierarchy (Super Admin -> Agent -> Shop Owner)
  agentId?: string; // Direct link to Agent for easier filtering
  shopId?: string;  // Associated shop ID
}

export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  agentId: string;
  creditLimit: number; // Allocated by the Agent
  usedCredit: number; // Allocated to Cashiers or used for balance
  status: "active" | "suspended";
  created_at: string;
}

export interface Bet {
  id: string;
  userId: string;
  shopId?: string; // Optional if placed online
  isOnline: boolean;
  amount: number;
  potentialPayout: number;
  odds: number;
  status: "pending" | "won" | "lost" | "void";
  events: {
    name: string;
    selection: string;
    odds: number;
  }[];
  created_at: string;
}

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    username: "super_admin",
    email: "super@mezzobet.com",
    role: "SUPER_ADMIN",
    balance: 0,
    creditLimit: 99999999,
    usedCredit: 1000000,
    status: "active",
    created_at: "2024-01-01",
  },
  {
    id: "a1",
    username: "agent_alpha",
    email: "agent@mezzobet.com",
    role: "AGENT",
    balance: 0,
    creditLimit: 1000000,
    usedCredit: 200000,
    status: "active",
    created_at: "2024-02-15",
    parentId: "u1",
  },
  {
    id: "s1",
    username: "shop_owner_1",
    email: "shop1@mezzobet.com",
    role: "SHOP_OWNER",
    balance: 0,
    creditLimit: 200000,
    usedCredit: 50000,
    status: "active",
    created_at: "2024-03-10",
    parentId: "a1",
    agentId: "a1",
    shopId: "shop_1",
  },
  {
    id: "c1",
    username: "cashier_1",
    email: "cash1@mezzobet.com",
    role: "CASHIER",
    balance: 10000,
    creditLimit: 0,
    usedCredit: 0,
    status: "active",
    created_at: "2024-03-15",
    parentId: "s1",
    agentId: "a1",
    shopId: "shop_1",
  },
  {
    id: "p1",
    username: "online_punter",
    email: "punter@example.com",
    role: "PUNTER",
    balance: 5000,
    creditLimit: 0,
    usedCredit: 0,
    status: "active",
    created_at: "2024-04-01",
  },
];

export const MOCK_SHOPS: Shop[] = [
  {
    id: "shop_1",
    name: "Main Street Branch",
    ownerId: "s1",
    agentId: "a1",
    creditLimit: 50000,
    usedCredit: 12000,
    status: "active",
    created_at: "2024-03-10",
  },
];

export const MOCK_BETS: Bet[] = [
  {
    id: "b1",
    userId: "p1",
    shopId: "shop_1",
    isOnline: false,
    amount: 50,
    potentialPayout: 150,
    odds: 3.0,
    status: "pending",
    created_at: "2024-05-01T10:00:00Z",
    events: [
      { name: "Arsenal vs Man City", selection: "Arsenal", odds: 3.0 },
    ],
  },
  {
    id: "b2",
    userId: "p1",
    isOnline: true,
    amount: 10,
    potentialPayout: 45,
    odds: 4.5,
    status: "won",
    created_at: "2024-05-02T14:30:00Z",
    events: [
      { name: "Lakers vs Celtics", selection: "Lakers", odds: 4.5 },
    ],
  },
];
