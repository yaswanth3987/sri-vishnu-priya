import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Settings,
  Users, Truck, ClipboardList, LogOut, Bell, Search, Plus,
  Printer, CreditCard, Smartphone, Banknote, Minus, Trash2,
  Edit2, ChevronDown, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, X, Eye, EyeOff, Download, FileText, Filter,
  ArrowUpRight, ArrowDownRight, Tag, Box, RefreshCw, Receipt,
  ChevronRight, Star, Zap, Moon, Sun, MapPin, Phone, User, Gift, Globe, Book, History, Calendar,
  Upload, FileSpreadsheet, Camera, Check, Info, Loader, Cloud, Database
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import confetti from "canvas-confetti";
import * as XLSX from "xlsx";

// ─── Feature Flags ────────────────────────────────────────────────────────────
const ENABLE_GRAND_OPENING = false;

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen =
  | "login" | "dashboard" | "pos" | "products"
  | "inventory" | "purchases" | "customers" | "reports"
  | "settings" | "receipt" | "history" | "orders";

type PortalMode = "admin" | "tablet";

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  category: string;
  isCustom?: boolean;
  notes?: string;
  gst?: number;
}

interface ReceiptData {
  items: CartItem[];
  paymentMethod: string;
  customer: string;
  customerType?: string;
  customerCompany?: string;
  billingCompany?: string;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount?: number;
  change?: number;
  invoice: string;
  date: string;
  time: string;
  billType: string;
  billNumber?: number;
}

interface KhataRecord {
  id: string;
  date: string;
  type: "credit" | "payment";
  amount: number;
  balance: number;
  note?: string;
  invoiceId?: string;
}

interface Customer {
  id: number;
  name: string;
  type: "Retail" | "Wholesale" | "School" | "College" | "Office" | "Bank" | "Corporate";
  phone: string;
  email: string;
  company?: string;
  gstin?: string;
  customerCode?: string;
  total: number;
  visits: number;
  lastVisit: string;
  dueAmount?: number;
  creditLimit?: number;
  khata?: KhataRecord[];
}

interface Purchase {
  id: string;
  supplier: string;
  date: string;
  items: number;
  amount: number;
  status: string;
  billFile?: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  role: "Admin" | "Staff" | "Cashier";
  status: "active" | "inactive";
  permissions: {
    dashboard: boolean;
    pos: boolean;
    products: boolean;
    inventory: boolean;
    purchases: boolean;
    customers: boolean;
    reports: boolean;
    [key: string]: boolean;
  };
}

// ─── Sample Data ──────────────────────────────────────────────────────────────
const EMPTY_WEEKLY_DATA = [
  { day: "Mon", sales: 0 },
  { day: "Tue", sales: 0 },
  { day: "Wed", sales: 0 },
  { day: "Thu", sales: 0 },
  { day: "Fri", sales: 0 },
  { day: "Sat", sales: 0 },
  { day: "Sun", sales: 0 },
];

const monthlyData = [
  { month: "Jan", revenue: 82000 }, { month: "Feb", revenue: 95000 },
  { month: "Mar", revenue: 78000 }, { month: "Apr", revenue: 110000 },
  { month: "May", revenue: 128000 }, { month: "Jun", revenue: 142000 },
  { month: "Jul", revenue: 136000 }, { month: "Aug", revenue: 158000 },
  { month: "Sep", revenue: 145000 }, { month: "Oct", revenue: 172000 },
  { month: "Nov", revenue: 195000 }, { month: "Dec", revenue: 218000 },
];

const categoryPie = [
  { name: "Books", value: 38 }, { name: "Stationery", value: 24 },
  { name: "School", value: 18 }, { name: "Gifts", value: 12 },
  { name: "Toys", value: 8 },
];

const PIE_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6", "#ef4444"];

const products = [
  { id: 1, name: "A4 Ruled Notebook 200pg", category: "Stationery", stock: 84, price: 65, supplier: "Navneet Edu.", status: "active" },
  { id: 2, name: "Classmate Geometry Box", category: "School", stock: 32, price: 125, supplier: "ITC Ltd.", status: "active" },
  { id: 3, name: "Reynolds 045 Pen (10pk)", category: "Stationery", stock: 7, price: 95, supplier: "Reynolds", status: "low" },
  { id: 4, name: "Moral Stories for Kids", category: "Books", stock: 18, price: 220, supplier: "Naveen Pub.", status: "active" },
  { id: 5, name: "Faber-Castell Color Pens", category: "School", stock: 0, price: 185, supplier: "Faber-Castell", status: "out" },
  { id: 6, name: "Gift Wrap Set Premium", category: "Gifts", stock: 41, price: 150, supplier: "LocalArt Co.", status: "active" },
  { id: 7, name: "Sticky Notes 3x3 (5pk)", category: "Office", stock: 5, price: 75, supplier: "3M India", status: "low" },
  { id: 8, name: "NCERT Maths Class 9", category: "Books", stock: 12, price: 80, supplier: "NCERT", status: "active" },
  { id: 9, name: "Rubik's Cube 3x3", category: "Toys", stock: 22, price: 350, supplier: "ToyMaster", status: "active" },
  { id: 10, name: "Highlighter Set (6 colors)", category: "Stationery", stock: 3, price: 110, supplier: "Camlin", status: "low" },
];

const posProducts = [
  { id: 1, name: "A4 Ruled Notebook", price: 65, category: "Stationery", barcode: "8901072003849" },
  { id: 2, name: "Geometry Box", price: 125, category: "School", barcode: "8901234567890" },
  { id: 3, name: "Reynolds Pen 10pk", price: 95, category: "Stationery", barcode: "8901098765432" },
  { id: 4, name: "Moral Stories Book", price: 220, category: "Books", barcode: "9780123456789" },
  { id: 5, name: "Color Pencils 24pk", price: 185, category: "School", barcode: "8901111222333" },
  { id: 6, name: "Gift Wrap Premium", price: 150, category: "Gifts", barcode: "8901444555666" },
  { id: 7, name: "Sticky Notes 5pk", price: 75, category: "Office", barcode: "8901777888999" },
  { id: 8, name: "NCERT Maths Cl.9", price: 80, category: "Books", barcode: "9788120403543" },
  { id: 9, name: "Rubik's Cube 3x3", price: 350, category: "Toys", barcode: "8901321654987" },
  { id: 10, name: "Highlighter 6-set", price: 110, category: "Stationery", barcode: "8901654321789" },
  { id: 11, name: "Stapler + 1000 pins", price: 180, category: "Office", barcode: "8901987654321" },
  { id: 12, name: "Origami Paper 100sh", price: 60, category: "School", barcode: "8901234987654" },
];

const customers = [
  { id: 1, name: "Priya Sharma", phone: "9876543210", email: "priya@gmail.com", total: 4280, visits: 12, lastVisit: "22 May 2026" },
  { id: 2, name: "Rahul Gupta", phone: "9812345678", email: "rahul.g@gmail.com", total: 1860, visits: 5, lastVisit: "20 May 2026" },
  { id: 3, name: "Anjali Mehta", phone: "9900112233", email: "anjali.m@yahoo.com", total: 7320, visits: 21, lastVisit: "23 May 2026" },
  { id: 4, name: "Vikram Patel", phone: "9988776655", email: "vikramp@gmail.com", total: 980, visits: 3, lastVisit: "18 May 2026" },
  { id: 5, name: "Sunita Rao", phone: "9765432109", email: "sunita.rao@outlook.com", total: 3140, visits: 9, lastVisit: "21 May 2026" },
  { id: 6, name: "Deepak Joshi", phone: "9654321098", email: "deepakj@gmail.com", total: 560, visits: 2, lastVisit: "15 May 2026" },
  { id: 7, name: "Kavita Singh", phone: "9543210987", email: "kavita.s@gmail.com", total: 12400, visits: 34, lastVisit: "23 May 2026" },
  { id: 8, name: "Mohan Das", phone: "9432109876", email: "mohan.d@gmail.com", total: 2200, visits: 7, lastVisit: "19 May 2026" },
];

const purchases = [
  { id: "PO-001", supplier: "Navneet Education", date: "20 May 2026", items: 8, amount: 14500, status: "received" },
  { id: "PO-002", supplier: "ITC Ltd.", date: "18 May 2026", items: 12, amount: 28000, status: "received" },
  { id: "PO-003", supplier: "Reynolds India", date: "22 May 2026", items: 5, amount: 9800, status: "pending" },
  { id: "PO-004", supplier: "Faber-Castell", date: "17 May 2026", items: 6, amount: 18600, status: "received" },
  { id: "PO-005", supplier: "NCERT Publications", date: "23 May 2026", items: 20, amount: 6400, status: "transit" },
];

const recentTxns = [
  { id: "INV-1042", customer: "Anjali Mehta", items: 4, amount: 670, method: "UPI", time: "11:32 AM" },
  { id: "INV-1041", customer: "Retail Customer", items: 2, amount: 145, method: "Cash", time: "11:18 AM" },
  { id: "INV-1040", customer: "Kavita Singh", items: 6, amount: 1240, method: "Card", time: "10:54 AM" },
  { id: "INV-1039", customer: "Retail Customer", items: 1, amount: 80, method: "Cash", time: "10:41 AM" },
  { id: "INV-1038", customer: "Rahul Gupta", items: 3, amount: 430, method: "UPI", time: "10:22 AM" },
];

const categories = ["All", "Books", "Stationery", "School", "Office", "Gifts", "Toys"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    low: "bg-amber-50 text-amber-700 border-amber-200",
    out: "bg-red-50 text-red-700 border-red-200",
    received: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    transit: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const label: Record<string, string> = {
    active: "In Stock", low: "Low Stock", out: "Out of Stock",
    received: "Received", pending: "Pending", transit: "In Transit",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {label[status] ?? status}
    </span>
  );
}

function PaymentBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    Cash: "bg-green-50 text-green-700", UPI: "bg-purple-50 text-purple-700", Card: "bg-blue-50 text-blue-700",
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${map[method] ?? "bg-gray-100"}`}>{method}</span>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const allNavItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "pos", icon: ShoppingCart, label: "POS Billing" },
  { id: "orders", icon: ClipboardList, label: "Orders" },
  { id: "products", icon: Package, label: "Products" },
  { id: "inventory", icon: Box, label: "Inventory" },
  { id: "purchases", icon: Truck, label: "Purchases" },
  { id: "customers", icon: Users, label: "Khata" },
  { id: "history", icon: History, label: "Bill History" },
  { id: "reports", icon: BarChart3, label: "Reports" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function Sidebar({ screen, setScreen, portalMode, tabPortalOptions, userName, currentUser }: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  portalMode: PortalMode;
  tabPortalOptions: Record<string, boolean>;
  userName: string;
  currentUser: User | null;
}) {
  const visibleItems = portalMode === "admin"
    ? allNavItems
    : allNavItems.filter(item => {
      if (item.id === "settings") return false; // tablets can't change settings
      if (item.id === "orders") return false; // orders not enabled for staff yet
      // Use user's role permissions if available, fall back to tabPortalOptions
      const userPerms = currentUser?.permissions;
      if (userPerms && item.id in userPerms) return userPerms[item.id] === true;
      return tabPortalOptions[item.id] === true;
    });

  const isTablet = portalMode === "tablet";

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full print:hidden" style={{ background: "var(--sidebar)" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTablet ? "bg-emerald-500" : "bg-blue-500"}`}>
            <Tag className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Vishnu Priya POS</p>
            <p className="text-xs leading-tight" style={{ color: "var(--sidebar-foreground)", opacity: 0.55 }}>
              {isTablet ? "Tablet Portal" : "Stationery & Books"}
            </p>
          </div>
        </div>
        {isTablet && (
          <div className="mt-2 px-1 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30">
            <p className="text-xs text-emerald-300 font-medium text-center">Staff Mode</p>
          </div>
        )}
      </div>
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ id, icon: Icon, label }) => {
          const active = screen === id;
          return (
            <button
              key={id}
              onClick={() => setScreen(id as Screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active
                ? isTablet ? "bg-emerald-600 text-white shadow-sm" : "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>
      {/* Footer */}
      <div className="px-3 pb-4 space-y-1 border-t pt-3" style={{ borderColor: "var(--sidebar-border)" }}>
        {!isTablet && (
          <button
            onClick={() => setScreen("receipt")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <Receipt className="w-4 h-4" />
            Receipt
          </button>
        )}
        <button
          onClick={() => setScreen("login")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
        <div className="px-3 pt-2">
          <p className="text-xs font-medium text-white/80">{userName}</p>
          <p className="text-xs" style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}>
            {isTablet ? "Staff \u2022 Tablet Portal" : "Admin \u2022 Vishnu Priya"}
          </p>
        </div>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle, userName, portalMode }: {
  title: string; subtitle?: string; userName: string; portalMode: PortalMode;
}) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [syncState, setSyncState] = useState<{ connected: boolean; lastSyncAt?: string; syncing?: boolean }>({ connected: true });

  useEffect(() => {
    fetch("/api/supabase/status")
      .then(r => r.json())
      .then(d => setSyncState({ connected: d.connected, lastSyncAt: d.lastSyncAt }))
      .catch(() => setSyncState({ connected: false }));
  }, []);

  const handleQuickSync = async () => {
    setSyncState(s => ({ ...s, syncing: true }));
    try {
      const res = await fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "push" }),
      });
      const d = await res.json();
      setSyncState({ connected: d.sync?.connected ?? res.ok, lastSyncAt: d.sync?.lastSyncAt || new Date().toISOString(), syncing: false });
    } catch {
      setSyncState(s => ({ ...s, connected: false, syncing: false }));
    }
  };

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const initials = userName.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const isTablet = portalMode === "tablet";
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border flex-shrink-0 print:hidden transition-colors">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {/* Supabase Cloud Live Sync Badge */}
        <button
          onClick={handleQuickSync}
          disabled={syncState.syncing}
          title={syncState.lastSyncAt ? `Supabase Cloud Synced at ${new Date(syncState.lastSyncAt).toLocaleTimeString()}` : "Click to sync with Supabase"}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            syncState.syncing ? "bg-indigo-50 border-indigo-200 text-indigo-700 animate-pulse" :
            syncState.connected ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" :
            "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          }`}
        >
          <Cloud className={`w-3.5 h-3.5 ${syncState.syncing ? "animate-spin" : ""}`} />
          <span>{syncState.syncing ? "Syncing Cloud..." : syncState.connected ? "Supabase Synced" : "Cloud Offline"}</span>
        </button>

        {isTablet && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">Staff Mode</span>
        )}
        <button onClick={toggleDark} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {isDark ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </button>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isTablet ? "bg-emerald-600" : "bg-blue-600"
          }`}>SVP</div>
      </div>
    </header>
  );
}

// ─── Ribbon Cutting Screen ────────────────────────────────────────────────────
function RibbonCuttingScreen({ onComplete }: { onComplete: () => void }) {
  const [isCut, setIsCut] = useState(false);
  const [showSparkles, setShowSparkles] = useState(true);

  const handleCut = () => {
    setIsCut(true);
    setShowSparkles(false);
    
    // Grand Center Burst
    confetti({
      particleCount: 200,
      spread: 160,
      startVelocity: 60,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FFFFFF', '#FF8C00']
    });

    // Prolonged side fireworks
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#FFD700', '#FF0000', '#00FF00', '#0000FF']
      });
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#FFD700', '#FF0000', '#00FF00', '#0000FF']
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
    
    localStorage.setItem("hasLaunched", "true");
    setTimeout(() => {
      onComplete();
    }, 4500); // Extended delay to watch the fireworks
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-[1500ms] ${isCut ? 'opacity-0 delay-[3000ms]' : 'opacity-100'}`} style={{ background: 'radial-gradient(circle at center, #1e1b4b, #000000)' }}>
      
      {/* Dynamic Background Beams */}
      <div className={`absolute inset-0 opacity-30 transition-opacity duration-1000 ${isCut ? 'opacity-100' : 'opacity-30'}`} style={{
        background: 'conic-gradient(from 90deg at 50% 50%, rgba(0,0,0,0) 0%, rgba(234,179,8,0.2) 20%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(234,179,8,0.2) 80%, rgba(0,0,0,0) 100%)',
        animation: 'spin 15s linear infinite'
      }} />

      {/* Decorative stars/particles */}
      {showSparkles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500">
          {[...Array(40)].map((_, i) => (
            <Star key={i} className="absolute text-yellow-500/30 w-6 h-6 animate-pulse" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              transform: `scale(${Math.random() * 1.5})`
            }} />
          ))}
        </div>
      )}

      {/* Center Shockwave */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all ease-out ${isCut ? 'scale-[25] opacity-0 duration-1000' : 'scale-0 opacity-100 duration-0'}`}>
        <div className="w-24 h-24 rounded-full border-4 border-yellow-300 shadow-[0_0_80px_rgba(253,224,71,1)]" />
      </div>
      
      <div className="text-center z-10 relative">
        <h1 className={`text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-8 drop-shadow-[0_0_25px_rgba(234,179,8,0.6)] transition-all duration-1000 ${isCut ? 'scale-110 drop-shadow-[0_0_50px_rgba(234,179,8,1)]' : 'scale-100'}`}>
          Grand Opening
        </h1>
        <p className={`text-2xl md:text-3xl text-blue-200 mb-20 font-medium transition-all duration-1000 ${isCut ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          Vishnu Priya POS is ready for business.
        </p>
        
        {/* Ribbon visual */}
        <div className="relative w-screen max-w-5xl h-20 flex items-center justify-center mb-16 overflow-visible">
          {/* Left Ribbon */}
          <div className={`absolute h-20 bg-gradient-to-r from-red-800 via-red-600 to-red-500 w-full shadow-[0_10px_30px_rgba(220,38,38,0.8)] border-y-[3px] border-yellow-500/50 transition-all ease-in duration-[1000ms] ${isCut ? '-translate-x-[150%] rotate-[-5deg]' : 'translate-x-0'}`} style={{ width: '50%', right: '50%', transformOrigin: 'right' }}>
             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
          </div>
          {/* Right Ribbon */}
          <div className={`absolute h-20 bg-gradient-to-l from-red-800 via-red-600 to-red-500 w-full shadow-[0_10px_30px_rgba(220,38,38,0.8)] border-y-[3px] border-yellow-500/50 transition-all ease-in duration-[1000ms] ${isCut ? 'translate-x-[150%] rotate-[5deg]' : 'translate-x-0'}`} style={{ width: '50%', left: '50%', transformOrigin: 'left' }}>
             <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/20" />
          </div>
          
          {/* Scissors Button */}
          <button 
            onClick={handleCut}
            disabled={isCut}
            className={`absolute z-40 group flex items-center justify-center w-32 h-32 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-full shadow-[0_0_50px_rgba(234,179,8,1)] border-4 border-yellow-100 hover:scale-110 active:scale-90 transition-all duration-300 overflow-hidden ${isCut ? 'scale-[2] opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
          >
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-50" />
            <span className={`text-6xl transition-transform duration-300 ${isCut ? 'rotate-[-30deg]' : 'group-hover:rotate-[-20deg] group-active:rotate-[-45deg]'}`}>✂️</span>
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, users, logo }: { onLogin: (user: User) => void; users: User[]; logo?: string }) {
  const [showPass, setShowPass] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    const found = users.find(u => u.username === user && u.status === "active");
    if (!found) {
      setError("Invalid username or inactive user.");
      return;
    }
    if (found.password !== pass) {
      setError("Invalid password.");
      return;
    }
    onLogin(found);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 transition-all duration-500" style={{ background: "var(--primary)" }}>
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt="Shop Logo" className="h-12 object-contain bg-white rounded p-1" />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500">
              <Tag className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="text-white font-bold text-lg">Vishnu Priya POS</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Billing made fast.<br />
            Inventory made simple.
          </h2>
          <p className="text-sm leading-relaxed mb-8 text-blue-200">
            Manage your stationery and book shop with ease — quick billing, real-time stock, GST reports, and more.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Zap, label: "Fast Billing", desc: "Bill in seconds" },
              { icon: Box, label: "Live Stock", desc: "Real-time updates" },
              { icon: BarChart3, label: "GST Reports", desc: "One-click export" },
              { icon: Users, label: "Khata", desc: "Track loyalty" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl p-3 bg-white/10">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-300" />
                <div>
                  <p className="text-white text-xs font-semibold">{label}</p>
                  <p className="text-xs text-blue-200">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-blue-300">© 2026 Vishnu Priya Stationary · All rights reserved</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            {logo ? (
              <img src={logo} alt="Shop Logo" className="h-10 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600">
                <Tag className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-bold text-primary text-lg">Vishnu Priya POS</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-6">Sign in to your store dashboard</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
              <input
                value={user} onChange={e => setUser(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:border-transparent transition-all border-border focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={pass} onChange={e => setPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:border-transparent pr-10 transition-all border-border focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
                <button onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-2.5 rounded-lg text-white text-sm font-semibold active:scale-95 transition-all shadow-sm bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">Vishnu Priya POS v2.4 · Secure Login</p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Date Filter Helpers ────────────────────────────────────────────
type DatePreset = "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "thisYear" | "customDate" | "customRange";

interface DateRange { start: string; end: string; } // YYYY-MM-DD strings

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(preset: DatePreset): DateRange {
  const now = new Date();
  const today = toYMD(now);
  switch (preset) {
    case "today": return { start: today, end: today };
    case "yesterday": {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      const ys = toYMD(y); return { start: ys, end: ys };
    }
    case "thisWeek": {
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0,0,0,0);
      return { start: toYMD(mon), end: today };
    }
    case "lastWeek": {
      const thisMon = new Date(now); thisMon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); thisMon.setHours(0,0,0,0);
      const lastMon = new Date(thisMon); lastMon.setDate(thisMon.getDate() - 7);
      const lastSun = new Date(thisMon); lastSun.setDate(thisMon.getDate() - 1);
      return { start: toYMD(lastMon), end: toYMD(lastSun) };
    }
    case "thisMonth": {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: toYMD(m), end: today };
    }
    case "lastMonth": {
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastOfLastMonth = new Date(firstOfThisMonth); lastOfLastMonth.setDate(0);
      const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1);
      return { start: toYMD(firstOfLastMonth), end: toYMD(lastOfLastMonth) };
    }
    case "thisYear": {
      const y = new Date(now.getFullYear(), 0, 1);
      return { start: toYMD(y), end: today };
    }
    default: return { start: today, end: today };
  }
}

const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today", yesterday: "Yesterday", thisWeek: "This Week", lastWeek: "Last Week",
  thisMonth: "This Month", lastMonth: "Last Month", thisYear: "This Year",
  customDate: "Custom Date", customRange: "Custom Range",
};

function formatRangeLabel(preset: DatePreset, range: DateRange): string {
  const fmtDate = (s: string) => {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };
  if (preset === "today" || preset === "yesterday") return `${PRESET_LABELS[preset]} · ${fmtDate(range.start)}`;
  if (preset === "customDate") return `${fmtDate(range.start)}`;
  if (range.start === range.end) return fmtDate(range.start);
  if (range.start.slice(0, 7) === range.end.slice(0, 7)) {
    // Same month
    const s = new Date(range.start + "T00:00:00");
    const e = new Date(range.end + "T00:00:00");
    return `${s.getDate()} – ${e.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  const s = new Date(range.start + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const e = new Date(range.end + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `${s} – ${e}`;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ setScreen, summary, sales, onFetchSummary, onBusinessDateChange }: {
  setScreen: (s: Screen) => void;
  summary: any | null;
  sales: any[];
  onFetchSummary: (startDate: string, endDate: string) => Promise<void>;
  onBusinessDateChange: (dateStr: string) => void;
}) {
  // ── Date filter state ──
  const [activePreset, setActivePreset] = useState<DatePreset>("today");
  const [activeRange, setActiveRange] = useState<DateRange>(getPresetRange("today"));

  // Picker / popover state
  const [showPicker, setShowPicker] = useState(false);
  const [draftPreset, setDraftPreset] = useState<DatePreset>("today");
  const [draftRange, setDraftRange] = useState<DateRange>(getPresetRange("today"));
  const [customFrom, setCustomFrom] = useState(toYMD(new Date()));
  const [customTo, setCustomTo] = useState(toYMD(new Date()));

  // Loading / error state
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0); // race-condition guard

  // Fetch summary for a range (race-condition safe)
  const fetchForRange = useCallback(async (start: string, end: string) => {
    const reqId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      await onFetchSummary(start, end);
      // Only update if this is still the latest request
      if (reqId === requestIdRef.current) {
        setIsLoading(false);
      }
    } catch (err: any) {
      if (reqId === requestIdRef.current) {
        setIsLoading(false);
        setLoadError("Unable to load dashboard data. Please try again.");
        console.error("[DateFilter] fetch failed:", err);
      }
    }
  }, [onFetchSummary]);

  // Load today on mount
  useEffect(() => {
    fetchForRange(activeRange.start, activeRange.end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Apply
  const handleApply = () => {
    let resolvedRange = draftRange;
    if (draftPreset === "customDate") resolvedRange = { start: customFrom, end: customFrom };
    else if (draftPreset === "customRange") resolvedRange = { start: customFrom, end: customTo };
    // Validate
    if (!resolvedRange.start || !resolvedRange.end || resolvedRange.start > resolvedRange.end) {
      setLoadError("Invalid date range. Please check your selection.");
      return;
    }
    setActivePreset(draftPreset);
    setActiveRange(resolvedRange);
    setShowPicker(false);
    fetchForRange(resolvedRange.start, resolvedRange.end);
    // For a single-day selection use that day; for a range use the end date
    // (end = most recent / "current" day the cashier is working in)
    onBusinessDateChange(resolvedRange.end);
  };

  // Handle Cancel
  const handleCancel = () => {
    setDraftPreset(activePreset);
    setDraftRange(activeRange);
    setCustomFrom(activeRange.start);
    setCustomTo(activeRange.end);
    setShowPicker(false);
  };

  // Handle Reset → Today
  // Handle Reset → Today
  const handleReset = () => {
    const todayRange = getPresetRange("today");
    setActivePreset("today");
    setActiveRange(todayRange);
    setDraftPreset("today");
    setDraftRange(todayRange);
    setCustomFrom(todayRange.start);
    setCustomTo(todayRange.end);
    setShowPicker(false);
    fetchForRange(todayRange.start, todayRange.end);
    onBusinessDateChange(todayRange.end);
  };

  // Open Edit
  const handleEdit = () => {
    setDraftPreset(activePreset);
    setDraftRange(activeRange);
    setCustomFrom(activeRange.start);
    setCustomTo(activeRange.end);
    setShowPicker(true);
  };

  // ── Derived data ──
  const liveRecentTxns = useMemo(() => {
    // Filter transactions to active range by stored billDate
    return sales
      .filter(s => {
        const sDate = s.billDate || (s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "");
        return sDate >= activeRange.start && sDate <= activeRange.end;
      })
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        customer: s.customer || s.customerType || "Retail Customer",
        items: s.items?.length || 0,
        time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        method: s.paymentMethod || "Cash",
        amount: s.total || 0
      }));
  }, [sales, activeRange]);

  const [backendStatus, setBackendStatus] = useState("Connecting...");
  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(d => setBackendStatus(`${d.status} @ ${new Date(d.time).toLocaleTimeString()}`))
      .catch(() => setBackendStatus('Backend unavailable'));
  }, []);

  const salesData = summary?.weeklyChartData?.length > 0 ? summary.weeklyChartData : EMPTY_WEEKLY_DATA;
  const bestSellers = summary?.bestSellers?.length > 0 ? summary.bestSellers : [];

  // Dynamic label for KPI cards based on the active preset
  const isSingleDay = activeRange.start === activeRange.end;
  const periodLabel = isSingleDay
    ? (activePreset === "today" ? "Today" : activePreset === "yesterday" ? "Yesterday" : formatRangeLabel(activePreset, activeRange))
    : formatRangeLabel(activePreset, activeRange);

  const kpis = [
    { label: `Sales (${periodLabel})`, value: summary?.metrics?.todaysSales ?? "₹0", change: "+0%", up: true, icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
    { label: "Pending Khata Amount", value: summary?.metrics?.pendingKhata ?? "₹0", change: "From customers", up: false, icon: Book, color: "bg-orange-50 text-orange-600" },
    { label: "Outstanding Khata", value: summary?.metrics?.outstandingCustomers ?? "0", change: "Need follow-up", up: false, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
    { label: "Low Stock Products", value: summary?.metrics?.lowStockAlerts ?? "0 items", change: "Need restock", up: false, icon: Package, color: "bg-amber-50 text-amber-600" },
    { label: `Bills (${periodLabel})`, value: summary?.metrics?.todaysBills ?? "0", change: periodLabel, up: true, icon: Receipt, color: "bg-cyan-50 text-cyan-600" },
    { label: `Revenue (${periodLabel})`, value: summary?.metrics?.monthlyRevenue ?? "₹0", change: periodLabel, up: true, icon: TrendingUp, color: "bg-green-50 text-green-600" },
  ];

  const PRESETS: DatePreset[] = ["today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth", "thisYear", "customDate", "customRange"];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* ── Date Filter Bar ── */}
      <div className="relative">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Active period display */}
          <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              {formatRangeLabel(activePreset, activeRange)}
            </span>
            {isLoading && (
              <span className="ml-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "100ms" }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "200ms" }} />
              </span>
            )}
          </div>
          <button
            id="dashboard-date-edit-btn"
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            id="dashboard-date-reset-btn"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* ── Date Picker Popover ── */}
        {showPicker && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-30" onClick={handleCancel} />
            <div
              id="dashboard-date-picker"
              className="absolute top-full mt-2 left-0 z-40 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 w-[480px] max-w-[calc(100vw-2rem)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" /> Select Date Range
                </h4>
                <button onClick={handleCancel} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Preset grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESETS.filter(p => p !== "customDate" && p !== "customRange").map(preset => (
                  <button
                    key={preset}
                    id={`dashboard-preset-${preset}`}
                    onClick={() => {
                      setDraftPreset(preset);
                      setDraftRange(getPresetRange(preset));
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      draftPreset === preset
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                    }`}
                  >
                    {PRESET_LABELS[preset]}
                  </button>
                ))}
              </div>

              {/* Custom date / range option */}
              <div className="border-t border-gray-100 pt-4 mb-4">
                <div className="flex gap-2 mb-3">
                  {(["customDate", "customRange"] as DatePreset[]).map(p => (
                    <button
                      key={p}
                      id={`dashboard-preset-${p}`}
                      onClick={() => setDraftPreset(p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                        draftPreset === p
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                      }`}
                    >
                      {PRESET_LABELS[p]}
                    </button>
                  ))}
                </div>

                {(draftPreset === "customDate" || draftPreset === "customRange") && (
                  <div className={`grid gap-3 ${draftPreset === "customRange" ? "grid-cols-2" : "grid-cols-1"}` }>
                    <div>
                      <label className="block text-xs text-gray-500 font-medium mb-1">
                        {draftPreset === "customRange" ? "From Date" : "Date"}
                      </label>
                      <input
                        id="dashboard-custom-from"
                        type="date"
                        value={customFrom}
                        max={toYMD(new Date())}
                        onChange={e => setCustomFrom(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {draftPreset === "customRange" && (
                      <div>
                        <label className="block text-xs text-gray-500 font-medium mb-1">To Date</label>
                        <input
                          id="dashboard-custom-to"
                          type="date"
                          value={customTo}
                          min={customFrom}
                          max={toYMD(new Date())}
                          onChange={e => setCustomTo(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Preview of selected range */}
              {draftPreset !== "customDate" && draftPreset !== "customRange" && (
                <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">
                    {formatRangeLabel(draftPreset, draftRange)}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  id="dashboard-date-cancel-btn"
                  onClick={handleCancel}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="dashboard-date-apply-btn"
                  onClick={handleApply}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Error state ── */}
      {loadError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{loadError}</p>
          </div>
          <button
            id="dashboard-retry-btn"
            onClick={() => fetchForRange(activeRange.start, activeRange.end)}
            className="ml-4 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── KPI Cards (with loading skeleton overlay) ── */}
      <div className="relative">
        <div className={`grid grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${isLoading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
          {kpis.map(({ label, value, change, up, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium ${up ? "text-green-600" : "text-amber-600"}`}>
                  {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {change}
                </span>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                </div>
              ) : (
                <>
                  <p className="text-xl font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Backend API Status</h3>
            <p className="text-xs text-muted-foreground">Connected to the new server backend</p>
          </div>
          <span className="text-sm font-medium text-blue-600">{backendStatus}</span>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${isLoading ? "opacity-40" : "opacity-100"}`}>
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Sales Chart</h3>
              <p className="text-xs text-muted-foreground">{periodLabel}</p>
            </div>
            <span className="text-xs text-muted-foreground border border-border rounded-lg px-2 py-1 bg-gray-50">
              {summary?.dateRange?.chartMode === "hourly" ? "Hourly" : summary?.dateRange?.chartMode === "weekly" ? "Weekly" : "Daily"}
            </span>
          </div>
          {isLoading ? (
            <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Sales"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} fill="url(#salesGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Best Sellers */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Best Sellers</h3>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-3">
            {isLoading ? (
              [1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-3 bg-gray-100 rounded animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-2 bg-gray-100 rounded animate-pulse w-2/3" />
                  </div>
                  <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
              ))
            ) : bestSellers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No sales in this period</p>
            ) : bestSellers.map((item: any, i: number) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sold} sold</p>
                </div>
                <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {fmt(item.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className={`lg:col-span-2 bg-card rounded-xl p-5 border border-border shadow-sm transition-opacity duration-300 ${isLoading ? "opacity-40" : "opacity-100"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Transactions ({periodLabel})</h3>
            <button onClick={() => setScreen("reports")} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              [1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 p-2.5">
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))
            ) : liveRecentTxns.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No transactions in this period</p>
            ) : liveRecentTxns.map(txn => (
              <div key={txn.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{txn.customer}</p>
                  <p className="text-xs text-muted-foreground">{txn.items} items · {txn.time}</p>
                </div>
                <PaymentBadge method={txn.method} />
                <p className="text-sm font-semibold text-foreground ml-2" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {fmt(txn.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-semibold text-foreground text-sm mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "New Sale", icon: ShoppingCart, screen: "pos", color: "bg-blue-600 hover:bg-blue-700 text-white" },
              { label: "Add Product", icon: Plus, screen: "products", color: "bg-green-600 hover:bg-green-700 text-white" },
              { label: "Stock Update", icon: RefreshCw, screen: "inventory", color: "bg-amber-500 hover:bg-amber-600 text-white" },
              { label: "View Reports", icon: BarChart3, screen: "reports", color: "bg-purple-600 hover:bg-purple-700 text-white" },
              { label: "Add Purchase", icon: Truck, screen: "purchases", color: "bg-slate-600 hover:bg-slate-700 text-white" },
            ].map(({ label, icon: Icon, screen, color }) => (
              <button
                key={label}
                onClick={() => setScreen(screen as Screen)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${color}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-card rounded-xl p-5 border border-red-200 shadow-sm mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-red-700 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Low Stock Alerts</h3>
          <button onClick={() => setScreen("inventory")} className="text-xs text-red-600 hover:underline">Manage Inventory</button>
        </div>
        {summary?.lowStockItems?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.lowStockItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm font-medium text-foreground truncate mr-2">{item.name}</p>
                <span className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded shadow-sm flex-shrink-0">{item.stock} left</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-green-600 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-5 h-5 mx-auto mb-1" /> All products have sufficient stock!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── POS Billing ──────────────────────────────────────────────────────────────
function POSScreen({
  setScreen, productRows, customers, settings, onSaveProduct, defaultGstOn, defaultGstRate, onCompleteSale, onDeleteProduct, onPreviewReceipt, businessDate,
}: {
  setScreen: (s: Screen) => void;
  productRows: ProductRow[];
  customers: Customer[];
  settings: AppSettings;
  onSaveProduct: (product: Omit<ProductRow, "status">) => Promise<void> | void;
  defaultGstOn: boolean;
  defaultGstRate: number;
  onCompleteSale: (payload: Omit<ReceiptData, "invoice" | "date" | "time">) => Promise<ReceiptData>;
  onDeleteProduct: (id: number) => Promise<void> | void;
  onPreviewReceipt: (payload: Omit<ReceiptData, "invoice" | "date" | "time">) => void;
  businessDate: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [customer, setCustomer] = useState("");
  const [customerType, setCustomerType] = useState("Retail Customer");
  const [applyGst, setApplyGst] = useState(defaultGstOn);
  const [gstRate, setGstRate] = useState(defaultGstRate);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [billType, setBillType] = useState("Cash Bill");
  const [billingCompany, setBillingCompany] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // New Customer Selection State
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("All");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustType, setNewCustType] = useState<"Retail" | "Wholesale" | "School" | "College" | "Office" | "Bank" | "Corporate">("Retail");
  const [newCustGst, setNewCustGst] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const custSearchRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); setCart([]); setCustomer(""); setCustomerType("Retail Customer"); }
      else if (e.key === "F2") { e.preventDefault(); custSearchRef.current?.focus(); }
      else if (e.key === "F3") { e.preventDefault(); searchInputRef.current?.focus(); }
      else if (e.key === "F4") { e.preventDefault(); setShowCustomForm(true); }
      else if (e.key === "F5") { e.preventDefault(); if (cart.length > 0) setShowCheckoutModal(true); }
      else if (e.key === "Escape") { setShowCustomForm(false); setShowNewCustomerForm(false); setShowCheckoutModal(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length]);

  const [isPrinting, setIsPrinting] = useState(false);
  const [printStep, setPrintStep] = useState(0);

  // Small built-in calculator for quick arithmetic in billing
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcExpr, setCalcExpr] = useState("");
  const [calcResult, setCalcResult] = useState<number | null>(null);

  // Add item form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Stationery");
  const [formGst, setFormGst] = useState("18");
  const [formCost, setFormCost] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const usedCategories = useMemo(() => ["All", ...Array.from(new Set(productRows.map(p => p.category)))], [productRows]);

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return productRows.filter(p => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(lowerSearch);
      return matchCat && matchSearch;
    });
  }, [productRows, activeCategory, search]);

  const openAdd = () => {
    setEditId(null);
    setFormName(""); setFormPrice(""); setFormCategory("Stationery"); setFormGst(String(defaultGstRate)); setFormCost("");
    setShowForm(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditId(p.id);
    setFormName(p.name); setFormPrice(String(p.price)); setFormCategory(p.category); setFormGst(String(p.gst));
    setFormCost(p.cost ? String(p.cost) : "");
    setShowForm(true);
  };

  const saveProduct = () => {
    if (!formName.trim() || !formPrice || Number(formPrice) <= 0) return;
    const prodId = editId !== null ? editId : Date.now();
    const existing = productRows.find(p => p.id === prodId);
    onSaveProduct({
      id: prodId,
      name: formName.trim(),
      price: Number(formPrice),
      category: formCategory,
      gst: Number(formGst),
      stock: existing ? existing.stock : 0,
      supplier: existing ? existing.supplier : "",
      cost: formCost ? Number(formCost) : undefined
    });
    setShowForm(false);
  };

  const deleteProduct = (id: number) => {
    setCart(prev => prev.filter(c => c.id !== id));
    onDeleteProduct(id);
  };

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customGst, setCustomGst] = useState(String(defaultGstRate));
  const [customNotes, setCustomNotes] = useState("");

  const addCustomToCart = () => {
    if (!customName.trim() || !customPrice || Number(customPrice) <= 0) return;
    setCart(prev => [
      ...prev,
      {
        id: Date.now(),
        name: customName.trim(),
        price: Number(customPrice),
        qty: Number(customQty) || 1,
        category: "Custom",
        isCustom: true,
        notes: customNotes.trim(),
        gst: Number(customGst)
      }
    ]);
    setShowCustomForm(false);
    setCustomName("");
    setCustomPrice("");
    setCustomQty("1");
    setCustomNotes("");
    setCustomGst(String(defaultGstRate));
  };

  // Quantity popup states
  // ── Quantity Popup: saved products ──
  const [qtyPopupProduct, setQtyPopupProduct] = useState<ProductRow | null>(null);
  const [qtyPopupValue, setQtyPopupValue] = useState("1");
  const [qtyPopupError, setQtyPopupError] = useState<string | null>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // ── Quantity Popup: custom "Quick Add to Cart" items (no stock) ──
  const [quickItemPending, setQuickItemPending] = useState<{ name: string; price: number } | null>(null);
  const [quickItemQty, setQuickItemQty] = useState("1");
  const [quickItemError, setQuickItemError] = useState<string | null>(null);
  const quickItemQtyRef = useRef<HTMLInputElement>(null);

  // Auto-focus: saved product qty popup
  useEffect(() => {
    if (qtyPopupProduct) {
      setTimeout(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      }, 50);
    }
  }, [qtyPopupProduct]);

  // Auto-focus: custom item qty popup
  useEffect(() => {
    if (quickItemPending) {
      setTimeout(() => {
        quickItemQtyRef.current?.focus();
        quickItemQtyRef.current?.select();
      }, 50);
    }
  }, [quickItemPending]);

  // Allow the popup to open even for out-of-stock items so we can display
  // an explicit "Out of Stock" message instead of silently doing nothing.
  const selectProductForCart = (p: ProductRow) => {
    setQtyPopupProduct(p);
    setQtyPopupValue("1");
    setQtyPopupError(null);
  };

  const handleAddQtyConfirm = () => {
    if (!qtyPopupProduct) return;
    if (qtyPopupProduct.stock <= 0) { setQtyPopupProduct(null); return; }
    const requested = Number(qtyPopupValue);
    if (isNaN(requested) || requested <= 0) {
      setQtyPopupError("Please enter a valid positive quantity.");
      return;
    }
    const ex = cart.find(c => c.id === qtyPopupProduct.id);
    const currentInCart = ex ? ex.qty : 0;
    const totalNeeded = currentInCart + requested;

    if (totalNeeded > qtyPopupProduct.stock) {
      setQtyPopupError(`Only ${qtyPopupProduct.stock} unit${qtyPopupProduct.stock !== 1 ? "s" : ""} available (${currentInCart} already in cart).`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(c => c.id === qtyPopupProduct.id);
      if (existing) {
        return prev.map(c => c.id === qtyPopupProduct.id ? { ...c, qty: c.qty + requested } : c);
      }
      return [...prev, { id: qtyPopupProduct.id, name: qtyPopupProduct.name, price: qtyPopupProduct.price, qty: requested, category: qtyPopupProduct.category, gst: qtyPopupProduct.gst }];
    });

    setQtyPopupProduct(null);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleAddQtyCancel = () => {
    setQtyPopupProduct(null);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // ── Custom Quick Add handlers ──
  const handleQuickItemConfirm = () => {
    if (!quickItemPending) return;
    const requested = Number(quickItemQty);
    if (isNaN(requested) || requested <= 0) {
      setQuickItemError("Please enter a valid positive quantity.");
      return;
    }
    const id = Date.now();
    setCart(prev => [
      ...prev,
      { id, name: quickItemPending.name, price: quickItemPending.price, qty: requested, category: "Custom", gst: 0 },
    ]);
    setQuickItemPending(null);
    setQuickName("");
    setQuickPrice("");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleQuickItemCancel = () => {
    setQuickItemPending(null);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // Quick-add directly to cart without saving
  const [quickName, setQuickName] = useState("");
  const [quickPrice, setQuickPrice] = useState("");

  // Opens the custom item qty popup (no inline qty field in the bar anymore)
  const quickAddToCart = () => {
    if (!quickName.trim() || !quickPrice || Number(quickPrice) <= 0) return;
    setQuickItemPending({ name: quickName.trim(), price: Number(quickPrice) });
    setQuickItemQty("1");
    setQuickItemError(null);
  };

  const pressCalc = (ch: string) => setCalcExpr(s => s + ch);
  const backspaceCalc = () => setCalcExpr(s => s.slice(0, -1));
  const clearCalc = () => { setCalcExpr(""); setCalcResult(null); };
  const evalCalc = (): number | null => {
    if (!calcExpr.trim()) return null;
    try {
      // evaluate simple arithmetic expression
      // eslint-disable-next-line no-new-func
      const val = Function('"use strict";return (' + calcExpr + ')')();
      const num = Number(val);
      if (!isFinite(num)) throw new Error("invalid");
      setCalcResult(num);
      return num;
    } catch {
      setCalcResult(null);
      return null;
    }
  };

  const [paidAmount, setPaidAmount] = useState("");

  const applyCalc = (target: "discount" | "quickPrice" | "gst" | "paid") => {
    const val = evalCalc();
    if (val === null) return;
    if (target === "discount") setDiscount(Math.max(0, Math.min(50, Math.round(val))));
    else if (target === "quickPrice") setQuickPrice(String(val));
    else if (target === "gst") setGstRate(Math.max(0, Math.min(100, Math.round(val))));
    else if (target === "paid") setPaidAmount(String(val));
    setCalcOpen(false);
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id === id) {
        const product = productRows.find(p => p.id === id);
        const maxStock = product ? product.stock : Infinity;
        return { ...c, qty: Math.min(Math.max(1, c.qty + delta), maxStock) };
      }
      return c;
    }));
  };

  const removeItem = (id: number) => setCart(prev => prev.filter(c => c.id !== id));

  // GST-EXCLUSIVE: GST is added on top of the selling price.
  // Grand Total = Subtotal - Discount + Tax
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discAmt = Math.round(subtotal * discount / 100);
  const taxable = subtotal - discAmt;
  const computedTax = applyGst
    ? cart.reduce((s, c) => {
        const rate = c.gst ?? 0;
        const lineTotal = (c.price * c.qty) * (1 - discount / 100);
        return s + lineTotal * rate / 100;
      }, 0)
    : 0;
  const tax = Math.round(computedTax * 100) / 100;
  const total = taxable + tax;

  const filteredCustomers = useMemo(() => {
    const s = customerSearch.toLowerCase();
    return customers.filter(c => {
      const matchType = customerTypeFilter === "All" || c.type === customerTypeFilter;
      const matchSearch = c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.company || "").toLowerCase().includes(s) || (c.gstin || "").toLowerCase().includes(s) || (c.customerCode || "").toLowerCase().includes(s);
      return matchType && matchSearch;
    });
  }, [customers, customerSearch, customerTypeFilter]);

  const selectedCustomerObj = useMemo(() => customers.find(c => c.name === customer), [customers, customer]);

  const saveNewCustomer = () => {
    if (!newCustName.trim()) return;
    // In a real app we'd dispatch an action to add the customer to the backend.
    // Here we'll just set the active customer to what the user typed.
    setCustomer(newCustName);
    setCustomerCompany(newCustCompany);
    setShowNewCustomerForm(false);
    setNewCustName(""); setNewCustPhone(""); setNewCustCompany(""); setNewCustGst("");
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {/* LEFT: Products */}
      <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden bg-white">

        {/* Business Date Banner */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-blue-100 bg-blue-50/60">
          <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-blue-700">Business Date:</span>
          <span className="text-xs font-bold text-blue-900 font-mono">
            {new Date(businessDate + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Quick Add to Cart bar */}
        <div className="px-4 pt-4 pb-3 border-b border-border bg-blue-50">
          <p className="text-xs font-semibold text-blue-700 mb-2">Quick Add to Cart</p>
          <div className="flex gap-2">
            <input
              value={quickName} onChange={e => setQuickName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Item name..."
              onKeyDown={e => e.key === "Enter" && quickAddToCart()}
            />
            <input
              value={quickPrice} onChange={e => setQuickPrice(e.target.value)}
              type="number" min="0"
              className="w-24 px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="₹ Price"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
              onKeyDown={e => e.key === "Enter" && quickAddToCart()}
            />
            <button
              onClick={quickAddToCart}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Frequently Sold Items */}
        {productRows.length > 0 && (
          <div className="px-4 py-3 border-b border-border bg-white">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /> Frequently Sold</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {productRows.slice(0, 6).map(p => (
                <button key={p.id} onClick={() => selectProductForCart(p)}
                  className={`px-3 py-1.5 border border-border rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    p.stock <= 0
                      ? "bg-red-50 border-red-200 text-red-500 cursor-pointer"
                      : "bg-gray-50 hover:bg-gray-100 text-foreground"
                  }`}
                >
                  <Package className="w-3 h-3 text-blue-500" />
                  {p.name}
                  {p.stock <= 0 && <span className="ml-0.5 font-bold text-red-500">×</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saved Products Toolbar */}
        <div className="px-4 pt-3 pb-2 border-b border-border bg-white space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="Search saved items... (F3)"
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Save Item
            </button>
          </div>
          {/* Category pills */}
          {productRows.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {usedCategories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >{c}</button>
              ))}
            </div>
          )}
        </div>

        {/* Saved Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {productRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-blue-300" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No saved items yet</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                Use <strong>Quick Add</strong> above to add items directly to the cart, or <strong>Save Item</strong> to build your product list for reuse.
              </p>
              <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Save Your First Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(p => (
                <div
                  key={p.id}
                  className="bg-white border border-border rounded-xl p-3.5 hover:border-blue-300 hover:shadow-md transition-all group relative"
                >
                  {/* Edit / Delete */}
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                    <button onClick={() => openEdit(p)} className="w-6 h-6 rounded bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Edit2 className="w-3 h-3 text-blue-600" />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="w-6 h-6 rounded bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                  <button onClick={() => selectProductForCart(p)} disabled={p.stock <= 0} className="w-full text-left disabled:opacity-70">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 transition-colors ${p.stock <= 0 ? "bg-red-50 group-hover:bg-red-100" : "bg-blue-50 group-hover:bg-blue-100"}`}>
                      <Package className={`w-4 h-4 ${p.stock <= 0 ? "text-red-500" : "text-blue-600"}`} />
                    </div>
                    {p.stock <= 0 && <span className="absolute top-2 left-2 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">OUT OF STOCK</span>}
                    <p className="text-sm font-medium text-foreground leading-tight mb-1 pr-12 truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground mb-2 truncate">{p.category} · <span className={p.stock <= 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>Stock: {p.stock}</span></p>
                    {p.cost !== undefined && (
                      <p className="text-xs text-muted-foreground mb-1 line-through" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {fmt(p.cost)}
                      </p>
                    )}
                    <p className="text-base font-bold text-blue-700" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {fmt(p.price)}
                    </p>
                  </button>
                </div>
              ))}
              {/* Always-visible Add tile */}
              <button
                onClick={openAdd}
                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-3.5 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50 transition-all group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                </div>
                <p className="text-xs font-medium text-muted-foreground group-hover:text-blue-600">Add Item</p>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">{editId ? "Edit Item" : "Save New Item"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Item Name *</label>
                <input
                  value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="e.g. A4 Notebook 200pg"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Selling Price (₹) *</label>
                <input
                  type="number" min="0" value={formPrice} onChange={e => setFormPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="0.00"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Cost Price (₹)</label>
                <input
                  type="number" min="0" value={formCost} onChange={e => setFormCost(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="0.00"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Category</label>
                <select
                  value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {["Books", "Stationery", "School", "Office", "Gifts", "Toys", "Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">GST Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={100} value={formGst}
                    onChange={e => setFormGst(e.target.value)}
                    className="w-20 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                    placeholder="0"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {[0, 5, 12, 18, 28].map(r => (
                      <button
                        key={r} type="button"
                        onClick={() => setFormGst(String(r))}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${Number(formGst) === r
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-foreground border-border hover:border-blue-300"
                          }`}
                      >{r}%</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={saveProduct}
                disabled={!formName.trim() || !formPrice || Number(formPrice) <= 0}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {editId ? "Save Changes" : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Create New Customer</h2>
              <button onClick={() => setShowNewCustomerForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name *</label>
                  <input value={newCustName} onChange={e => setNewCustName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter name" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
                  <input value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10-digit number" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Customer Type</label>
                  <select value={newCustType} onChange={e => setNewCustType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale / Khata</option>
                    <option value="School">School</option>
                    <option value="College">College</option>
                    <option value="Office">Office</option>
                    <option value="Bank">Bank</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company / Institution Name</label>
                  <input value={newCustCompany} onChange={e => setNewCustCompany(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN</label>
                  <input value={newCustGst} onChange={e => setNewCustGst(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional GST Number" />
                </div>
              </div>
              <button onClick={saveNewCustomer} disabled={!newCustName.trim()} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Save & Select Customer</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Item Modal */}
      {showCustomForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">Add Custom Item</h2>
              <button onClick={() => setShowCustomForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Item Name *</label>
                <input
                  value={customName} onChange={e => setCustomName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="e.g. Binding Charges"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-foreground mb-1.5">Price (₹) *</label>
                  <input
                    type="number" min="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-foreground mb-1.5">Qty</label>
                  <input
                    type="number" min="1" value={customQty} onChange={e => setCustomQty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">GST Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="100" value={customGst} onChange={e => setCustomGst(e.target.value)}
                    className="w-20 px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {[0, 5, 12, 18, 28].map(r => (
                      <button key={r} type="button" onClick={() => setCustomGst(String(r))} className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${Number(customGst) === r ? "bg-blue-600 text-white border-blue-600" : "bg-white text-foreground border-border hover:border-blue-300"}`}>{r}%</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Notes (Optional)</label>
                <input
                  value={customNotes} onChange={e => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="e.g. Urgent Delivery"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCustomForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={addCustomToCart} disabled={!customName.trim() || !customPrice || Number(customPrice) <= 0} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40">Add to Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* Right: Cart + Bill */}
      <div className="w-96 flex flex-col bg-white border-l border-gray-200 shrink-0">
        {/* Clean Customer/Khata Account Selector */}
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer / Khata Account</label>
            {customer && (
              <button onClick={() => { setCustomer(""); setCustomerCompany(""); setCustomerType("Retail Customer"); }} className="text-[10px] text-red-500 font-bold hover:underline">Clear</button>
            )}
          </div>
          <div className="flex gap-2 mb-2">
            <select
              value={customerType}
              onChange={e => setCustomerType(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            >
              {(settings.customerTypes || ["School", "College", "Bank", "Office", "Company", "Government", "Retail Customer", "Khata Customer"]).map(ct => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select
              ref={custSearchRef}
              value={customers.some(c => c.name === customer) ? customer : ""}
              onChange={e => {
                const val = e.target.value;
                setCustomer(val);
                const m = customers.find(c => c.name === val);
                if (m) {
                  setCustomerCompany(m.company || "");
                  setCustomerType("Khata Customer");
                } else {
                  setCustomerCompany("");
                }
              }}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            >
              <option value="">— Optional Customer Name —</option>
              {customers.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.phone ? `(${c.phone})` : ""} {(c.dueAmount || 0) > 0 ? ` · Due ₹${(c.dueAmount || 0).toLocaleString("en-IN")}` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewCustomerForm(true)}
              className="px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-200 flex items-center justify-center transition-colors"
              title="Add New Customer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {customer && selectedCustomerObj && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-[11px] flex items-center justify-between shadow-sm">
              <div>
                <span className="font-semibold text-orange-950">{customer}</span>
                <span className="mx-1 text-orange-300">•</span>
                <span className="text-orange-800">Due: <strong>₹{(selectedCustomerObj.dueAmount || 0).toLocaleString("en-IN")}</strong></span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 bg-orange-200 text-orange-800 font-bold rounded uppercase">{selectedCustomerObj.type}</span>
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Cart ({cart.length} items)</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowCustomForm(true)} className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Custom Item</button>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Clear all</button>
                )}
              </div>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {cart.length === 0 && (
              <div className="py-12 text-center">
                <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Cart is empty</p>
                <p className="text-xs text-muted-foreground">Click products to add them</p>
              </div>
            )}
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                  {item.notes && <p className="text-[10px] text-muted-foreground truncate italic">{item.notes}</p>}
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {fmt(item.price)} × {item.qty}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-semibold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center transition-colors ml-0.5">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary (Sidebar Footer) */}
        <div className="border-t border-border p-5 space-y-4 bg-white">
          <div className="flex justify-between font-bold text-foreground text-xl">
            <span>Total Amount</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmt(total)}</span>
          </div>
          <button
            onClick={() => setShowCheckoutModal(true)}
            disabled={cart.length === 0}
            className="w-full py-4 rounded-xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" /> Proceed to Checkout ({cart.length} items)
          </button>
        </div>
      </div>

      {/* Print Animation Overlay */}
      {isPrinting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center w-80 text-center animate-in zoom-in duration-300">
            {printStep === 1 && <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>}
            {printStep === 2 && <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />}
            {printStep === 3 && <Printer className="w-12 h-12 text-blue-500 animate-bounce mb-4" />}
            {printStep === 4 && <CheckCircle className="w-12 h-12 text-green-500 mb-4" />}

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {printStep === 1 && "Preparing Invoice..."}
              {printStep === 2 && "Validating Inventory..."}
              {printStep === 3 && "Generating PDF..."}
              {printStep === 4 && "Ready to Print ✓"}
            </h3>
            <p className="text-sm text-gray-500">Please wait</p>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><CreditCard className="w-6 h-6 text-blue-600" /> Checkout Portal</h2>
              <button onClick={() => setShowCheckoutModal(false)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Customer & Invoice Details */}
              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">Bill Type</label>
                  <select value={billType} onChange={e => setBillType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="Cash Bill">Cash Bill</option>
                    <option value="Quotation">Quotation</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                  <h3 className="text-sm font-bold text-blue-800">Customer Information</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Customer Name</label>
                    <input list="customers-list" value={customer} onChange={e => {
                      setCustomer(e.target.value);
                      const match = customers.find(c => c.name === e.target.value);
                      if (match && match.type === "Corporate" || match?.type === "School") setCustomerCompany(match.name);
                    }} placeholder="Optional customer name" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500" />
                    <datalist id="customers-list">
                      {customers.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Customer Company (Optional)</label>
                    <input list="companies-list" type="text" value={customerCompany} onChange={e => setCustomerCompany(e.target.value)} placeholder="Type customer's company name" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Billed By (For Company)</label>
                  <input list="companies-list" type="text" value={billingCompany} onChange={e => setBillingCompany(e.target.value)} placeholder="e.g. Sri Vishnu Priya (Leave blank for default)" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                  <datalist id="companies-list">
                    {settings?.companyList?.map((c: string) => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Discount %</label>
                    <input type="number" min={0} max={50} value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center"><label className="text-sm font-semibold text-gray-700">GST %</label><button onClick={() => setApplyGst(g => !g)} className={`relative w-9 h-5 rounded-full transition-colors ${applyGst ? "bg-blue-600" : "bg-gray-300"}`}><span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${applyGst ? "translate-x-4" : "translate-x-0"}`} /></button></div>
                    <input type="number" min={0} max={100} value={gstRate} onChange={e => setGstRate(Math.max(0, Math.min(100, Number(e.target.value))))} disabled={!applyGst} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing & Payment */}
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner space-y-2.5">
                  <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span className="font-mono">{fmt(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount ({discount}%)</span><span className="font-mono">-{fmt(discAmt)}</span></div>}
                  {applyGst ? <div className="flex justify-between text-sm text-blue-600"><span>GST ({gstRate}%)</span><span className="font-mono">+{fmt(tax)}</span></div> : <div className="flex justify-between text-sm text-gray-400"><span>GST (Disabled)</span><span>–</span></div>}
                  <div className="border-t border-gray-300 my-2"></div>
                  <div className="flex justify-between font-black text-gray-900 text-xl"><span>Grand Total</span><span className="font-mono">{fmt(total)}</span></div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">Payment Method</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ method: "Cash", icon: Banknote }, { method: "UPI", icon: Smartphone }, { method: "Card", icon: CreditCard }, { method: "Khata", icon: Book }].map(({ method, icon: Icon }) => (
                      <button key={method} onClick={() => { setPayMethod(method); if (method !== "Khata") { setCustomer(""); setCustomerCompany(""); } }} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-bold transition-all ${payMethod === method ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-blue-200 hover:bg-blue-50/30"}`}>
                        <Icon className="w-5 h-5" /> {method}
                      </button>
                    ))}
                  </div>

                  {payMethod === "Khata" && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-orange-800 flex items-center gap-1.5"><Book className="w-3.5 h-3.5" />Khata Customer</p>
                      {customer && customers.find(c => c.name === customer) ? (
                        <div className="flex items-center justify-between bg-white border border-orange-300 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{customer}</p>
                            <p className="text-xs text-orange-600">Due: ₹{(customers.find(c => c.name === customer)?.dueAmount || 0).toLocaleString("en-IN")}{customers.find(c => c.name === customer)?.creditLimit ? ` · Limit: ₹${(customers.find(c => c.name === customer)?.creditLimit || 0).toLocaleString("en-IN")}` : ""}</p>
                          </div>
                          <button onClick={() => { setCustomer(""); setCustomerCompany(""); }} className="ml-3 w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors text-sm font-bold" title="Deselect">✕</button>
                        </div>
                      ) : (
                        <div className="relative">
                          <select value={customer} onChange={e => { setCustomer(e.target.value); const m = customers.find(c => c.name === e.target.value); if (m) setCustomerCompany(m.company || ""); }} className="w-full px-3 py-2 pr-8 rounded-lg border border-orange-300 text-sm bg-white focus:ring-2 focus:ring-orange-400 appearance-none">
                            <option value="">— Select Khata Customer —</option>
                            {customers.map(c => <option key={c.id} value={c.name}>{c.name}{(c.dueAmount || 0) > 0 ? ` · Due ₹${(c.dueAmount || 0).toLocaleString("en-IN")}` : ""}</option>)}
                          </select>
                          <ChevronDown className="w-4 h-4 text-orange-500 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Amount Received</label>
                    <input type="number" min={0} value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-lg font-mono font-bold focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-gray-600">{Number(paidAmount) >= total ? "Change to Return" : "Balance Due"}</label>
                    <div className={`px-3 py-2 rounded-lg border text-lg font-mono font-bold ${Number(paidAmount) >= total ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                      {fmt((Number(paidAmount) || 0) - total)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-100 border-t flex items-center justify-end gap-3">
              <button onClick={() => {
                onPreviewReceipt({ items: cart, paymentMethod: payMethod, customer: customer || customerType, customerType, customerCompany, billingCompany, subtotal, tax, total, paidAmount: Number(paidAmount) || total, change: (Number(paidAmount) || total) - total, billType });
                setShowCheckoutModal(false);
                setScreen("receipt");
              }} className="px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                <FileText className="w-4 h-4" /> Preview Bill
              </button>
              <button onClick={async () => {
                if (payMethod === "Khata") {
                  if (!customer) { alert("Khata (Credit) billing requires a valid Customer Name!"); return; }
                  const custData = customers.find(c => c.name === customer);
                  if (custData && custData.creditLimit && ((custData.dueAmount || 0) + total > custData.creditLimit)) { if (!window.confirm("⚠️ WARNING: This sale exceeds the Customer's Credit Limit! Approve anyway?")) return; }
                }

                setIsPrinting(true);
                setPrintStep(1); await new Promise(r => setTimeout(r, 500));
                setPrintStep(2); await new Promise(r => setTimeout(r, 500));
                setPrintStep(3); await new Promise(r => setTimeout(r, 500));
                setPrintStep(4); await new Promise(r => setTimeout(r, 300));
                setIsPrinting(false);

                await onCompleteSale({ items: cart, paymentMethod: payMethod, customer: customer || customerType, customerType, customerCompany, billingCompany, subtotal, tax, total, billType });
                setShowCheckoutModal(false);
              }} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Complete Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Selector Modal — Saved Products */}
      {qtyPopupProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-blue-50 px-5 py-4 border-b border-blue-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900 text-sm">Add to Cart</h3>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Product</span>
                <span className="text-sm font-semibold text-gray-800 block mt-0.5">{qtyPopupProduct.name}</span>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                <span className="text-xs font-semibold text-gray-500">Available Stock</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  qtyPopupProduct.stock <= 0 ? "bg-red-100 text-red-700" :
                  qtyPopupProduct.stock < 10 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                }`}>
                  {qtyPopupProduct.stock <= 0 ? "Out of Stock" : `${qtyPopupProduct.stock} units`}
                </span>
              </div>

              {qtyPopupProduct.stock <= 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm font-bold text-red-600">This item is out of stock.</p>
                  <p className="text-xs text-red-400 mt-1">Restock it from the Inventory screen.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Quantity</label>
                  <input
                    ref={qtyInputRef}
                    value={qtyPopupValue}
                    onChange={e => { setQtyPopupValue(e.target.value); setQtyPopupError(null); }}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); handleAddQtyConfirm(); }
                      else if (e.key === "Escape") { e.preventDefault(); handleAddQtyCancel(); }
                    }}
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-center font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                    placeholder="Enter quantity"
                  />
                  {qtyPopupError && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {qtyPopupError}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleAddQtyCancel}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQtyConfirm}
                disabled={qtyPopupProduct.stock <= 0}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Selector Modal — Custom "Quick Add to Cart" Items */}
      {quickItemPending && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-green-50 px-5 py-4 border-b border-green-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900 text-sm">Quick Add to Cart</h3>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Item Name</span>
                <span className="text-sm font-semibold text-gray-800 block mt-0.5">{quickItemPending.name}</span>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                <span className="text-xs font-semibold text-gray-500">Unit Price</span>
                <span className="text-sm font-bold text-gray-800 font-mono">₹{quickItemPending.price.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Quantity</label>
                <input
                  ref={quickItemQtyRef}
                  value={quickItemQty}
                  onChange={e => { setQuickItemQty(e.target.value); setQuickItemError(null); }}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); handleQuickItemConfirm(); }
                    else if (e.key === "Escape") { e.preventDefault(); handleQuickItemCancel(); }
                  }}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-center font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white"
                  placeholder="Enter quantity"
                />
                {quickItemError && (
                  <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {quickItemError}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleQuickItemCancel}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickItemConfirm}
                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
interface ProductRow {
  id: number; name: string; category: string; stock: number;
  price: number; supplier: string; status: string; gst: number;
  cost?: number;
  barcode?: string;
  isbn?: string; author?: string; publisher?: string; classStd?: string;
}

// ─── Bulk Import helpers ───────────────────────────────────────────────────────
interface BImportRow {
  id: string;
  name: string; category: string; stock: string; price: string; cost: string; gst: string; supplier: string; barcode: string;
  errors: string[]; warnings: string[];
  existingProduct?: ProductRow;
  action: "create_new" | "add_stock" | "update" | "skip";
}

const BULK_COL_MAP: Record<string, string> = {
  product: "name", "product name": "name", "item name": "name", item: "name", name: "name",
  description: "name", particulars: "name", goods: "name", "product desc": "name",
  category: "category", "category name": "category", type: "category", dept: "category", group: "category",
  quantity: "stock", qty: "stock", stock: "stock", "opening stock": "stock", units: "stock", available: "stock", pieces: "stock", pcs: "stock", nos: "stock",
  "purchase price": "cost", "cost price": "cost", "buying price": "cost", cost: "cost", cp: "cost", purchase: "cost", "p.price": "cost", "buy price": "cost",
  "selling price": "price", "sale price": "price", mrp: "price", price: "price", sp: "price", rate: "price", selling: "price", "s.price": "price",
  gst: "gst", "gst %": "gst", "gst%": "gst", tax: "gst", "tax %": "gst", "tax%": "gst", "gst rate": "gst", "tax rate": "gst",
  supplier: "supplier", vendor: "supplier", brand: "supplier", manufacturer: "supplier",
  barcode: "barcode", sku: "barcode", isbn: "barcode", code: "barcode", "product code": "barcode", "item code": "barcode",
};

function mapBulkColHeader(h: string): string | null {
  return BULK_COL_MAP[h.toLowerCase().trim()] ?? null;
}

function validateBImportRow(row: BImportRow, existing: ProductRow[]): BImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!row.name.trim()) errors.push("Product name required");
  const p = parseFloat(row.price);
  if (!row.price || isNaN(p) || p < 0) errors.push("Invalid selling price");
  if (row.stock) { const s = parseFloat(row.stock); if (isNaN(s) || s < 0) errors.push("Invalid quantity"); }
  if (row.cost) { const c = parseFloat(row.cost); if (isNaN(c) || c < 0) warnings.push("Check purchase price"); }
  if (row.gst) { const g = parseFloat(row.gst); if (isNaN(g) || g < 0 || g > 100) warnings.push("GST should be 0–100"); }
  const existingProd = existing.find(ep =>
    ep.name.trim().toLowerCase() === row.name.trim().toLowerCase() ||
    (row.barcode && ep.barcode && ep.barcode === row.barcode)
  );
  return { ...row, errors, warnings, existingProduct: existingProd };
}

function parseCsvToRawRows(text: string): Record<string, string>[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[,\t|]/).map(h => h.trim().replace(/^"|"$/g, ""));
  const mapped = headers.map(mapBulkColHeader);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(/[,\t|]/).map(c => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    mapped.forEach((field, idx) => { if (field) row[field] = cells[idx] || ""; });
    if (row.name || row.price) rows.push(row);
  }
  return rows;
}

function parseOcrTextToRows(text: string): Record<string, string>[] {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2);
  let headerIdx = -1;
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes("product") || lower.includes("item") || lower.includes("name") || lower.includes("qty") || lower.includes("price")) {
      headerIdx = i; break;
    }
  }
  if (headerIdx >= 0) {
    const headers = lines[headerIdx].split(/\s{2,}|\t/).filter(Boolean);
    const mapped = headers.map(mapBulkColHeader);
    const rows: Record<string, string>[] = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cells = lines[i].split(/\s{2,}|\t/).filter(Boolean);
      if (cells.length < 2) continue;
      const row: Record<string, string> = {};
      mapped.forEach((field, idx) => { if (field) row[field] = cells[idx] || ""; });
      if (row.name || row.price) rows.push(row);
    }
    return rows;
  }
  const rows: Record<string, string>[] = [];
  for (const line of lines) {
    const numbers = line.match(/\d+(\.\d+)?/g) || [];
    const namePart = line.replace(/\d+(\.\d+)?/g, "").replace(/[^a-zA-Z0-9\s.\-]/g, "").trim();
    if (namePart.length > 2 && numbers.length >= 1) {
      rows.push({ name: namePart, price: numbers[numbers.length - 1] || "", stock: numbers.length >= 2 ? (numbers[0] || "") : "" });
    }
  }
  return rows;
}

function BulkStockImportModal({ existingProducts, onClose, onImportDone }: {
  existingProducts: ProductRow[]; onClose: () => void; onImportDone: () => void;
}) {
  const [step, setStep] = useState<"upload" | "review" | "importing" | "done">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [importRows, setImportRows] = useState<BImportRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number }>({ created: 0, updated: 0, skipped: 0 });
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingMsg("Reading file…");
    setOcrProgress(0);
    try {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      let rawRows: Record<string, string>[] = [];

      if (ext === "csv") {
        const text = await file.text();
        rawRows = parseCsvToRawRows(text);
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        if (jsonData.length < 2) throw new Error("No data rows found in spreadsheet.");
        const headers: string[] = (jsonData[0] as any[]).map((h: any) => String(h ?? "").trim());
        const mapped = headers.map(mapBulkColHeader);
        for (let i = 1; i < jsonData.length; i++) {
          const cells: any[] = jsonData[i] as any[];
          const row: Record<string, string> = {};
          mapped.forEach((field, idx) => { if (field && cells[idx] !== undefined) row[field] = String(cells[idx]).trim(); });
          if (row.name || row.price) rawRows.push(row);
        }
      } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        setProcessingMsg("Running OCR on image… this may take 20–40 s");
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng", 1, {
          logger: (m: any) => {
            if (m.status === "recognizing text") setOcrProgress(Math.round((m.progress || 0) * 100));
          }
        });
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();
        rawRows = parseOcrTextToRows(text);
      } else {
        throw new Error("Unsupported file. Use .xlsx, .xls, .csv, .jpg, .png, or .webp");
      }

      if (rawRows.length === 0) throw new Error("No products detected. Check file format and try again.");
      setProcessingMsg("Validating rows…");

      const parsed: BImportRow[] = rawRows.map((r, i) => {
        const row: BImportRow = {
          id: `r-${i}-${Date.now()}`,
          name: r.name || "", category: r.category || "Stationery",
          stock: r.stock || "0", price: r.price || "", cost: r.cost || "",
          gst: r.gst || "18", supplier: r.supplier || "", barcode: r.barcode || "",
          errors: [], warnings: [], action: "create_new",
        };
        const validated = validateBImportRow(row, existingProducts);
        return { ...validated, action: validated.existingProduct ? "add_stock" as const : "create_new" as const };
      });

      setImportRows(parsed);
      setStep("review");
    } catch (err: any) {
      alert(err.message || "Failed to process file");
    } finally {
      setIsProcessing(false);
      setProcessingMsg("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const updateRow = (id: string, field: keyof BImportRow, value: string) => {
    setImportRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      return validateBImportRow(updated, existingProducts);
    }));
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Product Name", "Category", "Quantity", "Selling Price (MRP)", "Purchase Price (Cost)", "GST %", "Supplier", "Barcode/SKU"],
      ["Classmate Notebook 200pg", "Stationery", "50", "45", "32", "18", "ITC", "8901234567890"],
      ["NCERT Maths Class 10", "Books", "30", "280", "210", "0", "NCERT", ""],
    ]);
    ws["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 18 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Import");
    XLSX.writeFile(wb, "Stock_Import_Template.xlsx");
  };

  const confirmImport = async () => {
    const toImport = importRows.filter(r => r.action !== "skip" && r.errors.length === 0);
    if (toImport.length === 0) { alert("No valid rows to import. Fix errors or mark rows to skip."); return; }
    setStep("importing");
    setImportProgress(0);
    setImportError("");
    try {
      const items = toImport.map(r => ({
        name: r.name.trim(), category: r.category || "Stationery",
        stock: parseFloat(r.stock) || 0, price: parseFloat(r.price) || 0,
        cost: r.cost ? parseFloat(r.cost) : undefined,
        gst: parseFloat(r.gst) || 18, supplier: r.supplier || "",
        barcode: r.barcode || "",
        action: r.action, existingId: r.existingProduct?.id,
      }));
      const BATCH = 50;
      let created = 0, updated = 0, skipped = 0;
      for (let i = 0; i < items.length; i += BATCH) {
        const batch = items.slice(i, i + BATCH);
        const res = await fetch("/api/products/bulk", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: batch }),
        });
        if (!res.ok) throw new Error("Bulk import API failed");
        const d = await res.json();
        created += d.createdCount || 0; updated += d.updatedCount || 0; skipped += d.skippedCount || 0;
        setImportProgress(Math.round(((i + batch.length) / items.length) * 100));
      }
      setImportResult({ created, updated, skipped });
      setStep("done");
      onImportDone();
    } catch (err: any) {
      setImportError(err.message || "Import failed");
      setStep("review");
    }
  };

  const validCount = importRows.filter(r => r.action !== "skip" && r.errors.length === 0).length;
  const errorCount = importRows.filter(r => r.errors.length > 0).length;
  const dupCount = importRows.filter(r => r.existingProduct).length;

  const ACTION_COLORS: Record<string, string> = {
    create_new: "bg-green-100 text-green-800",
    add_stock: "bg-blue-100 text-blue-800",
    update: "bg-amber-100 text-amber-800",
    skip: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Bulk Stock Import</h2>
              <p className="text-xs text-gray-500">Excel, CSV, or photo — add many products at once</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* STEP: Upload */}
        {step === "upload" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all select-none ${
                isDragging ? "border-indigo-500 bg-indigo-50 scale-[1.01]" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
              } ${isProcessing ? "pointer-events-none opacity-70" : ""}`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="font-semibold text-gray-700">{processingMsg}</p>
                  {ocrProgress > 0 && (
                    <div className="w-64 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full transition-all" style={{ width: `${ocrProgress}%` }} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-7 h-7 text-indigo-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-800 mb-1">Drop your file here</p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {["Excel (.xlsx)", "CSV (.csv)", "Photo (.jpg .png)"].map(f => (
                      <span key={f} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 shadow-sm">{f}</span>
                    ))}
                  </div>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-800 text-sm">Excel / CSV</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">Columns detected automatically. Aliases like "Qty", "MRP", "CP", "Rate" are all understood.</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-purple-800 text-sm">Photo / Image</span>
                </div>
                <p className="text-xs text-purple-700 leading-relaxed">Photograph a stock list or supplier invoice. OCR extracts products automatically. Review before saving.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="font-semibold text-gray-800 text-sm">Need a template?</p>
                <p className="text-xs text-gray-500">Download the pre-formatted Excel file with sample data and all supported columns</p>
              </div>
              <button onClick={e => { e.stopPropagation(); downloadTemplate(); }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
          </div>
        )}

        {/* STEP: Review */}
        {step === "review" && (
          <>
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-5 flex-wrap flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">{importRows.length} rows detected</span>
              {dupCount > 0 && <span className="text-sm text-blue-700 font-medium">⚠ {dupCount} duplicates found</span>}
              {errorCount > 0 && <span className="text-sm text-red-600 font-medium">✗ {errorCount} errors</span>}
              <span className="text-sm text-green-700 font-medium ml-auto">✓ {validCount} ready to import</span>
              {importError && <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{importError}</span>}
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    {["Product Name", "Category", "Qty", "Sell ₹", "Cost ₹", "GST%", "Action"].map(h => (
                      <th key={h} className="text-left font-semibold text-gray-600 px-3 py-2.5 border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importRows.map(r => (
                    <tr key={r.id} className={`border-b border-gray-100 transition-colors ${
                      r.action === "skip" ? "opacity-40" :
                      r.errors.length > 0 ? "bg-red-50" :
                      r.existingProduct ? "bg-blue-50/40" : "hover:bg-gray-50/50"
                    }`}>
                      <td className="px-2 py-1.5 min-w-44">
                        <input value={r.name} onChange={e => updateRow(r.id, "name", e.target.value)}
                          className={`w-full px-2 py-1 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                            r.errors.some(e => e.includes("name")) ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
                          }`} />
                        {r.existingProduct && <p className="text-indigo-600 text-[10px] mt-0.5">Existing: stock={r.existingProduct.stock}</p>}
                        {r.errors.map(e => <p key={e} className="text-red-600 text-[10px]">{e}</p>)}
                        {r.warnings.map(w => <p key={w} className="text-amber-600 text-[10px]">{w}</p>)}
                      </td>
                      <td className="px-2 py-1.5 min-w-28">
                        <select value={r.category} onChange={e => updateRow(r.id, "category", e.target.value)}
                          className="w-full px-1.5 py-1 rounded border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          {categories.slice(1).map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 w-16">
                        <input type="number" value={r.stock} onChange={e => updateRow(r.id, "stock", e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" style={{ fontFamily: "monospace" }} />
                      </td>
                      <td className="px-2 py-1.5 w-20">
                        <input type="number" value={r.price} onChange={e => updateRow(r.id, "price", e.target.value)}
                          className={`w-full px-2 py-1 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                            r.errors.some(e => e.includes("price")) ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
                          }`} style={{ fontFamily: "monospace" }} />
                      </td>
                      <td className="px-2 py-1.5 w-20">
                        <input type="number" value={r.cost} onChange={e => updateRow(r.id, "cost", e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" style={{ fontFamily: "monospace" }} />
                      </td>
                      <td className="px-2 py-1.5 w-14">
                        <input type="number" value={r.gst} onChange={e => updateRow(r.id, "gst", e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" style={{ fontFamily: "monospace" }} />
                      </td>
                      <td className="px-2 py-1.5 min-w-32">
                        <select value={r.action} onChange={e => updateRow(r.id, "action", e.target.value)}
                          className={`w-full px-1.5 py-1 rounded border border-gray-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400 ${ACTION_COLORS[r.action] || ""}`}>
                          <option value="create_new">Create New</option>
                          {r.existingProduct && <option value="add_stock">Add to Stock</option>}
                          {r.existingProduct && <option value="update">Update Info</option>}
                          <option value="skip">Skip</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
              <button onClick={() => { setStep("upload"); setImportRows([]); }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                ← Back
              </button>
              <button onClick={() => setImportRows(prev => prev.map(r => ({ ...r, action: "skip" as const })))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                Skip All
              </button>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-gray-500">{validCount} products will be imported</span>
                <button onClick={confirmImport} disabled={validCount === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 shadow-sm">
                  <Check className="w-4 h-4" /> Confirm Import
                </button>
              </div>
            </div>
          </>
        )}

        {/* STEP: Importing */}
        {step === "importing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg mb-1">Importing products…</p>
              <p className="text-gray-500 text-sm">Please don't close this window</p>
            </div>
            <div className="w-72 bg-gray-200 rounded-full h-3">
              <div className="bg-indigo-600 h-3 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
            </div>
            <p className="text-indigo-700 font-semibold text-sm">{importProgress}%</p>
          </div>
        )}

        {/* STEP: Done */}
        {step === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-xl mb-1">Import Complete!</p>
              <p className="text-gray-500 text-sm">Your stock catalogue has been updated</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{importResult.created}</p>
                <p className="text-xs text-gray-500 mt-1">New Products</p>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{importResult.updated}</p>
                <p className="text-xs text-gray-500 mt-1">Updated</p>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-400">{importResult.skipped}</p>
                <p className="text-xs text-gray-500 mt-1">Skipped</p>
              </div>
            </div>
            <button onClick={onClose}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsScreen({ productRows: rows, onSaveProduct, onDeleteProduct, onRefresh }: { productRows: ProductRow[]; onSaveProduct: (product: Omit<ProductRow, "status">) => void; onDeleteProduct: (id: number) => void; onRefresh: () => void; }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [filterSupplier, setFilterSupplier] = useState("All");
  const [filterPublisher, setFilterPublisher] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // form fields
  const [fName, setFName] = useState("");
  const [fBarcode, setFBarcode] = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fCost, setFCost] = useState("");
  const [fCategory, setFCategory] = useState("Stationery");
  const [fStock, setFStock] = useState("");
  const [fSupplier, setFSupplier] = useState("");
  const [fGst, setFGst] = useState("18");
  const [fIsbn, setFIsbn] = useState("");
  const [fAuthor, setFAuthor] = useState("");
  const [fPublisher, setFPublisher] = useState("");
  const [fClassStd, setFClassStd] = useState("");

  const openAdd = () => {
    setFName(""); setFBarcode(""); setFPrice(""); setFCost("");
    setFCategory("Stationery"); setFStock(""); setFSupplier(""); setFGst("18");
    setFIsbn(""); setFAuthor(""); setFPublisher(""); setFClassStd("");
    setEditing(null); setModal("add");
  };

  const openEdit = (p: ProductRow) => {
    setFName(p.name); setFBarcode(""); setFPrice(String(p.price));
    setFCost(p.cost ? String(p.cost) : ""); setFCategory(p.category); setFStock(String(p.stock));
    setFSupplier(p.supplier); setFGst(String(p.gst));
    setFIsbn(p.isbn || ""); setFAuthor(p.author || ""); setFPublisher(p.publisher || ""); setFClassStd(p.classStd || "");
    setEditing(p); setModal("edit");
  };

  const saveModal = () => {
    if (!fName.trim() || !fPrice) return;
    const prodId = editing ? editing.id : Date.now();
    onSaveProduct({
      id: prodId,
      name: fName.trim(),
      category: fCategory,
      stock: Number(fStock) || 0,
      price: Number(fPrice),
      supplier: fSupplier.trim(),
      gst: Number(fGst),
      cost: fCost ? Number(fCost) : undefined,
      isbn: fIsbn.trim(), author: fAuthor.trim(), publisher: fPublisher.trim(), classStd: fClassStd.trim()
    });
    setModal(null);
  };

  const deleteRow = (id: number) => {
    onDeleteProduct(id);
  };

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return rows.filter(p => {
      const matchCat = filter === "All" || p.category === filter;
      const matchSearch = p.name.toLowerCase().includes(lowerSearch);
      const matchSupplier = filterSupplier === "All" || p.supplier === filterSupplier;
      const matchPub = filterPublisher === "All" || p.publisher === filterPublisher;
      const matchClass = filterClass === "All" || p.classStd === filterClass;
      return matchCat && matchSearch && matchSupplier && matchPub && matchClass;
    });
  }, [rows, filter, search, filterSupplier, filterPublisher, filterClass]);

  const { uniqueSuppliers, uniquePublishers, uniqueClasses } = useMemo(() => {
    return {
      uniqueSuppliers: Array.from(new Set(rows.map(r => r.supplier).filter(Boolean))),
      uniquePublishers: Array.from(new Set(rows.map(r => r.publisher).filter(Boolean))),
      uniqueClasses: Array.from(new Set(rows.map(r => r.classStd).filter(Boolean)))
    };
  }, [rows]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Search products..." />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-border text-foreground hover:bg-gray-50'}`}>
            <Filter className="w-4 h-4" /> Advanced
          </button>
          <button onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Upload className="w-4 h-4" /> Bulk Import
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-border bg-gray-50 flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Supplier / Brand</label>
              <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md border border-border text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="All">All Suppliers</option>
                {uniqueSuppliers.map(s => <option key={s} value={String(s)}>{String(s)}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Publisher</label>
              <select value={filterPublisher} onChange={e => setFilterPublisher(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md border border-border text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="All">All Publishers</option>
                {uniquePublishers.map(p => <option key={p} value={String(p)}>{String(p)}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Class / Standard</label>
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md border border-border text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="All">All Classes</option>
                {uniqueClasses.map(c => <option key={c} value={String(c)}>{String(c)}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["Product Name", "Category", "Stock", "Price", "GST %", "Supplier", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.stock === 0 ? "text-red-600" : p.stock < 10 ? "text-amber-600" : "text-foreground"}`}
                      style={{ fontFamily: "JetBrains Mono, monospace" }}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmt(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {p.gst}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.supplier}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteRow(p.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
          Showing {filtered.length} of {rows.length} products
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">{modal === "edit" ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Product Name *</label>
                <input value={fName} onChange={e => setFName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="e.g. Classmate Notebook 200pg" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Barcode / SKU</label>
                <input value={fBarcode} onChange={e => setFBarcode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="e.g. 8901234567890" style={{ fontFamily: "JetBrains Mono, monospace" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Selling Price (₹) *</label>
                  <input type="number" value={fPrice} onChange={e => setFPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                    placeholder="0" style={{ fontFamily: "JetBrains Mono, monospace" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Cost Price (₹)</label>
                  <input type="number" value={fCost} onChange={e => setFCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                    placeholder="0" style={{ fontFamily: "JetBrains Mono, monospace" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Category</label>
                  <select value={fCategory} onChange={e => setFCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {categories.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Stock</label>
                  <input type="number" value={fStock} onChange={e => setFStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                    placeholder="0" style={{ fontFamily: "JetBrains Mono, monospace" }} />
                </div>
              </div>

              {/* Book Metadata */}
              {(fCategory === "Books" || fCategory === "School") && (
                <div className="space-y-3 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700">Book / Academic Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Author</label>
                      <input value={fAuthor} onChange={e => setFAuthor(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        placeholder="e.g. R.D. Sharma" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Publisher</label>
                      <input value={fPublisher} onChange={e => setFPublisher(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        placeholder="e.g. NCERT" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">ISBN</label>
                      <input value={fIsbn} onChange={e => setFIsbn(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        placeholder="ISBN-13" style={{ fontFamily: "JetBrains Mono, monospace" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Class / Standard</label>
                      <input value={fClassStd} onChange={e => setFClassStd(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        placeholder="e.g. 10th" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Supplier</label>
                <input value={fSupplier} onChange={e => setFSupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="Supplier name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">GST Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={100} value={fGst}
                    onChange={e => setFGst(e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                    placeholder="0"
                  />
                  <div className="flex gap-1.5">
                    {[0, 5, 12, 18, 28].map(r => (
                      <button
                        key={r} type="button"
                        onClick={() => setFGst(String(r))}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${Number(fGst) === r
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-foreground border-border hover:border-blue-300"
                          }`}
                      >{r}%</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveModal} disabled={!fName.trim() || !fPrice}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40">
                {modal === "edit" ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Stock Import Modal */}
      {showBulkImport && (
        <BulkStockImportModal
          existingProducts={rows}
          onClose={() => setShowBulkImport(false)}
          onImportDone={() => { onRefresh(); setShowBulkImport(false); }}
        />
      )}
    </div>
  );
}

// ─── Inventory ────────────────────────────────────────────────────────────────
function InventoryScreen({ productRows, sales, onRefresh }: { productRows: ProductRow[], sales: any[], onRefresh?: () => void }) {
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { lowStock, outStock } = useMemo(() => {
    return {
      lowStock: productRows.filter(p => p.stock > 0 && p.stock < 10),
      outStock: productRows.filter(p => p.stock === 0)
    };
  }, [productRows]);

  const history = useMemo(() => {
    return sales.flatMap(s => s.items.map((item: any) => ({
      date: s.billDate ? new Date(s.billDate + "T00:00:00").toLocaleDateString("en-GB") : new Date(s.createdAt).toLocaleDateString("en-GB"),
      product: item.name,
      type: "Sale",
      qty: -item.qty,
      balance: productRows.find(p => p.name === item.name)?.stock ?? 0
    }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
  }, [sales, productRows]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total SKUs", value: productRows.length, color: "bg-blue-50 text-blue-700", icon: Package },
          { label: "Low Stock Items", value: lowStock.length, color: "bg-amber-50 text-amber-700", icon: AlertTriangle },
          { label: "Out of Stock", value: outStock.length, color: "bg-red-50 text-red-700", icon: X },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warnings */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm text-foreground">Low Stock Warnings</h3>
          </div>
          <div className="divide-y divide-border">
            {[...lowStock, ...outStock].map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · {p.supplier}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}
                    style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {p.stock} left
                  </span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory History */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Stock Movement History</h3>
          </div>
          <div className="divide-y divide-border">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${h.qty > 0 ? "bg-green-100" : "bg-red-100"}`}>
                  {h.qty > 0
                    ? <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                    : <TrendingDown className="w-3.5 h-3.5 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{h.product}</p>
                  <p className="text-xs text-muted-foreground">{h.date} · {h.type}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold ${h.qty > 0 ? "text-green-600" : "text-red-600"}`}
                    style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {h.qty > 0 ? "+" : ""}{h.qty}
                  </p>
                  <p className="text-xs text-muted-foreground">Bal: {h.balance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Stock Table */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">Current Stock Levels</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Bulk Stock Import
            </button>
            <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["Product", "Category", "Current Stock", "Min. Level", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productRows.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-medium text-foreground text-sm">{p.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-sm">{p.category}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${p.stock === 0 ? "bg-red-500" : p.stock < 10 ? "bg-amber-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold" style={{ fontFamily: "JetBrains Mono, monospace" }}>{p.stock}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-sm">10</td>
                  <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Bulk Stock Import Modal */}
      {showBulkImport && (
        <BulkStockImportModal
          existingProducts={productRows}
          onClose={() => setShowBulkImport(false)}
          onImportDone={() => { onRefresh?.(); setShowBulkImport(false); }}
        />
      )}
    </div>
  );
}

// ─── Purchases ────────────────────────────────────────────────────────────────
function PurchasesScreen({ purchases, onAddPurchase }: { purchases: Purchase[]; onAddPurchase: (purchase: Omit<Purchase, "id" | "status">) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [supplier, setSupplier] = useState("Navneet Education");
  const [invoice, setInvoice] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [itemsCount, setItemsCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [billFile, setBillFile] = useState<string>("");
  const [viewBill, setViewBill] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBillFile(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!supplier || !amount || Number(amount) <= 0) return;
    onAddPurchase({
      supplier,
      amount: Number(amount),
      date: new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      items: Number(itemsCount) || 1,
      billFile: billFile || undefined,
    });
    setShowAdd(false);
    setSupplier("Navneet Education");
    setInvoice("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setItemsCount("1");
    setNotes("");
    setBillFile("");
  };

  const totalPurchases = purchases.reduce((sum, p) => sum + p.amount, 0);
  const pendingOrders = purchases.filter(p => p.status?.toLowerCase() === 'pending').length;
  const activeSuppliers = new Set(purchases.map(p => p.supplier)).size;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Purchases", value: `₹${totalPurchases.toLocaleString("en-IN")}`, icon: Truck, color: "bg-blue-50 text-blue-600" },
          { label: "Pending Orders", value: pendingOrders.toString(), icon: ClipboardList, color: "bg-amber-50 text-amber-600" },
          { label: "Active Suppliers", value: activeSuppliers.toString(), icon: Users, color: "bg-green-50 text-green-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">Purchase Orders</h3>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Purchase
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              {["Order ID", "Supplier", "Date", "Items", "Amount", "Status", "Bill"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-blue-600 text-sm" style={{ fontFamily: "JetBrains Mono, monospace" }}>{p.id}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.supplier}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.items} items</td>
                <td className="px-4 py-3 font-semibold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmt(p.amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  {p.billFile ? (
                    <button onClick={() => setViewBill(p.billFile!)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                      <FileText className="w-3.5 h-3.5" /> View
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">New Purchase Order</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Supplier</label>
                <select value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  {["Navneet Education", "ITC Ltd.", "Reynolds India", "Faber-Castell", "NCERT Publications"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Invoice Number</label>
                <input value={invoice} onChange={e => setInvoice(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="e.g. INV-2026-001" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">Total Amount (₹)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Items Count</label>
                  <input type="number" min="1" value={itemsCount} onChange={e => setItemsCount(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-center" placeholder="1" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" rows={2} placeholder="Optional notes..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Attach Bill/Receipt (Optional)</label>
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer" />
                {billFile && <p className="text-xs text-green-600 mt-1">File attached successfully!</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={!supplier || !amount || Number(amount) <= 0}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}

      {viewBill && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Attached Bill</h2>
              <button onClick={() => setViewBill(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50/50 p-4 flex justify-center items-center">
              {viewBill.startsWith("data:application/pdf") ? (
                <object data={viewBill} type="application/pdf" className="w-full h-[70vh] rounded border border-border shadow-sm bg-white">
                  <p>PDF preview not available. <a href={viewBill} download="bill.pdf" className="text-blue-600 underline font-medium">Download instead</a>.</p>
                </object>
              ) : (
                <img src={viewBill} alt="Bill Attachment" className="max-w-full max-h-[70vh] rounded border border-border shadow-sm object-contain bg-white" />
              )}
            </div>
            <div className="p-4 border-t border-border flex justify-end">
               <a href={viewBill} download={`bill-attachment-${Date.now()}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                 <Download className="w-4 h-4" /> Download
               </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Customers ────────────────────────────────────────────────────────────────
function CustomersScreen({ customers, onAddCustomer, onRecordPayment, refreshDataset }: { customers: Customer[]; onAddCustomer: (customer: Omit<Customer, "id" | "total" | "visits" | "lastVisit">) => void; onRecordPayment: (id: number, amount: number, note?: string) => Promise<void>; refreshDataset: () => Promise<void>; }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [selectedKhata, setSelectedKhata] = useState<Customer | null>(null);

  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"Retail" | "Wholesale" | "School" | "College" | "Office" | "Bank" | "Corporate">("Retail");
  const [company, setCompany] = useState("");
  const [gstin, setGstin] = useState("");
  const [creditLimit, setCreditLimit] = useState("");

  const [showMerge, setShowMerge] = useState(false);
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) return;
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      type,
      company: company.trim() || undefined,
      gstin: gstin.trim() || undefined,
      creditLimit: Number(creditLimit) || 0
    };
    if (editId) {
      await fetch(`/api/customers/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      await refreshDataset();
    } else {
      onAddCustomer(payload);
    }
    setShowAdd(false);
    setEditId(null);
    setName(""); setPhone(""); setEmail(""); setType("Retail"); setCompany(""); setGstin(""); setCreditLimit("");
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return;
    await fetch("/api/customers/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: Number(mergeSource), targetId: Number(mergeTarget) })
    });
    await refreshDataset();
    setShowMerge(false);
    setMergeSource("");
    setMergeTarget("");
  };

  const deleteKhata = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this Khata account?")) {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      await refreshDataset();
    }
  };

  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setName(c.name); setPhone(c.phone); setEmail(c.email || ""); setType(c.type || "Retail");
    setCompany(c.company || ""); setGstin(c.gstin || ""); setCreditLimit(String(c.creditLimit || ""));
    setShowAdd(true);
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total || 0), 0);
  const totalVisits = customers.reduce((sum, c) => sum + (c.visits || 0), 0);
  const avgOrderValue = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Khata Accounts", value: customers.length, color: "bg-blue-50 text-blue-600", icon: Users },
          { label: "Revenue (Khata)", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "bg-green-50 text-green-600", icon: TrendingUp },
          { label: "Avg. Order Value", value: `₹${avgOrderValue.toLocaleString("en-IN")}`, color: "bg-purple-50 text-purple-600", icon: ShoppingCart },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xl font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Search by name or phone..." />
          </div>
          <button onClick={async () => {
            if (window.confirm("Are you sure you want to completely DELETE ALL CUSTOMERS? This action cannot be undone!")) {
              await fetch("/api/customers/all", { method: "DELETE" });
              window.location.reload();
            }
          }} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" /> Reset Data
          </button>
          <button onClick={() => setShowMerge(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
            <RefreshCw className="w-4 h-4" /> Merge Khata
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Khata
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              {["Khata Name", "Khata", "Phone", "Total Spent", "Due Amount", "Visits", "Action"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.email || ""}
                        {c.email && c.company ? " • " : ""}
                        {c.company || ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{c.type || "Retail"}</span></td>
                <td className="px-4 py-3 text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{c.phone}</td>
                <td className="px-4 py-3 font-semibold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmt(c.total)}</td>
                <td className="px-4 py-3 font-bold text-red-600" style={{ fontFamily: "JetBrains Mono, monospace" }}>{(c.dueAmount || 0) > 0 ? `₹${(c.dueAmount || 0).toLocaleString("en-IN")}` : "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.visits} visits</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => setSelectedKhata(c)} className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded hover:bg-blue-100 transition-colors">
                      Khata Ledger
                    </button>
                    <button onClick={() => openEdit(c)} className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteKhata(c.id)} className="w-7 h-7 flex items-center justify-center rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground text-base">Add New Customer Profile</h2>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setName(""); setPhone(""); setEmail("");
                  setType("Retail"); setCompany(""); setGstin(""); setCreditLimit("");
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Khata Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" placeholder="e.g. Admin" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number *</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white font-mono transition-all" placeholder="e.g. 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Khata Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all">
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale / Khata</option>
                    <option value="School">School</option>
                    <option value="College">College</option>
                    <option value="Office">Office</option>
                    <option value="Bank">Bank</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" placeholder="e.g. ramesh@gmail.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Company / Institution Name</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" placeholder="Optional company name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Credit Limit (₹)</label>
                  <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white font-mono transition-all" placeholder="e.g. 15000" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">GSTIN Number</label>
                  <input value={gstin} onChange={e => setGstin(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white font-mono transition-all" placeholder="Optional GST Number" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setName(""); setPhone(""); setEmail("");
                  setType("Retail"); setCompany(""); setGstin(""); setCreditLimit("");
                }}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button onClick={handleSave} disabled={!name.trim() || !phone.trim()} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40">{editId ? "Save Changes" : "Save Khata"}</button>
            </div>
          </div>
        </div>
      )}

      {showMerge && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground text-base">Merge Khata Accounts</h2>
              <button onClick={() => { setShowMerge(false); setMergeSource(""); setMergeTarget(""); }} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Merge From (Duplicate)</label>
                <select value={mergeSource} onChange={e => setMergeSource(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white">
                  <option value="">Select Khata...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Merge Into (Target)</label>
                <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white">
                  <option value="">Select Khata...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowMerge(false); setMergeSource(""); setMergeTarget(""); }} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleMerge} disabled={!mergeSource || !mergeTarget || mergeSource === mergeTarget} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-40">Merge</button>
            </div>
          </div>
        </div>
      )}

      {selectedKhata && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="font-bold text-lg text-gray-900">{selectedKhata.name} — Khata Ledger</h2>
                <p className="text-xs text-gray-500 font-medium">
                  {selectedKhata.phone} • {selectedKhata.type || "Retail"}
                  {selectedKhata.company ? ` • Co: ${selectedKhata.company}` : ""}
                  {selectedKhata.gstin ? ` • GSTIN: ${selectedKhata.gstin}` : ""}
                </p>
              </div>
              <button onClick={() => setSelectedKhata(null)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 bg-blue-900 text-white flex justify-between items-center">
              <div>
                <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">Total Due Amount</p>
                <p className="text-3xl font-black" style={{ fontFamily: "JetBrains Mono, monospace" }}>₹{(selectedKhata.dueAmount || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">Credit Limit</p>
                <p className="text-xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace" }}>₹{(selectedKhata.creditLimit || 0).toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-bold text-gray-600 px-5 py-3">Date</th>
                    <th className="text-left text-xs font-bold text-gray-600 px-5 py-3">Details</th>
                    <th className="text-right text-xs font-bold text-gray-600 px-5 py-3">Given (Credit)</th>
                    <th className="text-right text-xs font-bold text-gray-600 px-5 py-3">Got (Payment)</th>
                    <th className="text-right text-xs font-bold text-gray-600 px-5 py-3">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!selectedKhata.khata || selectedKhata.khata.length === 0) ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-500 text-sm font-medium">No ledger records found for this customer.</td></tr>
                  ) : (
                    selectedKhata.khata.map((record: KhataRecord) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">{record.date}</td>
                        <td className="px-5 py-3">
                          <p className="font-bold text-gray-800">{record.id}</p>
                          {record.note && <p className="text-xs text-gray-500 mt-0.5">{record.note}</p>}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-red-600">
                          {record.type === "credit" ? `₹${record.amount.toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-green-600">
                          {record.type === "payment" ? `₹${record.amount.toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900 bg-gray-50/50">
                          ₹{record.balance.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded hover:bg-gray-100 flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print Ledger
              </button>
              <button onClick={() => setShowPaymentModal(true)} className="px-4 py-2 bg-green-600 text-white font-bold text-sm rounded hover:bg-green-700 flex items-center gap-2 shadow-sm">
                <Plus className="w-4 h-4" /> Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedKhata && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Record Payment</h3>
            <p className="text-sm text-gray-600 mb-4">Receiving payment from <strong>{selectedKhata.name}</strong>.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount Received (₹)</label>
                <input type="number" min="1" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 1000" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Note (Optional)</label>
                <input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Cash handed to Admin" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowPaymentModal(false); setPaymentAmount(""); setPaymentNote(""); }} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={async () => {
                const amt = Number(paymentAmount);
                if (amt > 0) {
                  await onRecordPayment(selectedKhata.id, amt, paymentNote);
                  setShowPaymentModal(false);
                  setPaymentAmount("");
                  setPaymentNote("");
                  // Update local modal view state so it reflects instantly
                  setSelectedKhata(prev => prev ? { ...prev, dueAmount: Math.max(0, (prev.dueAmount || 0) - amt), khata: [{ id: `PAY-${Math.floor(Math.random() * 10000)}`, date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), type: "payment", amount: amt, balance: Math.max(0, (prev.dueAmount || 0) - amt), note: paymentNote || "Cash Payment Received" }, ...(prev.khata || [])] } : null);
                }
              }} disabled={!paymentAmount || Number(paymentAmount) <= 0} className="flex-1 py-2 rounded-lg bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50">Save Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function ReportsScreen({ summary, sales }: { summary: any; sales: any[] }) {
  const deadStock = summary?.deadStockItems || [];
  const topProducts = summary?.bestSellers || [];
  const dynamicCategoryPie = summary?.categoryPie || [];

  const computedMonthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(0, i).toLocaleString('en', { month: 'short' });
    const revenue = sales.filter(s => {
      const sDate = s.billDate || (s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "");
      if (!sDate) return false;
      const sYear = parseInt(sDate.slice(0, 4), 10);
      const sMonth = parseInt(sDate.slice(5, 7), 10) - 1;
      return sMonth === i && sYear === new Date().getFullYear();
    }).reduce((sum, s) => sum + (s.total || 0), 0);
    return { month, revenue };
  });
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: "Export PDF", icon: FileText, color: "bg-red-600 hover:bg-red-700 text-white" },
          { label: "Export Excel", icon: Download, color: "bg-green-600 hover:bg-green-700 text-white" },
        ].map(({ label, icon: Icon, color }) => (
          <button key={label} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${color}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Monthly Revenue */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Monthly Revenue — {new Date().getFullYear()}</h3>
            <p className="text-xs text-muted-foreground">Year-to-date performance</p>
          </div>
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+22.4% YoY</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={computedMonthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
            <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dynamicCategoryPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                {dynamicCategoryPie.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">Top Products by Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 30, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dead Stock Report */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Dead Stock Report</h3>
              <p className="text-xs text-muted-foreground">Products with zero sales but available stock</p>
            </div>
            <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2">Product Name</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-2">Category</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-2">Current Stock</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-2">Stock Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deadStock.length > 0 ? deadStock.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 text-center font-semibold text-amber-600">{p.stock}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">₹{p.stock * p.price}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-green-600 font-medium text-sm">No dead stock found. Great job!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsScreen({ settings, setSettings, onResetDb }: {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  onResetDb: (password: string) => Promise<boolean>;
}) {
  // ── Local state for ALL form fields ──
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopSubtitle, setShopSubtitle] = useState(settings.shopSubtitle || "");
  const [gst, setGst] = useState(settings.gstIn);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [gstRate, setGstRate] = useState(settings.defaultGstRate);
  const [gstOn, setGstOn] = useState(settings.defaultGstOn);
  const [tabOptions, setTabOptions] = useState(settings.tabPortalOptions);
  const [receiptSettings, setReceiptSettings] = useState(settings.receiptSettings);
  const [printerType, setPrinterType] = useState(settings.printerType);
  const [printerCopies, setPrinterCopies] = useState(settings.printerCopies);
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || "");
  const [logo, setLogo] = useState(settings.logo || "");
  const [signature, setSignature] = useState(settings.signature || "");
  const [companyList, setCompanyList] = useState<string[]>(settings.companyList || []);
  const [newCompany, setNewCompany] = useState("");
  const [customerTypes, setCustomerTypes] = useState<string[]>(settings.customerTypes || ["School", "College", "Bank", "Office", "Company", "Government", "Retail Customer", "Khata Customer"]);
  const [newCustomerType, setNewCustomerType] = useState("");

  const [usersList, setUsersList] = useState<User[]>([]);
  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(d => setUsersList(d.users || []));
  }, []);

  // ── Save / Reset UI state ──
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);
  const [saveError, setSaveError] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  // ── Toggle tablet portal option (local) ──
  const toggleTab = (key: keyof TabPortalOptions) =>
    setTabOptions(prev => ({ ...prev, [key]: !prev[key] }));

  // ── SAVE: builds payload from local state, POSTs to backend, updates App state ──
  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    setSaveError("");

    const payload: AppSettings = {
      shopName,
      shopSubtitle,
      gstIn: gst,
      phone,
      address,
      defaultGstOn: gstOn,
      defaultGstRate: gstRate,
      tabPortalOptions: tabOptions,
      receiptSettings,
      printerType,
      printerCopies,
      adminPassword,
      logo,
      signature,
      companyList,
      customerTypes,
    };

    console.log("[Settings] Saving payload:", JSON.stringify(payload));

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Settings] Server confirmed save:", JSON.stringify(data));

      // Update App-level state
      setSettings(payload);

      // Also persist to localStorage as fallback
      try { localStorage.setItem("svp_settings", JSON.stringify(payload)); } catch { /* ignore */ }

      setSaveResult("success");
      setTimeout(() => setSaveResult(null), 3000);
    } catch (err: any) {
      console.error("[Settings] Save failed:", err);
      setSaveResult("error");
      setSaveError(err.message || "Save failed. Is the server running?");
    } finally {
      setSaving(false);
    }
  };

  // ── RESET: calls backend reset, then full page reload ──
  const handleReset = async () => {
    setResetMessage("");
    setResetError("");
    if (resetPassword !== "1819219" && resetPassword !== settings.adminPassword) {
      setResetError("Incorrect password.");
      return;
    }
    const success = await onResetDb(resetPassword);
    if (success) {
      // Also clear localStorage so defaults load fresh
      try { localStorage.removeItem("svp_settings"); } catch { /* ignore */ }
      setResetMessage("Database reset! Reloading...");
      setResetPassword("");
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setResetError("Reset failed. Check that server is running.");
    }
  };


  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">
      {/* Bill & Shop Settings */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <h3 className="font-semibold text-foreground mb-4 text-lg border-b pb-2">Bill Customization Settings</h3>
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Shop Details (Header)</h4>
            {[
              { label: "Shop Name", value: shopName, setter: setShopName, placeholder: "Your shop name" },
              { label: "Shop Subtitle", value: shopSubtitle, setter: setShopSubtitle, placeholder: "e.g. & Book Store" },
              { label: "GSTIN", value: gst, setter: setGst, placeholder: "Your GSTIN" },
              { label: "Phone Number", value: phone, setter: setPhone, placeholder: "10-digit phone number" },
              { label: "Address", value: address, setter: setAddress, placeholder: "Full address" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-foreground mb-1.5">{f.label}</label>
                <input value={f.value} onChange={e => f.setter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder={f.placeholder} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            {/* Shop Logo */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Shop Logo</label>
              <div className="flex items-center gap-4 flex-wrap">
                {logo && <img src={logo} alt="Logo" className="h-12 w-12 object-contain bg-white border rounded" />}
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setLogo(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} className="text-xs border border-border p-1 rounded bg-white w-full" />
                {logo && <button onClick={() => setLogo("")} className="text-xs text-red-600 hover:underline">Remove</button>}
              </div>
            </div>

            {/* Authorized Signature */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Authorized Signature (For Bills)</label>
              <div className="flex items-center gap-4 flex-wrap">
                {signature && <img src={signature} alt="Signature" className="h-12 w-auto object-contain bg-white border rounded" />}
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setSignature(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} className="text-xs border border-border p-1 rounded bg-white w-full" />
                {signature && <button onClick={() => setSignature("")} className="text-xs text-red-600 hover:underline">Remove</button>}
              </div>
            </div>
          </div>

          {/* Printer & Template Settings within Bill Settings */}
          <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Printer Type & Paper</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Printer/Layout Type</label>
                  <select value={printerType} onChange={e => setPrinterType(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Thermal (80mm)</option>
                    <option>Thermal (58mm)</option>
                    <option>Inkjet / Laser (A4)</option>
                    <option>Inkjet / Laser (A5)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Default Copies</label>
                  <input type="number" value={printerCopies} onChange={e => setPrinterCopies(Number(e.target.value))} min={1} max={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Receipt Toggles</h4>
              <div className="space-y-3 h-64 overflow-y-auto pr-2 border p-3 rounded-lg bg-gray-50/50">
                {[
                  { key: "showGst", label: "Show GST breakdown on all bills" },
                  { key: "printLogo", label: "Print shop logo" },
                  { key: "showThankYou", label: "Show thank you message" },
                  { key: "printBarcode", label: "Print barcode on receipt" },
                  { key: "showCustomerName", label: "Show Customer Name" },
                  { key: "showCustomerType", label: "Show Customer Type" },
                  { key: "showCompanyName", label: "Show Company Name" },
                  { key: "showMobileNumber", label: "Show Mobile Number" },
                  { key: "showGstNumber", label: "Show GST Number" },
                  { key: "showCustomerAddress", label: "Show Customer Address" },
                  { key: "showSNo", label: "Show S.No in Table" },
                  { key: "showItemName", label: "Show Item Name in Table" },
                  { key: "showQuantity", label: "Show Quantity in Table" },
                  { key: "showRate", label: "Show Rate in Table" },
                  { key: "showGstPercent", label: "Show GST % in Table" },
                  { key: "showDiscount", label: "Show Discount in Table" },
                  { key: "showAmount", label: "Show Amount in Table" },
                  { key: "showSubtotal", label: "Show Subtotal" },
                  { key: "showSummaryDiscount", label: "Show Summary Discount" },
                  { key: "showTaxableAmount", label: "Show Taxable Amount" },
                  { key: "showCgst", label: "Show CGST" },
                  { key: "showSgst", label: "Show SGST" },
                  { key: "showTotalGst", label: "Show Total GST" },
                  { key: "showRoundOff", label: "Show Round Off" },
                  { key: "showGrandTotal", label: "Show Grand Total" },
                  { key: "showAmountInWords", label: "Show Amount in Words" },
                  { key: "showAuthorizedSignature", label: "Show Authorized Signature" },

                  { key: "showFooterNotes", label: "Show Footer Notes" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      checked={receiptSettings[key as keyof typeof receiptSettings] !== false}
                      onChange={() => setReceiptSettings(prev => ({ ...prev, [key]: !(prev[key as keyof typeof receiptSettings] !== false) }))}
                      className="rounded" />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-2 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom Receipt Text</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "invoiceTitle", label: "Invoice Title (Override)", placeholder: "e.g. TAX INVOICE" },
                  { key: "thankYouMessage", label: "Thank You Message", placeholder: "e.g. Thank you for your business!" },
                  { key: "termsConditions", label: "Terms & Conditions", placeholder: "e.g. Goods once sold..." },
                  { key: "returnPolicy", label: "Return Policy", placeholder: "e.g. No returns after 7 days" },
                  { key: "footerText", label: "Footer Text", placeholder: "e.g. Visit us again!" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
                    <input value={(receiptSettings as any)[key] || ""} onChange={e => setReceiptSettings(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Companies Management */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <h3 className="font-semibold text-foreground mb-4">Saved Companies (For Quick Select)</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={newCompany} onChange={e => setNewCompany(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Type a company name (e.g. Sister Company or School)" onKeyDown={e => {
                if (e.key === 'Enter' && newCompany.trim() && !companyList.includes(newCompany.trim())) { setCompanyList([...companyList, newCompany.trim()]); setNewCompany(""); }
              }} />
            <button onClick={() => { if (newCompany.trim() && !companyList.includes(newCompany.trim())) { setCompanyList([...companyList, newCompany.trim()]); setNewCompany(""); } }} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Company</button>
          </div>
          {companyList.length > 0 ? (
            <div className="space-y-2">
              {companyList.map(c => (
                <div key={c} className="flex justify-between items-center bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm">
                  <span className="font-medium text-gray-800">{c}</span>
                  <button onClick={() => setCompanyList(companyList.filter(x => x !== c))} className="text-red-500 hover:text-red-700 font-medium text-xs">Remove</button>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground italic">No companies saved yet. Add one above.</p>}
        </div>
      </div>

      {/* Customer Types Management */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <h3 className="font-semibold text-foreground mb-4">Customer Types</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={newCustomerType} onChange={e => setNewCustomerType(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Type a new customer type (e.g. Hospital)" onKeyDown={e => {
                if (e.key === 'Enter' && newCustomerType.trim() && !customerTypes.includes(newCustomerType.trim())) { setCustomerTypes([...customerTypes, newCustomerType.trim()]); setNewCustomerType(""); }
              }} />
            <button onClick={() => { if (newCustomerType.trim() && !customerTypes.includes(newCustomerType.trim())) { setCustomerTypes([...customerTypes, newCustomerType.trim()]); setNewCustomerType(""); } }} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Type</button>
          </div>
          {customerTypes.length > 0 ? (
            <div className="space-y-2">
              {customerTypes.map(c => (
                <div key={c} className="flex justify-between items-center bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm">
                  <span className="font-medium text-gray-800">{c}</span>
                  <button onClick={() => setCustomerTypes(customerTypes.filter(x => x !== c))} className="text-red-500 hover:text-red-700 font-medium text-xs">Remove</button>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground italic">No customer types saved.</p>}
        </div>
      </div>

      {/* Master Reset Password Management */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <h3 className="font-semibold text-foreground mb-4">Master Reset Password</h3>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Admin Reset Password</label>
          <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            placeholder="Set a new admin password" />
          <p className="text-xs text-muted-foreground mt-1.5">This password is required for resetting the database and sensitive operations.</p>
        </div>
      </div>

      {/* User Account Management */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <h3 className="font-semibold text-foreground mb-4">User Account Management</h3>
        <div className="space-y-4">
          {usersList.map(u => (
            <div key={u.id} className="flex flex-col gap-3 border border-border p-4 rounded-lg bg-gray-50">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label>
                  <input type="text" value={u.name} onChange={e => setUsersList(prev => prev.map(usr => usr.id === u.id ? { ...usr, name: e.target.value } : usr))} className="w-full px-3 py-2 rounded-lg border bg-white text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Username / Login ID</label>
                  <input type="text" value={u.username} onChange={e => setUsersList(prev => prev.map(usr => usr.id === u.id ? { ...usr, username: e.target.value } : usr))} className="w-full px-3 py-2 rounded-lg border bg-white text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1 pb-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Role</label>
                  <p className="text-sm font-bold text-gray-800">{u.role}</p>
                </div>
                <div className="flex-[2]">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Set New Password</label>
                  <input type="text" value={u.password} onChange={e => setUsersList(prev => prev.map(usr => usr.id === u.id ? { ...usr, password: e.target.value } : usr))} className="w-full px-3 py-2 rounded-lg border bg-white text-sm focus:ring-2 focus:ring-blue-500" placeholder="Type new password" />
                </div>
                <button onClick={() => {
                  fetch(`/api/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: u.name, username: u.username, password: u.password }) }).then(() => alert('Account updated successfully!'));
                }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors">
                  Update Account
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GST & Tax Settings */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <h3 className="font-semibold text-foreground mb-4">GST & Tax Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">GSTIN Number</label>
            <input value={gst} onChange={e => setGst(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="15-character GSTIN" style={{ fontFamily: "JetBrains Mono, monospace" }} />
          </div>

          {/* Default GST toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-foreground">Apply GST by default on new bills</p>
              <p className="text-xs text-muted-foreground">POS billing will start with GST {gstOn ? "ON" : "OFF"}</p>
            </div>
            <button
              onClick={() => setGstOn(g => !g)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${gstOn ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${gstOn ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Default GST Rate */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Default GST Rate (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="number" min={0} max={100} value={gstRate}
                onChange={e => setGstRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-28 px-3.5 py-2.5 rounded-lg border border-border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              />
              <div className="flex gap-2">
                {[0, 5, 12, 18, 28].map(r => (
                  <button
                    key={r}
                    onClick={() => setGstRate(r)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${gstRate === r
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-foreground border-border hover:border-blue-300"
                      }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">This will be the pre-filled GST rate every time you open POS billing.</p>
          </div>
        </div>
      </div>



      {/* User Management */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Users & Access</h3>
          <button
            onClick={async () => {
              const name = prompt("Enter new user's name:");
              if (!name) return;
              const username = prompt("Enter username:");
              if (!username) return;
              const password = prompt("Enter password:");
              const role = prompt("Enter role (Admin/Cashier/Staff):", "Staff");
              if (!name || !username || !password || !role) return;
              const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, username, password, role, status: "active", permissions: {} })
              });
              if (res.ok) {
                const data = await res.json();
                setUsersList(prev => [...prev, data.user]);
              }
            }}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>
        {usersList.map(u => (
          <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{u.name} <span className="text-xs text-muted-foreground">({u.username})</span></p>
                <p className="text-xs text-muted-foreground">{u.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={u.status} />
              <button
                onClick={async () => {
                  if (confirm(`Delete user ${u.name}?`)) {
                    await fetch(`/api/users/${u.id}`, { method: "DELETE" });
                    setUsersList(prev => prev.filter(user => user.id !== u.id));
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet Portal Configuration */}
      <div className="bg-card rounded-xl border border-emerald-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-foreground">Tablet Portal — Screen Access</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Control which sections staff can access when logged in to the Tablet Portal.</p>
        <div className="space-y-3">
          {([
            { key: "dashboard", label: "Dashboard", desc: "Sales summary & KPIs" },
            { key: "pos", label: "POS Billing", desc: "Point of sale terminal" },
            { key: "products", label: "Products", desc: "Stock updates & catalog" },
            { key: "inventory", label: "Inventory", desc: "Stock levels overview" },
            { key: "purchases", label: "Purchases", desc: "Purchase history" },
            { key: "customers", label: "Khata", desc: "Khata management" },
            { key: "history", label: "Bill History", desc: "Past invoices" },
            { key: "reports", label: "Reports", desc: "Analytics & business reports" },
          ] as { key: keyof TabPortalOptions; label: string; desc: string }[]).map(({ key, label, desc }) => {
            const enabled = tabOptions[key];
            return (
              <div key={key} className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${enabled ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-border"
                }`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button
                  onClick={() => toggleTab(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${enabled ? "bg-emerald-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supabase Cloud Live Sync */}
      <div className="bg-card rounded-xl border border-indigo-200 shadow-sm p-5 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Supabase Cloud Database Sync</h3>
              <p className="text-xs text-muted-foreground">All POS transactions, products, stock & khata records sync live to Supabase PostgreSQL.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Cloud Sync
          </span>
        </div>

        <div className="mt-4 p-3.5 bg-white rounded-lg border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Project URL: </span>
            <span className="font-mono font-semibold text-indigo-900">https://yjrbkjezerenfqneyyvz.supabase.co</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/supabase/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ direction: "push" }),
                  });
                  const d = await res.json();
                  if (res.ok) alert("✓ Full Database pushed to Supabase Cloud successfully!");
                  else alert("Sync Error: " + (d.error || "Failed to push"));
                } catch (e: any) {
                  alert("Sync failed: " + e.message);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Push All Data to Supabase
            </button>
            <button
              onClick={async () => {
                if (!confirm("Pull latest data from Supabase Cloud? This will refresh your local database with cloud records.")) return;
                try {
                  const res = await fetch("/api/supabase/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ direction: "pull" }),
                  });
                  const d = await res.json();
                  if (res.ok) {
                    alert("✓ Database restored from Supabase Cloud!");
                    window.location.reload();
                  } else {
                    alert("Pull Error: " + (d.error || "Failed to pull"));
                  }
                } catch (e: any) {
                  alert("Pull failed: " + e.message);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Pull / Restore from Cloud
            </button>
          </div>
        </div>
      </div>

      {/* Database Reset Option */}
      <div className="bg-card rounded-xl border border-red-200 shadow-sm p-5 bg-red-50/10">
        <h3 className="font-semibold text-red-700 mb-2">Danger Zone — System Tools</h3>
        <p className="text-xs text-muted-foreground mb-4">Reset the database to initial seed data, or trigger the Ribbon Cutting launch screen.</p>
        <div className="flex items-center gap-3">
          <input
            type="password"
            value={resetPassword}
            onChange={e => setResetPassword(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-red-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter reset password"
          />
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Reset Database
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("hasLaunched");
              alert("Grand Opening Screen reset! It will appear on the next reload.");
              window.location.reload();
            }}
            className="px-4 py-2.5 bg-amber-100 text-amber-700 font-semibold rounded-lg text-sm hover:bg-amber-200 transition-colors ml-auto"
          >
            Replay Ribbon Cutting
          </button>
        </div>
        {resetError && <p className="text-xs text-red-600 font-medium mt-2">{resetError}</p>}
        {resetMessage && <p className="text-xs text-green-600 font-medium mt-2">{resetMessage}</p>}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm ${saving ? "bg-gray-400 text-white cursor-wait" :
          saveResult === "success" ? "bg-green-600 text-white scale-105" :
            saveResult === "error" ? "bg-red-600 text-white" :
              "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
      >
        {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
        {!saving && <CheckCircle className="w-4 h-4" />}
        {saving ? "Saving..." : saveResult === "success" ? "Saved Successfully!" : saveResult === "error" ? "Save Failed" : "Save All Settings"}
      </button>
      {saveResult === "error" && saveError && (
        <p className="text-xs text-red-600 font-medium mt-1">{saveError}</p>
      )}
    </div>
  );
}

// ─── Receipt ──────────────────────────────────────────────────────────────────
function amountInWords(num: number): string {
  if (num === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  };
  const str = String(num.toFixed(2));
  const parts = str.split(".");
  const rs = parseInt(parts[0], 10);
  const ps = parseInt(parts[1], 10);
  let res = inWords(rs);
  if (ps > 0) res += " Rupees and " + inWords(ps) + " Paise Only";
  else res += " Rupees Only";
  return res;
}

function ReceiptScreen({ receiptData, saleStatus, settings }: { receiptData: ReceiptData | null; saleStatus: string; settings?: AppSettings }) {
  const receipt = receiptData ?? {
    items: [
      { id: 1, name: "A4 Paper Bundle (500 Sheets)", price: 250, qty: 10, category: "Stationery" },
      { id: 2, name: "Blue Ball Pen", price: 10, qty: 25, category: "Stationery" },
      { id: 3, name: "Long Notebook (200 Pages)", price: 45, qty: 15, category: "Stationery" },
      { id: 4, name: "Geometry Box", price: 60, qty: 10, category: "School" },
      { id: 5, name: "Custom Item (Photocopy)", price: 150, qty: 1, category: "Custom" },
    ],
    paymentMethod: "UPI",
    customer: "ABC Public School",
    invoice: "INV-2026-001245",
    date: "02-Jun-2026",
    time: "10:45 AM",
    subtotal: 4175,
    tax: 633.5,
    total: 4808.5,
    billType: "Tax Invoice"
  };

  const rs = settings?.receiptSettings || {} as any;

  // Guard billType — default to "Tax Invoice" if missing
  const rawBillType: string = (receipt as any).billType || "Cash Bill";
  const isTaxInvoice = true;
  const isRetailInvoice = rawBillType === "Retail Invoice";
  const isQuotation = rawBillType === "Quotation";
  const isProforma = rawBillType === "Proforma Invoice";
  const isChallan = rawBillType === "Delivery Challan";

  const showGst = rs.showGst !== false;
  const showGstBreakdown = showGst && (isTaxInvoice || isQuotation || isProforma) && rs.showCgst !== false;

  // Derive Invoice Title
  let displayTitle = rs.invoiceTitle ? rs.invoiceTitle : rawBillType.toUpperCase();
  if (isChallan) displayTitle = "DELIVERY CHALLAN";
  else if (isQuotation) displayTitle = "QUOTATION";
  else if (isProforma) displayTitle = "PROFORMA INVOICE";

  // Hide payment on Challan or Quotation
  const showPayment = !(isChallan || isQuotation || isProforma);

  // Re-calculate totals with NaN guards
  const items = (receipt.items || []).map((item) => ({
    name: item.name || "Unknown Item",
    qty: Number(item.qty) || 0,
    rate: Number(item.price) || 0,
    amount: (Number(item.qty) || 0) * (Number(item.price) || 0),
    gst: item.gst !== undefined ? Number(item.gst) : 0,
  }));

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const storedSubtotal = (receipt as any).subtotal ?? subtotal;
  const safeTotal = isNaN(receipt.total) || !receipt.total ? subtotal : receipt.total;
  const safeTax = isNaN(receipt.tax) ? 0 : (receipt.tax ?? 0);
  const discAmt = Math.max(0, storedSubtotal - (safeTotal - safeTax));
  const discountRate = storedSubtotal > 0 ? discAmt / storedSubtotal : 0;
  const taxable = subtotal * (1 - discountRate);

  const gstSummary = items.reduce((acc, item) => {
    const rate = item.gst ?? 0;
    if (rate === 0) return acc;
    if (!acc[rate]) acc[rate] = { taxable: 0, tax: 0 };
    const lineTotal = item.amount * (1 - discountRate);
    acc[rate].taxable += lineTotal;
    acc[rate].tax += lineTotal * rate / 100;
    return acc;
  }, {} as Record<number, { taxable: number; tax: number }>);

  const totalGstAmount = Object.values(gstSummary).reduce((s, d) => s + d.tax, 0);
  const total = showGstBreakdown ? taxable + totalGstAmount : taxable;

  // ─── Editable Bill Fields (override before print) ───────────────────────────
  const [editDate, setEditDate] = useState(receipt.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }));
  const [editTime, setEditTime] = useState(receipt.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const [editInvoice, setEditInvoice] = useState(
    receipt.billNumber ? String(receipt.billNumber) : (receipt.invoice || "INV-0001")
  );
  const [editCustomerName, setEditCustomerName] = useState(receipt.customer || "");
  const [showEditPanel, setShowEditPanel] = useState(false);

  // Sync editable fields if receipt data changes (new bill)
  useEffect(() => {
    setEditDate(receipt.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }));
    setEditTime(receipt.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setEditInvoice(receipt.billNumber ? String(receipt.billNumber) : (receipt.invoice || "INV-0001"));
    setEditCustomerName(receipt.customer || "");
  }, [receipt.invoice, receipt.billNumber, receipt.customer]);

  const [showSuccessBanner, setShowSuccessBanner] = useState(saleStatus === "success");

  useEffect(() => {
    if (saleStatus === "success") {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      const t = setTimeout(() => setShowSuccessBanner(false), 3000);
      return () => clearTimeout(t);
    }
  }, [saleStatus]);

  const printType = settings?.printerType || "Inkjet / Laser (A5)";
  const printWidths: Record<string, string> = {
    "Thermal (80mm)": "w-[302px] print:w-[80mm]",
    "Thermal (58mm)": "w-[219px] print:w-[58mm]",
    "Inkjet / Laser (A4)": "w-full max-w-[794px] print:w-[210mm]",
    "Inkjet / Laser (A5)": "w-full max-w-[560px] print:w-[148mm]",
  };

  const layoutClass = printWidths[printType] || printWidths["Inkjet / Laser (A5)"];
  const isThermal = printType.includes("Thermal");

  return (
    <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-gray-100 print:bg-white print:p-0">
      <div className={`mx-auto ${layoutClass}`}>
        {/* Success Banner */}
        {showSuccessBanner && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 print:hidden shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-green-800 font-bold text-sm">Bill Generated Successfully ✓</h3>
              <p className="text-green-600 text-xs mt-0.5">Ready to print or share</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mb-3 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">
            <Printer className="w-4 h-4" /> Print {printType}
          </button>
          <button
            onClick={() => setShowEditPanel(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showEditPanel ? "bg-amber-50 border-amber-400 text-amber-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Edit2 className="w-4 h-4" />
            {showEditPanel ? "Close Editor" : "Edit Bill Details"}
          </button>
        </div>

        {/* Bill Details Editor — hidden on print */}
        {showEditPanel && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl print:hidden">
            <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <Edit2 className="w-4 h-4" /> Edit Bill Details Before Printing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
                <input
                  value={editCustomerName}
                  onChange={e => setEditCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Customer Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Number</label>
                <input
                  value={editInvoice}
                  onChange={e => setEditInvoice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="INV-0001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bill Date</label>
                <input
                  type="date"
                  onChange={e => {
                    const d = new Date(e.target.value);
                    if (!isNaN(d.getTime())) {
                      setEditDate(d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-[10px] text-gray-500 mt-1">Displayed: <strong>{editDate}</strong></p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bill Time</label>
                <input
                  type="time"
                  onChange={e => {
                    if (e.target.value) {
                      const [h, m] = e.target.value.split(":");
                      const hr = Number(h);
                      const ampm = hr >= 12 ? "PM" : "AM";
                      const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
                      setEditTime(`${String(hr12).padStart(2, "0")}:${m} ${ampm}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-[10px] text-gray-500 mt-1">Displayed: <strong>{editTime}</strong></p>
              </div>
            </div>
            <p className="text-[10px] text-amber-700 mt-2">⚠️ Changes are for this print only and will not be saved to the database.</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground mb-4 print:hidden">{saleStatus}</div>

        {/* Printable Container */}
        <div id="printable-receipt" className={`bg-white border border-gray-300 shadow-xl print:shadow-none print:border-none mx-auto ${isThermal ? 'text-[8px] p-2' : 'text-[10px]'}`} style={{ fontFamily: "Inter, sans-serif" }}>

          {/* Header */}
          <div className={`flex items-start gap-4 p-5 pb-4 border-b-2 border-blue-900 ${isThermal ? 'flex-col items-center text-center p-2' : ''}`}>
            {(rs.printLogo !== false) && (
              <div className="w-14 h-14 bg-blue-900 text-white flex items-center justify-center rounded flex-shrink-0">
                {settings?.logo ? <img src={settings.logo} className="w-full h-full object-contain p-0.5 bg-white rounded" /> : <Tag className="w-6 h-6" />}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-blue-900 uppercase leading-none tracking-tight">{settings?.shopName || "SRI VENKATESWARA STATIONERS"}</h1>
              <p className="text-blue-600 font-medium text-[10px] mt-1 tracking-wide">{settings?.shopSubtitle || "Books | Stationery | Office Supplies | Gifts"}</p>
              <div className="text-[10px] text-gray-700 mt-2 space-y-0.5 leading-tight">
                <p>{settings?.address || "12-1-47, Main Road, Kothapet, Vijayawada, AP - 520001"}</p>
                <p>Ph: +91 {settings?.phone || "98765 43210"}</p>
                <p className="font-semibold text-blue-900">GSTIN: {settings?.gstIn || "37ABCDE1234F1Z5"}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900 text-white text-center py-1 font-bold text-xs tracking-widest uppercase">
            {displayTitle}
          </div>

          {/* Info Section */}
          <div className="p-4 grid grid-cols-2 gap-4 text-[10px]">
            <div>
              <table className="text-gray-800 font-medium">
                <tbody>
                  <tr><td className="pr-3 pb-1 text-gray-500">{receipt.billNumber ? "Bill No:" : "Invoice No:"}</td><td className="pb-1 font-bold">{editInvoice}</td></tr>
                  <tr><td className="pr-3 pb-1 text-gray-500">Date:</td><td className="pb-1">{editDate}</td></tr>
                  <tr><td className="pr-3 pb-1 text-gray-500">Time:</td><td className="pb-1">{editTime}</td></tr>
                  {showPayment && <tr><td className="pr-3 text-gray-500">Payment:</td><td className="font-bold">{receipt.paymentMethod}</td></tr>}
                </tbody>
              </table>
            </div>
            <div>
              <table className="text-gray-800 font-medium w-full">
                <tbody>
                  {rs.showCustomerName !== false && <tr><td className="pr-3 pb-1 text-gray-500 w-16">Customer:</td><td className="pb-1 font-bold text-blue-900">{editCustomerName}</td></tr>}
                  {rs.showCustomerType !== false && <tr><td className="pr-3 pb-1 text-gray-500 w-16">Type:</td><td className="pb-1 font-medium text-gray-700">{receipt.customerType || "Retail Customer"}</td></tr>}
                  {rs.showCompanyName !== false && <tr><td className="pr-3 pb-1 text-gray-500 align-top">Company:</td><td className="pb-1">{(receipt as any).customerCompany || "--"}</td></tr>}
                  {rs.showGstNumber !== false && <tr><td className="pr-3 text-gray-500">GSTIN:</td><td>{(receipt as any).customerGstin || "--"}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-4 mb-4">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-100 text-blue-900 font-bold border-y-2 border-blue-900">
                  {rs.showSNo !== false && <th className="py-1 px-1 text-center w-8">S.No</th>}
                  {rs.showItemName !== false && <th className="py-1 px-2 text-left">Item Name</th>}
                  {rs.showQuantity !== false && <th className="py-1 px-1 text-center w-10">Qty</th>}
                  {rs.showRate !== false && <th className="py-1 px-1 text-right w-12">Rate</th>}
                  {(showGstBreakdown && rs.showGstPercent !== false) && <th className="py-1 px-1 text-center w-12">GST%</th>}
                  {rs.showAmount !== false && <th className="py-1 px-1 text-right w-16">Amount</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, i) => (
                  <tr key={i} className="text-gray-800">
                    {rs.showSNo !== false && <td className="py-1 px-1 text-center">{i + 1}</td>}
                    {rs.showItemName !== false && <td className="py-1 px-2 font-medium text-gray-900">{item.name}</td>}
                    {rs.showQuantity !== false && <td className="py-1 px-1 text-center font-semibold">{item.qty}</td>}
                    {rs.showRate !== false && <td className="py-1 px-1 text-right">{item.rate.toFixed(2)}</td>}
                    {(showGstBreakdown && rs.showGstPercent !== false) && <td className="py-1 px-1 text-center text-gray-500">{item.gst ?? 0}%</td>}
                    {rs.showAmount !== false && <td className="py-1 px-1 text-right font-bold">{item.amount.toFixed(2)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Amount in Words */}
          <div className="px-4 flex gap-4">
            <div className="w-[55%]">
              {rs.showAmountInWords !== false && (
                <div className="border border-gray-200 rounded p-2 bg-gray-50 mb-3">
                  <p className="text-blue-900 font-bold text-[9px] mb-1">Amount in Words :</p>
                  <p className="font-bold text-[10px] text-gray-800 leading-tight">{amountInWords(total)}</p>
                </div>
              )}
              {rs.termsConditions && (
                <div className="mb-2">
                  <p className="text-[9px] font-bold text-gray-700">Terms & Conditions:</p>
                  <p className="text-[9px] text-gray-600 whitespace-pre-wrap">{rs.termsConditions}</p>
                </div>
              )}
            </div>

            <div className="w-[45%]">
              <table className="w-full text-[10px] font-medium text-gray-800">
                <tbody>
                  {rs.showSubtotal !== false && <tr><td className="py-1">Subtotal</td><td className="text-right">₹{subtotal.toFixed(2)}</td></tr>}
                  {(rs.showSummaryDiscount !== false && discAmt > 0) && <tr><td className="py-1 text-green-700">Discount</td><td className="text-right text-green-700">- ₹{discAmt.toFixed(2)}</td></tr>}
                  {(showGstBreakdown && rs.showTaxableAmount !== false) && <tr><td className="py-1 text-gray-500">Taxable Amount</td><td className="text-right text-gray-500">₹{taxable.toFixed(2)}</td></tr>}
                  {showGstBreakdown && Object.entries(gstSummary).flatMap(([rateStr, data]) => {
                    const rate = Number(rateStr);
                    const halfRate = rate / 2;
                    const halfTax = data.tax / 2;
                    const res = [];
                    if (rs.showCgst !== false) res.push(<tr key={`cgst-${rate}`}><td className="py-1 text-gray-500">CGST @ {halfRate}%</td><td className="text-right text-gray-500">₹{halfTax.toFixed(2)}</td></tr>);
                    if (rs.showSgst !== false) res.push(<tr key={`sgst-${rate}`}><td className="py-1 text-gray-500">SGST @ {halfRate}%</td><td className="text-right text-gray-500">₹{halfTax.toFixed(2)}</td></tr>);
                    return res;
                  })}
                  {(showGstBreakdown && totalGstAmount > 0 && rs.showTotalGst !== false) && (
                    <tr><td className="py-1 font-semibold text-blue-800">Total GST</td><td className="text-right font-semibold text-blue-800">₹{totalGstAmount.toFixed(2)}</td></tr>
                  )}
                </tbody>
              </table>
              {rs.showGrandTotal !== false && (
                <div className="border-t-2 border-blue-900 pt-2 flex items-center justify-between text-sm text-blue-900 font-black">
                  <span>GRAND TOTAL <span className="text-[9px] font-bold text-blue-700">(Including GST)</span></span>
                  <span className="flex items-center"><span className="mr-0.5 font-sans">₹</span>{total.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Signatures & Text */}
          <div className="px-4 mt-8 flex justify-between items-end border-b border-gray-200 pb-6 mb-2">
            <div className="w-56 text-center">
              {/* Customer signature removed as requested */}
            </div>
            <div className="w-56 text-center">
              {rs.showAuthorizedSignature !== false && (
                <>
                  <p className="font-bold text-blue-900 text-[10px] mb-6 tracking-wide">For {receipt.billingCompany || settings?.shopName || "Sri Vishnu Priya Stationary"}</p>
                  <div className="flex justify-center mb-1 h-8">
                    {settings?.signature ? <img src={settings.signature} className="h-full mix-blend-multiply" /> : <div className="text-blue-900 opacity-30 text-lg" style={{ fontFamily: "cursive" }}>Sign</div>}
                  </div>
                  <div className="border-t border-dashed border-gray-400 w-full mb-1"></div>
                  <p className="font-bold text-gray-800 text-[9px]">Authorized Signature</p>
                </>
              )}
            </div>
          </div>

          {/* Bottom Message */}
          <div className="text-center pb-4">
            {(rs.showThankYou !== false && rs.thankYouMessage) && (
              <p className="text-[12px] font-bold text-blue-900 uppercase tracking-widest">{rs.thankYouMessage}</p>
            )}
            {(rs.showThankYou !== false && !rs.thankYouMessage) && (
              <p className="text-[12px] font-bold text-blue-900 uppercase tracking-widest">Thank You For Your Purchase</p>
            )}
            {rs.footerText && (
              <p className="text-[10px] text-gray-600 mt-0.5">{rs.footerText}</p>
            )}
            {!rs.footerText && rs.showThankYou !== false && (
              <p className="text-[10px] text-gray-600 mt-0.5">Visit Again</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared state types ───────────────────────────────────────────────────────
type TabPortalOptions = {
  [key: string]: boolean;
  dashboard: boolean; pos: boolean; products: boolean; inventory: boolean;
  purchases: boolean; customers: boolean; history: boolean; reports: boolean; orders: boolean;
};

interface ReceiptSettings {
  showGst: boolean;
  printLogo: boolean;
  showThankYou: boolean;
  printBarcode: boolean;
  
  // Custom text fields
  invoiceTitle?: string;
  footerText?: string;
  termsConditions?: string;
  thankYouMessage?: string;
  returnPolicy?: string;

  // Customer Information toggles
  showCustomerName?: boolean;
  showCustomerType?: boolean;
  showCompanyName?: boolean;
  showMobileNumber?: boolean;
  showGstNumber?: boolean;
  showCustomerAddress?: boolean;

  // Product Table Columns
  showSNo?: boolean;
  showItemName?: boolean;
  showQuantity?: boolean;
  showRate?: boolean;
  showGstPercent?: boolean;
  showDiscount?: boolean;
  showAmount?: boolean;

  // Summary Section toggles
  showSubtotal?: boolean;
  showSummaryDiscount?: boolean;
  showTaxableAmount?: boolean;
  showCgst?: boolean;
  showSgst?: boolean;
  showTotalGst?: boolean;
  showRoundOff?: boolean;
  showGrandTotal?: boolean;
  showAmountInWords?: boolean;

  // Footer toggles
  showAuthorizedSignature?: boolean;
  showCustomerSignature?: boolean;
  showFooterNotes?: boolean;
}

interface AppSettings {
  shopName: string; gstIn: string; phone: string; address: string;
  defaultGstOn: boolean; defaultGstRate: number;
  tabPortalOptions: TabPortalOptions;
  receiptSettings: ReceiptSettings;
  printerType: string;
  printerCopies: number;
  adminPassword?: string;
  logo?: string;
  signature?: string;
  shopSubtitle?: string;
  companyList?: string[];
  customerTypes?: string[];
  email?: string;
}

// ─── App Shell ────────────────────────────────────────────────────────────────
const screenTitles: Record<Screen, { title: string; subtitle?: string }> = {
  login: { title: "Login" },
  dashboard: { title: "Dashboard", subtitle: "Sales overview · Vishnu Priya Stationary" },
  pos: { title: "POS Billing", subtitle: "Fast billing terminal" },
  products: { title: "Product Management", subtitle: "Manage your catalog" },
  inventory: { title: "Inventory", subtitle: "Track stock levels" },
  purchases: { title: "Purchase Management", subtitle: "Supplier orders & stock intake" },
  customers: { title: "Khata Management", subtitle: "Manage your Khata accounts" },
  reports: { title: "Reports & Analytics", subtitle: "Business performance insights" },
  history: { title: "Bill History", subtitle: "Review and reprint past sales" },
  settings: { title: "Settings", subtitle: "Configure your store" },
  receipt: { title: "Receipt Preview", subtitle: "Bill preview & print" },
  orders: { title: "Orders", subtitle: "Order management — Coming soon" },
};

// ─── Edit Bill Modal ──────────────────────────────────────────────────────────
function EditBillModal({
  sale, productRows, customers, currentUser, onSave, onClose, onViewReceipt,
}: {
  sale: any;
  productRows: any[];
  customers: Customer[];
  currentUser: User | null;
  onSave: (saleId: number, payload: any) => Promise<any>;
  onClose: () => void;
  onViewReceipt: (sale: any) => void;
}) {
  // ── Editable fields ──
  const [editItems, setEditItems] = useState<any[]>(() =>
    (sale.items || []).map((i: any) => ({ ...i }))
  );
  const [customer, setCustomer] = useState<string>(sale.customer || "");
  const [customerType, setCustomerType] = useState<string>(sale.customerType || "Retail Customer");
  const [customerCompany, setCustomerCompany] = useState<string>(sale.customerCompany || "");
  const [billingCompany, setBillingCompany] = useState<string>(sale.billingCompany || "");
  const [paymentMethod, setPaymentMethod] = useState<string>(sale.paymentMethod || "Cash");
  const [billType, setBillType] = useState<string>(sale.billType || "Tax Invoice");
  const [editReason, setEditReason] = useState("");

  // ── Product search for adding items ──
  const [addSearch, setAddSearch] = useState("");
  const [showAddSearch, setShowAddSearch] = useState(false);

  // ── Custom item form ──
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customGst, setCustomGst] = useState("0");

  // ── UI state ──
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savedSale, setSavedSale] = useState<any | null>(null);

  // ── Calculations ──
  const subtotal = editItems.reduce((s, i) => s + (i.price * i.qty), 0);
  const tax      = editItems.reduce((s, i) => s + (i.price * i.qty * ((i.gst ?? 0) / 100)), 0);
  const total    = Math.round((subtotal + tax) * 100) / 100;

  // ── Item helpers ──
  const updateItem = (idx: number, field: string, value: any) => {
    setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };
  const removeItem = (idx: number) => setEditItems(prev => prev.filter((_, i) => i !== idx));

  const addProductToEdit = (p: any) => {
    const existing = editItems.findIndex(i => i.id === p.id && !i.isCustom);
    if (existing >= 0) {
      updateItem(existing, "qty", editItems[existing].qty + 1);
    } else {
      setEditItems(prev => [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, category: p.category, gst: p.gst ?? 0, isCustom: false }]);
    }
    setAddSearch(""); setShowAddSearch(false);
  };

  const addCustomItem = () => {
    if (!customName.trim() || !customPrice || Number(customPrice) <= 0) return;
    setEditItems(prev => [...prev, {
      id: Date.now(), name: customName.trim(), price: Number(customPrice),
      qty: Number(customQty) || 1, category: "Custom", gst: Number(customGst), isCustom: true,
    }]);
    setCustomName(""); setCustomPrice(""); setCustomQty("1"); setCustomGst("0"); setShowCustom(false);
  };

  const filteredProducts = useMemo(() => {
    if (!addSearch.trim()) return [];
    const s = addSearch.toLowerCase();
    return productRows.filter(p => p.name.toLowerCase().includes(s)).slice(0, 8);
  }, [addSearch, productRows]);

  // ── Save ──
  const handleConfirmSave = async () => {
    if (editItems.length === 0) { setSaveError("Bill must have at least one item."); return; }
    setIsSaving(true); setSaveError(null);
    try {
      const result = await onSave(sale.id, {
        items: editItems,
        customer,
        customerType,
        customerCompany,
        billingCompany,
        paymentMethod,
        billType,
        editedBy: currentUser?.name || "Unknown",
        editReason,
      });
      setSavedSale(result?.sale ?? { ...sale, items: editItems, customer, paymentMethod, billType, subtotal, tax, total });
      setShowConfirm(false);
    } catch (err: any) {
      setSaveError(err?.message || "Unable to update bill. No changes were applied. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const fmtINR = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Saved state ──
  if (savedSale) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Bill Updated!</h3>
          <p className="text-gray-500 text-sm mb-1">Bill #{sale.id} has been saved successfully.</p>
          <p className="text-gray-700 font-semibold text-lg mb-6">{fmtINR(total)}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { onViewReceipt(savedSale); onClose(); }}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >Print Updated Bill</button>
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.5)" }}>
      {/* Panel */}
      <div className="ml-auto w-full max-w-5xl bg-white flex flex-col h-full shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" /> Edit Bill #{sale.id}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Created {new Date(sale.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              {sale.updatedAt && <span className="ml-2 text-amber-600">· Edited {new Date(sale.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Error banner */}
        {saveError && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium flex-1">{saveError}</p>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">

            {/* Left: Items */}
            <div className="lg:col-span-2 p-6 border-r border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Bill Items</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAddSearch(s => !s); setShowCustom(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                  ><Plus className="w-3.5 h-3.5" /> Add Product</button>
                  <button
                    onClick={() => { setShowCustom(s => !s); setShowAddSearch(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                  ><Plus className="w-3.5 h-3.5" /> Custom Item</button>
                </div>
              </div>

              {/* Product search */}
              {showAddSearch && (
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    autoFocus
                    type="text" value={addSearch} onChange={e => setAddSearch(e.target.value)}
                    placeholder="Search product to add..."
                    className="w-full pl-9 pr-4 py-2.5 border border-blue-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filteredProducts.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                      {filteredProducts.map(p => (
                        <button key={p.id} onClick={() => addProductToEdit(p)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-sm text-left"
                        >
                          <span className="font-medium text-gray-800">{p.name}</span>
                          <span className="text-gray-400 text-xs">{p.stock} in stock · ₹{p.price}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {addSearch.trim() && filteredProducts.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2 pl-1">No products found. Use Custom Item instead.</p>
                  )}
                </div>
              )}

              {/* Custom item form */}
              {showCustom && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-purple-700">Add Custom Item</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input type="text" placeholder="Item name" value={customName} onChange={e => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <input type="number" placeholder="Price (₹)" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <input type="number" placeholder="Qty" value={customQty} onChange={e => setCustomQty(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <div className="col-span-2 flex items-center gap-3">
                      <label className="text-xs text-gray-600 flex-shrink-0">GST %</label>
                      <select value={customGst} onChange={e => setCustomGst(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                        {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                      <button onClick={addCustomItem} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700">Add</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Items table */}
              {editItems.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                  No items. Add products above.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-2">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2 text-center">Price (₹)</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2 text-center">GST %</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-1"></div>
                  </div>
                  {editItems.map((item, idx) => (
                    <div key={idx} className={`grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-lg ${item.isCustom ? "bg-purple-50" : "bg-gray-50"} border ${item.isCustom ? "border-purple-100" : "border-gray-100"}`}>
                      <div className="col-span-4">
                        <input
                          type="text" value={item.name}
                          onChange={e => updateItem(idx, "name", e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-gray-800 focus:outline-none focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1"
                        />
                        {item.isCustom && <span className="text-xs text-purple-500 px-1">Custom</span>}
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number" value={item.price} min={0}
                          onChange={e => updateItem(idx, "price", Number(e.target.value))}
                          className="w-full text-center text-sm bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number" value={item.qty} min={1}
                          onChange={e => updateItem(idx, "qty", Math.max(1, Number(e.target.value)))}
                          className="w-full text-center text-sm bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={item.gst ?? 0}
                          onChange={e => updateItem(idx, "gst", Number(e.target.value))}
                          className="w-full text-center text-sm bg-white border border-gray-200 rounded-lg px-1 py-1 focus:outline-none"
                        >
                          {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold text-gray-800 font-mono pr-1">
                        ₹{(item.price * item.qty).toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => removeItem(idx)} className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals summary */}
              {editItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span><span className="font-mono">{fmtINR(subtotal)}</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>GST</span><span className="font-mono">{fmtINR(tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total</span><span className="font-mono text-blue-600">{fmtINR(total)}</span>
                  </div>
                </div>
              )}

              {/* Audit info */}
              {sale.editHistory && sale.editHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Edit History</p>
                  <div className="space-y-1.5">
                    {sale.editHistory.map((h: any, i: number) => (
                      <div key={i} className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="font-medium">{h.editedBy}</span> · {new Date(h.editedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })} · ₹{h.oldTotal} → ₹{h.newTotal}
                        {h.editReason && <span className="ml-2 italic">"{h.editReason}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Customer & Payment */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer Name</label>
                <div className="relative">
                  <input
                    type="text" value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    list="edit-customer-list"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer name"
                  />
                  <datalist id="edit-customer-list">
                    {customers.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer Type</label>
                <select
                  value={customerType} onChange={e => setCustomerType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {["Retail Customer","Wholesale","School","College","Office","Bank","Corporate","Walk-in"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer Company</label>
                <input
                  type="text" value={customerCompany} onChange={e => setCustomerCompany(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bill Type</label>
                <select
                  value={billType} onChange={e => setBillType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {["Tax Invoice","Cash Bill","Retail Invoice","Quotation","Proforma Invoice","Delivery Challan"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Cash","UPI","Card","Khata","NEFT","Cheque"].map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        paymentMethod === m
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >{m}</button>
                  ))}
                </div>
              </div>

              {paymentMethod === "Khata" && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-xs text-orange-700 font-medium">
                    ⚠ Khata: Bill will be added to <strong>{customer || "customer"}'s</strong> outstanding balance.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason for Edit (Optional)</label>
                <input
                  type="text" value={editReason} onChange={e => setEditReason(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Quantity correction"
                />
              </div>

              {/* Save button */}
              <button
                id="edit-bill-save-btn"
                onClick={() => { setSaveError(null); setShowConfirm(true); }}
                disabled={editItems.length === 0 || isSaving}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Review & Save Changes
              </button>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-2">Save changes to Bill #{sale.id}?</h3>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p>Original total: <strong>₹{sale.total?.toFixed(2)}</strong></p>
              <p>Updated total: <strong className="text-blue-600">₹{total.toFixed(2)}</strong></p>
              <p>{editItems.length} item{editItems.length !== 1 ? "s" : ""} · {paymentMethod} · {customer || "Walk-in"}</p>
              <p className="text-amber-700 text-xs mt-2">Inventory, Khata and customer records will be updated automatically.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >Cancel</button>
              <button
                id="edit-bill-confirm-btn"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bill History ─────────────────────────────────────────────────────────────
function BillHistoryScreen({ sales, onViewReceipt, onDeleteBill, onEditBill, businessDate, businessDateLabel }: {
  sales: any[];
  onViewReceipt: (sale: any) => void;
  onDeleteBill: (id: number) => void;
  onEditBill: (sale: any) => void;
  businessDate: string;
  businessDateLabel: string;
}) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper: format bill display date
  const formatBillDate = (sale: any) => {
    if (sale.billDate) {
      return new Date(sale.billDate + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }
    return new Date(sale.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Fetch from backend when businessDate changes or showAll toggle changes
  useEffect(() => {
    if (showAll) {
      setFilteredSales(sales);
      return;
    }
    setIsLoading(true);
    fetch(`/api/sales?date=${encodeURIComponent(businessDate)}`)
      .then(r => r.json())
      .then(d => {
        setFilteredSales(Array.isArray(d.sales) ? d.sales : []);
      })
      .catch(() => {
        // Fall back to client-side filter if backend unreachable
        setFilteredSales(sales.filter(s => (s.billDate || "") === businessDate));
      })
      .finally(() => setIsLoading(false));
  }, [businessDate, showAll, sales]);

  const displayList = filteredSales.filter(s =>
    String(s.id).includes(search) ||
    (s.customer && s.customer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><History className="w-6 h-6 text-blue-600" /> Bill History</h2>
          <p className="text-gray-500 text-sm">Browse, search, and reprint all your past transactions.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Bill ID or Customer..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
      </div>

      {/* Business Date Bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 shadow-sm">
          <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-blue-600">Business Date:</span>
          <span className="text-sm font-bold text-blue-900">{businessDateLabel}</span>
          {isLoading && <span className="ml-1 text-xs text-blue-400 animate-pulse">Loading…</span>}
        </div>
        <button
          onClick={() => setShowAll(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            showAll
              ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          {showAll ? "Showing All Dates" : "View All Dates"}
        </button>
        <span className="text-xs text-gray-400">{displayList.length} bill{displayList.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <th className="py-4 px-4 text-center w-16">Bill No</th>
              <th className="py-4 px-4">Date</th>
              <th className="py-4 px-4">Customer</th>
              <th className="py-4 px-4">Items</th>
              <th className="py-4 px-4 text-center">Payment</th>
              <th className="py-4 px-4 text-right">Total</th>
              <th className="py-4 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayList.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 italic">
                {isLoading ? "Loading bills…" : showAll ? "No sales records found." : `No bills for ${businessDateLabel}.`}
              </td></tr>
            ) : displayList.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 text-center">
                  <span className="font-mono font-bold text-blue-700 text-base">
                    {sale.billNumber != null ? sale.billNumber : <span className="text-xs text-gray-400">#{sale.id}</span>}
                  </span>
                  {sale.editHistory?.length > 0 && (
                    <span className="ml-1 text-xs text-amber-600 font-medium" title={`Edited ${sale.editHistory.length} time(s)`}>✎</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  <div className="font-medium">{formatBillDate(sale)}</div>
                  <div className="text-gray-400">{new Date(sale.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                </td>
                <td className="py-3 px-4 font-medium text-gray-800">{sale.customer}</td>
                <td className="py-3 px-4 text-gray-600">{sale.items?.length || 0} items</td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' : sale.paymentMethod === 'UPI' ? 'bg-blue-100 text-blue-700' : sale.paymentMethod === 'Khata' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                    {sale.paymentMethod || 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">₹{sale.total?.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      id={`bill-view-${sale.id}`}
                      onClick={() => onViewReceipt(sale)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-medium text-xs"
                    ><Eye className="w-3 h-3" /> View</button>
                    <button
                      id={`bill-edit-${sale.id}`}
                      onClick={() => onEditBill(sale)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white rounded-lg transition-colors font-medium text-xs"
                    ><Edit2 className="w-3 h-3" /> Edit</button>
                    <button
                      onClick={() => {
                        const pwd = prompt("Enter master password to delete this bill:");
                        if (pwd === "7703") { onDeleteBill(sale.id); }
                        else if (pwd !== null) { alert("Incorrect password!"); }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-medium text-xs"
                      title="Delete Bill"
                    ><Trash2 className="w-3 h-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
// Seed users so login works even when backend is unreachable
const SEED_USERS: User[] = [
  { id: 1, name: "Vishnu Mohan Rao", username: "admin", password: "admin", role: "Admin", status: "active", permissions: { dashboard: true, pos: true, products: true, inventory: true, purchases: true, customers: true, reports: true } },
  { id: 2, name: "Sunita Bai", username: "sunita", password: "staff123", role: "Cashier", status: "active", permissions: { dashboard: false, pos: true, products: false, inventory: true, purchases: false, customers: true, reports: false } },
  { id: 3, name: "Amit Sharma", username: "amit", password: "staff123", role: "Staff", status: "active", permissions: { dashboard: false, pos: false, products: true, inventory: true, purchases: true, customers: false, reports: false } },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // ── Shared dataset state ──
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  // Pre-seed with default users so login works when backend is unavailable
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [saleStatus, setSaleStatus] = useState("No sale recorded yet");
  const [editingSale, setEditingSale] = useState<any | null>(null);

  // ── Business date (single source of truth for new bills) ──
  // Initialised to today in YYYY-MM-DD; updated when Dashboard date changes.
  const [businessDate, setBusinessDate] = useState<string>(toYMD(new Date()));

  const refreshDataset = async () => {
    try {
      const results = await Promise.allSettled([
        fetch("/api/products"), fetch("/api/customers"), fetch("/api/purchases"),
        fetch(`/api/summary?startDate=${businessDate}&endDate=${businessDate}`), fetch("/api/users"), fetch("/api/sales"), fetch("/api/settings")
      ]);
      const [prodRes, custRes, purRes, sumRes, userRes, salesRes, setRes] = results;
      if (prodRes.status === "fulfilled" && prodRes.value.ok) { const d = await prodRes.value.json(); if (Array.isArray(d.products)) setProductRows(d.products.map((p: any) => ({ ...p, gst: p.gst ?? 18 }))); }
      if (custRes.status === "fulfilled" && custRes.value.ok) { const d = await custRes.value.json(); if (Array.isArray(d.customers)) setCustomers(d.customers); }
      if (purRes.status === "fulfilled" && purRes.value.ok) { const d = await purRes.value.json(); if (Array.isArray(d.purchases)) setPurchases(d.purchases); }
      if (sumRes.status === "fulfilled" && sumRes.value.ok) { const d = await sumRes.value.json(); setSummary(d); }
      if (userRes.status === "fulfilled" && userRes.value.ok) { const d = await userRes.value.json(); if (Array.isArray(d.users) && d.users.length > 0) setUsers(d.users); }
      if (salesRes.status === "fulfilled" && salesRes.value.ok) { const d = await salesRes.value.json(); if (Array.isArray(d.sales)) setSalesHistory([...d.sales].reverse()); }
      if (setRes.status === "fulfilled" && setRes.value.ok) { const d = await setRes.value.json(); if (d.settings) setSettings(prev => ({ ...prev, ...d.settings })); }
    } catch (e) { console.warn("Failed to refresh dataset", e); }
  };

  // Fetch dashboard summary for a specific date range (used by DateFilterBar)
  const fetchSummaryForRange = async (startDate: string, endDate: string): Promise<void> => {
    const params = new URLSearchParams({ startDate, endDate });
    const res = await fetch(`/api/summary?${params.toString()}`);
    if (!res.ok) throw new Error(`Summary fetch failed: ${res.status}`);
    const d = await res.json();
    setSummary(d);
    // Also refresh sales list so transactions panel stays in sync
    try {
      const salesRes = await fetch("/api/sales");
      if (salesRes.ok) { const sd = await salesRes.json(); if (Array.isArray(sd.sales)) setSalesHistory([...sd.sales].reverse()); }
    } catch { /* non-fatal */ }
  };

  // Edit an existing bill — atomic reversal + apply on backend
  const editBillOnServer = async (saleId: number, payload: any): Promise<any> => {
    const res = await fetch(`/api/sales/${saleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to update bill (${res.status})`);
    }
    const data = await res.json();
    // Refresh all data so dashboard, history, inventory, khata are all in sync
    await refreshDataset();
    return data;
  };

  useEffect(() => {
    if (!currentUser) return;

    const evtSource = new EventSource("/api/events");
    evtSource.onmessage = () => refreshDataset();

    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setCurrentUser(null);
        setScreen("login");
      }, 15 * 60 * 1000); // 15 mins
    };
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    resetTimer();
    return () => {
      evtSource.close();
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
    };
  }, [currentUser]);

  const deleteProduct = async (id: number) => {
    setProductRows(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      refreshDataset();
    } catch (error) {
      console.warn("Could not persist product deletion", error);
    }
  };

  const saveProductToServer = async (product: Omit<ProductRow, "status">) => {
    const existing = productRows.find(p => p.id === product.id);
    const status = product.stock === 0 ? "out" : product.stock < 10 ? "low" : "active";
    const payload = {
      name: product.name,
      category: product.category,
      stock: product.stock,
      price: product.price,
      supplier: product.supplier || "",
      gst: product.gst,
      cost: product.cost,
      status
    };

    try {
      if (existing && product.id < 1e12) {
        const response = await fetch(`/api/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          setProductRows(prev => prev.map(p => p.id === product.id ? { ...p, ...data.product } : p));
        }
      } else {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          setProductRows(prev => {
            // Remove the temporary product if any
            const filtered = prev.filter(p => p.id !== product.id);
            return [...filtered, { ...data.product, gst: data.product.gst ?? 18 }];
          });
          refreshDataset();
        }
      }
    } catch (error) {
      console.warn("Could not save product to server:", error);
      if (existing) {
        setProductRows(prev => prev.map(p => p.id === product.id ? { ...p, ...payload } : p));
      } else {
        setProductRows(prev => [...prev, { ...product, id: Date.now(), status }]);
      }
    }
  };

  const addPurchaseToServer = async (payload: Omit<Purchase, "id" | "status">) => {
    const purchaseData = {
      ...payload,
      status: "received"
    };

    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData)
      });
      if (response.ok) {
        const data = await response.json();
        setPurchases(prev => [...prev, data.purchase]);
        refreshDataset();
      }
    } catch (error) {
      console.warn("Could not save purchase to server:", error);
      setPurchases(prev => [...prev, { ...purchaseData, id: `PO-${(prev.length + 1).toString().padStart(3, "0")}` }]);
    }
  };

  const addCustomerToServer = async (payload: Omit<Customer, "id" | "total" | "visits" | "lastVisit">) => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(prev => [...prev, data.customer]);
        refreshDataset();
      }
    } catch (error) {
      console.warn("Could not save customer to server:", error);
      setCustomers(prev => [...prev, {
        ...payload,
        id: Date.now(),
        total: 0,
        visits: 1,
        lastVisit: new Date().toLocaleDateString("en-GB")
      }]);
    }
  };

  const recordPaymentToServer = async (id: number, amount: number, note?: string) => {
    try {
      const response = await fetch(`/api/customers/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note }),
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(prev => prev.map(c => c.id === id ? data.customer : c));
      }
    } catch (error) {
      console.warn("Could not record payment:", error);
    }
  };

  const resetDatabase = async (password: string) => {
    try {
      const response = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        const [prodRes, custRes, purRes, sumRes, salesRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/customers"),
          fetch("/api/purchases"),
          fetch("/api/summary"),
          fetch("/api/sales")
        ]);
        if (prodRes.ok && custRes.ok && purRes.ok && sumRes.ok && salesRes.ok) {
          const [prodData, custData, purData, sumData, salesData] = await Promise.all([
            prodRes.json(), custRes.json(), purRes.json(), sumRes.json(), salesRes.json()
          ]);
          setProductRows(prodData.products.map((product: any) => ({ ...product, gst: product.gst ?? 18 })));
          setCustomers(custData.customers || []);
          setPurchases(purData.purchases || []);
          setSummary(sumData || {});
          setSalesHistory(salesData.sales || []);
          refreshDataset();
        }
        return true;
      }
    } catch (error) {
      console.error("Failed to reset database:", error);
    }
    return false;
  };

  const previewReceipt = (payload: Omit<ReceiptData, "invoice" | "date" | "time">) => {
    const billDisplayDate = new Date(businessDate + "T00:00:00").toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
    const now = new Date();
    setReceiptData({
      ...payload,
      invoice: "PREVIEW",
      date: billDisplayDate,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setScreen("receipt");
  };

  const completeSale = async (payload: Omit<ReceiptData, "invoice" | "date" | "time">) => {
    // Use Dashboard business date as the bill display date
    const billDisplayDate = new Date(businessDate + "T00:00:00").toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
    const now = new Date();
    const baseReceipt: ReceiptData = {
      ...payload,
      paidAmount: payload.paidAmount ?? payload.total,
      change: (payload.paidAmount ?? payload.total) - payload.total,
      invoice: `INV-${now.getTime()}`,
      date: billDisplayDate,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setReceiptData(baseReceipt);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: baseReceipt.items,
          total: baseReceipt.total,
          subtotal: baseReceipt.subtotal,
          tax: baseReceipt.tax,
          customer: baseReceipt.customer,
          customerType: baseReceipt.customerType,
          customerCompany: baseReceipt.customerCompany,
          billingCompany: baseReceipt.billingCompany,
          paymentMethod: baseReceipt.paymentMethod,
          billType: baseReceipt.billType,
          billDate: businessDate,           // Dashboard business date → backend
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save sale");
      }

      const data = await response.json();
      const savedSale = data.sale;
      const billNum: number | undefined = savedSale?.billNumber;

      // Update receipt with server-assigned daily bill number
      const receipt: ReceiptData = {
        ...baseReceipt,
        billNumber: billNum,
      };
      setReceiptData(receipt);
      setSaleStatus(`Sale recorded: Bill #${billNum ?? savedSale?.id ?? "unknown"}`);

      // Update local product stocks based on successful sale
      refreshDataset();

      return receipt;
    } catch (error) {
      console.warn("Sale submission failed", error);
      setSaleStatus("Sale saved locally; backend unavailable");
    }

    return baseReceipt;
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        // Use allSettled so a single failing endpoint doesn't break everything
        const [prodRes, custRes, purRes, sumRes, userRes, salesRes] = await Promise.allSettled([
          fetch("/api/products", { signal: controller.signal }),
          fetch("/api/customers", { signal: controller.signal }),
          fetch("/api/purchases", { signal: controller.signal }),
          fetch("/api/summary", { signal: controller.signal }),
          fetch("/api/users", { signal: controller.signal }),
          fetch("/api/sales", { signal: controller.signal }),
        ]);

        if (prodRes.status === "fulfilled" && prodRes.value.ok) {
          const d = await prodRes.value.json();
          if (Array.isArray(d.products)) setProductRows(d.products.map((p: any) => ({ ...p, gst: p.gst ?? 18 })));
        } else {
          // Fallback to seed products
          setProductRows(products.map(p => ({ ...p, gst: 18 })));
        }

        if (custRes.status === "fulfilled" && custRes.value.ok) {
          const d = await custRes.value.json();
          if (Array.isArray(d.customers)) setCustomers(d.customers);
        } else {
          setCustomers(customers);
        }

        if (purRes.status === "fulfilled" && purRes.value.ok) {
          const d = await purRes.value.json();
          if (Array.isArray(d.purchases)) setPurchases(d.purchases);
        } else {
          setPurchases(purchases);
        }

        if (sumRes.status === "fulfilled" && sumRes.value.ok) {
          const d = await sumRes.value.json();
          setSummary(d);
        }

        if (userRes.status === "fulfilled" && userRes.value.ok) {
          const d = await userRes.value.json();
          if (Array.isArray(d.users) && d.users.length > 0) {
            // Merge — backend users take priority but keep seed users as fallback
            setUsers(d.users);
          }
          // else keep seed users already in state
        }

        if (salesRes.status === "fulfilled" && salesRes.value.ok) {
          const d = await salesRes.value.json();
          if (Array.isArray(d.sales)) setSalesHistory([...d.sales].reverse());
        }

      } catch (error: any) {
        if (error?.name === "AbortError") return;
        console.warn("Could not load backend dataset:", error);
        // Fall through with seed data already set
      } finally {
        setIsLoadingProducts(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, []);

  // ── Persisted settings (localStorage) ──
  const defaultSettings: AppSettings = {
    shopName: "Vishnu Priya Stationary",
    gstIn: "27AABCU9603R1ZX",
    phone: "9876543210",
    address: "Shop No. 12, MG Road, Pune - 411001",
    defaultGstOn: true,
    defaultGstRate: 18,
    tabPortalOptions: {
      dashboard: false, pos: false, products: true,
      inventory: true, purchases: false, customers: false,
      history: false,
      reports: false,
      orders: false,
    },
    receiptSettings: {
      showGst: true, printLogo: false, showThankYou: true, printBarcode: false,
    },
    printerType: "Thermal (80mm)",
    printerCopies: 1,
  };

  const loadSettings = (): AppSettings => {
    try {
      const saved = localStorage.getItem("svp_settings");
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return defaultSettings;
  };

  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // ── Load settings from backend on startup ──
  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : Promise.reject("not ok"))
      .then(data => {
        if (data.settings) {
          console.log("[App] Loaded settings from backend:", JSON.stringify(data.settings));
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {
        console.log("[App] Backend settings unavailable, using localStorage/defaults");
      });
  }, []);

  // Global Keep-Alive Ping to prevent Render server from sleeping when tab is open
  useEffect(() => {
    const ping = () => {
      fetch("/api/status")
        .then(r => r.json())
        .catch(err => console.warn("[Keep-Alive] Global ping failed:", err));
    };
    ping();
    const interval = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const [portalMode, setPortalMode] = useState<PortalMode>("admin");
  const [showRibbon, setShowRibbon] = useState(() => ENABLE_GRAND_OPENING && !localStorage.getItem("hasLaunched"));

  // Re-evaluate portal mode when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setPortalMode(currentUser.role === "Admin" ? "admin" : "tablet");
    }
  }, [currentUser]);

  if (showRibbon) {
    return <RibbonCuttingScreen onComplete={() => setShowRibbon(false)} />;
  }

  if (screen === "login") {
    return (
      <LoginScreen
        users={users}
        logo={settings.logo}
        onLogin={(u) => {
          setCurrentUser(u);
          // Find first screen the user has permission for
          if (u.role === "Admin") {
            setScreen("dashboard");
          } else {
            const permScreenOrder: Screen[] = ["pos", "dashboard", "products", "inventory", "purchases", "customers", "history", "reports"];
            const firstAllowed = permScreenOrder.find(s => u.permissions[s] === true);
            setScreen(firstAllowed || "pos");
          }
        }}
      />
    );
  }

  const { title, subtitle } = screenTitles[screen];
  const userName = currentUser ? currentUser.name : "Guest";

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar
        screen={screen}
        setScreen={setScreen}
        portalMode={portalMode}
        tabPortalOptions={settings.tabPortalOptions}
        userName={userName}
        currentUser={currentUser}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} subtitle={subtitle} userName={userName} portalMode={portalMode} />
        {screen === "dashboard" && <Dashboard setScreen={setScreen} summary={summary} sales={salesHistory} onFetchSummary={fetchSummaryForRange} onBusinessDateChange={setBusinessDate} />}
        {screen === "pos" && (
          <POSScreen
            setScreen={setScreen}
            productRows={productRows}
            customers={customers}
            settings={settings}
            onSaveProduct={saveProductToServer}
            defaultGstOn={settings.defaultGstOn}
            defaultGstRate={settings.defaultGstRate}
            onDeleteProduct={deleteProduct}
            businessDate={businessDate}
            onCompleteSale={async (payload) => {
              const receipt = await completeSale(payload);
              setScreen("receipt");
              return receipt;
            }}
            onPreviewReceipt={previewReceipt}
          />
        )}
        {screen === "products" && (
          <ProductsScreen productRows={productRows} onSaveProduct={saveProductToServer} onDeleteProduct={deleteProduct} onRefresh={refreshDataset} />
        )}
        {screen === "orders" && (
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="text-center bg-white p-12 rounded-xl shadow-sm border border-gray-200">
              <ClipboardList className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Orders Management</h2>
              <p className="text-gray-500 max-w-sm mx-auto">This feature is currently under development. Check back soon for updates!</p>
            </div>
          </div>
        )}
        {screen === "inventory" && <InventoryScreen productRows={productRows} sales={salesHistory} onRefresh={refreshDataset} />}
        {screen === "purchases" && <PurchasesScreen purchases={purchases} onAddPurchase={addPurchaseToServer} />}
        {screen === "customers" && <CustomersScreen customers={customers} onAddCustomer={addCustomerToServer} onRecordPayment={recordPaymentToServer} refreshDataset={refreshDataset} />}
        {screen === "history" && <BillHistoryScreen
          sales={salesHistory}
          businessDate={businessDate}
          businessDateLabel={new Date(businessDate + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          onEditBill={(sale) => setEditingSale(sale)}
          onDeleteBill={async (id) => {
            try {
              const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
              if (res.ok) { refreshDataset(); } else { alert("Failed to delete bill."); }
            } catch (e) { alert("Error deleting bill."); }
          }}
          onViewReceipt={(sale) => {
            // Use stored billDate (business date) if available; fall back to createdAt for legacy bills
            const billDisplayDate = sale.billDate
              ? new Date(sale.billDate + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
              : new Date(sale.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            setReceiptData({
              items: sale.items || [],
              paymentMethod: sale.paymentMethod || "Cash",
              customer: sale.customer || "Walk-in",
              customerCompany: sale.customerCompany || "",
              billingCompany: sale.billingCompany || "",
              subtotal: sale.subtotal ?? sale.items?.reduce((s: number, i: any) => s + (i.price * i.qty), 0) ?? 0,
              tax: sale.tax ?? (sale.total - (sale.items?.reduce((s: number, i: any) => s + (i.price * i.qty), 0) ?? 0)),
              total: sale.total || 0,
              paidAmount: sale.total || 0,
              change: 0,
              invoice: `INV-${String(sale.id).padStart(4, '0')}`,
              date: billDisplayDate,
              time: new Date(sale.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              billType: sale.billType || "Tax Invoice",
              billNumber: sale.billNumber,
            });
            setSaleStatus("Reprinting Old Bill");
            setScreen("receipt");
          }}
        />}
        {editingSale && (
          <EditBillModal
            sale={editingSale}
            productRows={productRows}
            customers={customers}
            currentUser={currentUser}
            onSave={editBillOnServer}
            onClose={() => setEditingSale(null)}
            onViewReceipt={(sale) => {
              // Use stored billDate for edited bills; createdAt as fallback
              const billDisplayDate = sale.billDate
                ? new Date(sale.billDate + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : new Date(sale.updatedAt || sale.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
              setReceiptData({
                items: sale.items || [],
                paymentMethod: sale.paymentMethod || "Cash",
                customer: sale.customer || "Walk-in",
                customerCompany: sale.customerCompany || "",
                billingCompany: sale.billingCompany || "",
                subtotal: sale.subtotal ?? sale.items?.reduce((s: number, i: any) => s + (i.price * i.qty), 0) ?? 0,
                tax: sale.tax ?? 0,
                total: sale.total || 0,
                paidAmount: sale.total || 0,
                change: 0,
                invoice: `INV-${String(sale.id).padStart(4, '0')}`,
                date: billDisplayDate,
                time: new Date(sale.updatedAt || sale.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                billType: sale.billType || "Tax Invoice",
                billNumber: sale.billNumber,
              });
              setSaleStatus("Updated Bill");
              setScreen("receipt");
              setEditingSale(null);
            }}
          />
        )}
        {screen === "reports" && <ReportsScreen summary={summary} sales={salesHistory} />}
        {screen === "settings" && portalMode === "admin" && (
          <SettingsScreen settings={settings} setSettings={setSettings} onResetDb={resetDatabase} />
        )}
        {screen === "receipt" && <ReceiptScreen receiptData={receiptData} saleStatus={saleStatus} settings={settings} />}
      </div>
    </div>
  );
}
