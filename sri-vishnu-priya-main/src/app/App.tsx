import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Settings,
  Users, Truck, ClipboardList, LogOut, Bell, Search, Plus,
  Printer, CreditCard, Smartphone, Banknote, Minus, Trash2,
  Edit2, ChevronDown, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, X, Eye, EyeOff, Download, FileText, Filter,
  ArrowUpRight, ArrowDownRight, Tag, Box, RefreshCw, Receipt,
  ChevronRight, Star, Zap, Moon, Sun, MapPin, Phone, User, Gift, Globe, Book, History
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import confetti from "canvas-confetti";

// ─── Feature Flags ────────────────────────────────────────────────────────────
// Set this to false when you want to permanently disable the grand opening screen
const ENABLE_GRAND_OPENING = true;

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen =
  | "login" | "dashboard" | "pos" | "products"
  | "inventory" | "purchases" | "customers" | "reports"
  | "settings" | "receipt" | "history";

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
  { id: "products", icon: Package, label: "Products" },
  { id: "inventory", icon: Box, label: "Inventory" },
  { id: "purchases", icon: Truck, label: "Purchases" },
  { id: "customers", icon: Users, label: "Khata" },
  { id: "history", icon: History, label: "Bill History" },
  { id: "reports", icon: BarChart3, label: "Reports" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function Sidebar({ screen, setScreen, portalMode, tabPortalOptions, userName }: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  portalMode: PortalMode;
  tabPortalOptions: Record<string, boolean>;
  userName: string;
}) {
  const visibleItems = portalMode === "admin"
    ? allNavItems
    : allNavItems.filter(item => {
      if (item.id === "settings") return false; // tablets can't change settings
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

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ setScreen, summary, sales }: { setScreen: (s: Screen) => void; summary: any | null; sales: any[] }) {
  const liveRecentTxns = sales.slice(0, 5).map(s => ({
    id: s.id,
    customer: s.customer || s.customerType || "Retail Customer",
    items: s.items?.length || 0,
    time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    method: s.paymentMethod || "Cash",
    amount: s.total || 0
  }));
  const [backendStatus, setBackendStatus] = useState("Connecting...");

  const salesData = summary?.weeklyChartData?.length > 0 ? summary.weeklyChartData : EMPTY_WEEKLY_DATA;

  const kpis = [
    { label: "Today's Sales", value: summary?.metrics?.todaysSales ?? "₹0", change: "+0%", up: true, icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
    { label: "Pending Khata Amount", value: summary?.metrics?.pendingKhata ?? "₹0", change: "From customers", up: false, icon: Book, color: "bg-orange-50 text-orange-600" },
    { label: "Outstanding Khata", value: summary?.metrics?.outstandingCustomers ?? "0", change: "Need follow-up", up: false, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
    { label: "Low Stock Products", value: summary?.metrics?.lowStockAlerts ?? "0 items", change: "Need restock", up: false, icon: Package, color: "bg-amber-50 text-amber-600" },
    { label: "Today's Bills", value: summary?.metrics?.todaysBills ?? "0", change: "Today", up: true, icon: Receipt, color: "bg-cyan-50 text-cyan-600" },
    { label: "Monthly Revenue", value: summary?.metrics?.monthlyRevenue ?? "₹0", change: "This month", up: true, icon: TrendingUp, color: "bg-green-50 text-green-600" },
  ];

  useEffect(() => {
    fetch('/api/status')
      .then((response) => response.json())
      .then((data) => setBackendStatus(`${data.status} @ ${new Date(data.time).toLocaleTimeString()}`))
      .catch(() => setBackendStatus('Backend unavailable'));
  }, []);

  const bestSellers = summary?.bestSellers?.length > 0 ? summary.bestSellers : [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
            <p className="text-xl font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Weekly Sales</h3>
              <p className="text-xs text-muted-foreground">Revenue this week</p>
            </div>
            <select className="text-xs border border-border rounded-lg px-2 py-1 bg-white text-foreground focus:outline-none">
              <option>This Week</option><option>Last Week</option>
            </select>
          </div>
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
        </div>

        {/* Best Sellers */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Best Sellers</h3>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-3">
            {bestSellers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No sales recorded yet</p>
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
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Recent Transactions</h3>
            <button onClick={() => setScreen("reports")} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {liveRecentTxns.length === 0 ? <p className="text-sm text-gray-500 py-4 text-center">No recent transactions</p> : liveRecentTxns.map(txn => (
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
  setScreen, productRows, customers, settings, onSaveProduct, defaultGstOn, defaultGstRate, onCompleteSale, onDeleteProduct, onPreviewReceipt,
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
  const [billType, setBillType] = useState("Tax Invoice");
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

  const usedCategories = ["All", ...Array.from(new Set(productRows.map(p => p.category)))];

  const filtered = productRows.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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

  const addToCart = (p: ProductRow) => {
    if (p.stock <= 0) return;
    setCart(prev => {
      const ex = prev.find(c => c.id === p.id);
      if (ex) {
        if (ex.qty >= p.stock) return prev;
        return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, category: p.category, gst: p.gst }];
    });
  };

  // Quick-add directly to cart without saving
  const [quickName, setQuickName] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickQty, setQuickQty] = useState("1");

  const quickAddToCart = () => {
    if (!quickName.trim() || !quickPrice || Number(quickPrice) <= 0) return;
    const id = Date.now();
    setCart(prev => [...prev, { id, name: quickName.trim(), price: Number(quickPrice), qty: Number(quickQty) || 1, category: "Custom" }]);
    setQuickName(""); setQuickPrice(""); setQuickQty("1");
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

  const filteredCustomers = customers.filter(c => {
    const matchType = customerTypeFilter === "All" || c.type === customerTypeFilter;
    const s = customerSearch.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.company || "").toLowerCase().includes(s) || (c.gstin || "").toLowerCase().includes(s) || (c.customerCode || "").toLowerCase().includes(s);
    return matchType && matchSearch;
  });

  const selectedCustomerObj = customers.find(c => c.name === customer);

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
            <input
              value={quickQty} onChange={e => setQuickQty(e.target.value)}
              type="number" min="1"
              className="w-16 px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              placeholder="Qty"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
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
                <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className="px-3 py-1.5 bg-gray-50 border border-border rounded-lg text-xs font-medium hover:bg-gray-100 whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50 transition-colors">
                  <Package className="w-3 h-3 text-blue-500" />
                  {p.name}
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
                  <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className="w-full text-left disabled:opacity-70">
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
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Retail Invoice">Retail Invoice</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Proforma Invoice">Proforma Invoice</option>
                    <option value="Delivery Challan">Delivery Challan</option>
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
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
interface ProductRow {
  id: number; name: string; category: string; stock: number;
  price: number; supplier: string; status: string; gst: number;
  cost?: number;
  isbn?: string; author?: string; publisher?: string; classStd?: string;
}

function ProductsScreen({ productRows: rows, onSaveProduct, onDeleteProduct }: { productRows: ProductRow[]; onSaveProduct: (product: Omit<ProductRow, "status">) => void; onDeleteProduct: (id: number) => void; }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [filterSupplier, setFilterSupplier] = useState("All");
  const [filterPublisher, setFilterPublisher] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);

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

  const filtered = rows.filter(p => {
    const matchCat = filter === "All" || p.category === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchSupplier = filterSupplier === "All" || p.supplier === filterSupplier;
    const matchPub = filterPublisher === "All" || p.publisher === filterPublisher;
    const matchClass = filterClass === "All" || p.classStd === filterClass;
    return matchCat && matchSearch && matchSupplier && matchPub && matchClass;
  });

  const uniqueSuppliers = Array.from(new Set(rows.map(r => r.supplier).filter(Boolean)));
  const uniquePublishers = Array.from(new Set(rows.map(r => r.publisher).filter(Boolean)));
  const uniqueClasses = Array.from(new Set(rows.map(r => r.classStd).filter(Boolean)));

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
    </div>
  );
}

// ─── Inventory ────────────────────────────────────────────────────────────────
function InventoryScreen({ productRows, sales }: { productRows: ProductRow[], sales: any[] }) {
  const lowStock = productRows.filter(p => p.stock > 0 && p.stock < 10);
  const outStock = productRows.filter(p => p.stock === 0);

  const history = sales.flatMap(s => s.items.map((item: any) => ({
    date: new Date(s.createdAt).toLocaleDateString(),
    product: item.name,
    type: "Sale",
    qty: -item.qty,
    balance: productRows.find(p => p.name === item.name)?.stock ?? 0
  }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

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
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">Current Stock Levels</h3>
          <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
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
      </div>
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
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" placeholder="e.g. Ramesh Kumar" autoFocus />
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
    const revenue = sales.filter(s => new Date(s.createdAt).getMonth() === i && new Date(s.createdAt).getFullYear() === new Date().getFullYear()).reduce((sum, s) => sum + (s.total || 0), 0);
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
              <div className="space-y-3">
                {[
                  { key: "showGst", label: "Show GST breakdown on all bills (CGST / SGST)" },
                  { key: "printLogo", label: "Print shop logo" },
                  { key: "showThankYou", label: "Show thank you message" },
                  { key: "printBarcode", label: "Print barcode on receipt" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      checked={receiptSettings[key as keyof typeof receiptSettings]}
                      onChange={() => setReceiptSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof receiptSettings] }))}
                      className="rounded" />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
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
  if (ps > 0) res += " Rupees and " + inWords(ps) + " Paise";
  else res += " Rupees";
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

  const items = receipt.items.map((item) => ({
    name: item.name,
    qty: item.qty,
    rate: item.price,
    amount: item.qty * item.price,
    gst: item.gst !== undefined ? item.gst : 0,
  }));

  // Always compute from items — do NOT trust receipt.total for tax invoice display
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  // Infer discount: if receipt stored a subtotal, use it to find discAmt
  const storedSubtotal = (receipt as any).subtotal ?? subtotal;
  const discAmt = Math.max(0, storedSubtotal - (receipt.total - (receipt.tax ?? 0)));
  const discountRate = storedSubtotal > 0 ? discAmt / storedSubtotal : 0;
  const taxable = subtotal * (1 - discountRate);

  // Compute GST summary from items (GST-EXCLUSIVE: tax added on top)
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

  // Grand Total depends on showGst setting
  const showGst = settings?.receiptSettings?.showGst !== false; // default true
  const isTaxInvoice = (receipt as any).billType === "Tax Invoice";
  const showGstBreakdown = showGst && isTaxInvoice;

  // Grand Total = taxable + GST (only if showGst is ON)
  const total = showGst ? taxable + totalGstAmount : taxable;

  useEffect(() => {
    if (saleStatus === "success") {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      // Auto-hide success message could be managed by parent state, 
      // but the requirement says "Auto-hide after 3 seconds".
      // We can use a local state to hide the success banner.
    }
  }, [saleStatus]);

  const [showSuccessBanner, setShowSuccessBanner] = useState(saleStatus === "success");

  useEffect(() => {
    if (showSuccessBanner) {
      const t = setTimeout(() => setShowSuccessBanner(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showSuccessBanner]);

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
        <div className="flex gap-2 mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print {printType}
          </button>
        </div>
        <div className="text-xs text-muted-foreground mb-4 print:hidden">{saleStatus}</div>

        {/* Printable Container */}
        <div id="printable-receipt" className={`bg-white border border-gray-300 shadow-xl print:shadow-none print:border-none mx-auto ${isThermal ? 'text-[8px] p-2' : 'text-[10px]'}`} style={{ fontFamily: "Inter, sans-serif" }}>

          {/* Header */}
          <div className={`flex items-start gap-4 p-5 pb-4 border-b-2 border-blue-900 ${isThermal ? 'flex-col items-center text-center p-2' : ''}`}>
            <div className="w-14 h-14 bg-blue-900 text-white flex items-center justify-center rounded flex-shrink-0">
              {settings?.logo ? <img src={settings.logo} className="w-full h-full object-contain p-0.5 bg-white rounded" /> : <Tag className="w-6 h-6" />}
            </div>
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
            {(receipt as any).billType || "TAX INVOICE"}
          </div>

          {/* Info Section (Invoice & Customer merged for space) */}
          <div className="p-4 grid grid-cols-2 gap-4 text-[10px]">
            {/* Left: Invoice Info */}
            <div>
              <table className="text-gray-800 font-medium">
                <tbody>
                  <tr><td className="pr-3 pb-1 text-gray-500">Invoice No:</td><td className="pb-1 font-bold">{receipt.invoice}</td></tr>
                  <tr><td className="pr-3 pb-1 text-gray-500">Date:</td><td className="pb-1">{receipt.date}</td></tr>
                  <tr><td className="pr-3 pb-1 text-gray-500">Time:</td><td className="pb-1">{receipt.time}</td></tr>
                  <tr><td className="pr-3 text-gray-500">Payment:</td><td className="font-bold">{receipt.paymentMethod}</td></tr>
                </tbody>
              </table>
            </div>
            {/* Right: Customer Info */}
            <div>
              <table className="text-gray-800 font-medium w-full">
                <tbody>
                  <tr><td className="pr-3 pb-1 text-gray-500 w-16">Customer:</td><td className="pb-1 font-bold text-blue-900">{receipt.customer}</td></tr>
                  <tr><td className="pr-3 pb-1 text-gray-500 w-16">Type:</td><td className="pb-1 font-medium text-gray-700">{receipt.customerType || "Retail Customer"}</td></tr>
                  <tr><td className="pr-3 pb-1 text-gray-500 align-top">Company:</td><td className="pb-1">{(receipt as any).customerCompany || "--"}</td></tr>
                  <tr><td className="pr-3 text-gray-500">GSTIN:</td><td>{(receipt as any).customerGstin || "--"}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-4 mb-4">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-100 text-blue-900 font-bold border-y-2 border-blue-900">
                  <th className="py-1 px-1 text-center w-8">S.No</th>
                  <th className="py-1 px-2 text-left">Item Name</th>
                  <th className="py-1 px-1 text-center w-10">Qty</th>
                  <th className="py-1 px-1 text-right w-12">Rate</th>
                  {showGstBreakdown && <th className="py-1 px-1 text-center w-12">GST%</th>}
                  <th className="py-1 px-1 text-right w-16">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, i) => (
                  <tr key={i} className="text-gray-800">
                    <td className="py-1 px-1 text-center">{i + 1}</td>
                    <td className="py-1 px-2 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="py-1 px-1 text-center font-semibold">{item.qty}</td>
                    <td className="py-1 px-1 text-right">{item.rate.toFixed(2)}</td>
                    {showGstBreakdown && <td className="py-1 px-1 text-center text-gray-500">{item.gst ?? 0}%</td>}
                    <td className="py-1 px-1 text-right font-bold">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Amount in Words */}
          <div className="px-4 flex gap-4">
            <div className="w-[55%]">
              <div className="border border-gray-200 rounded p-2 bg-gray-50 mb-3">
                <p className="text-blue-900 font-bold text-[9px] mb-1">Amount in Words :</p>
                <p className="font-bold text-[10px] text-gray-800 leading-tight">{amountInWords(receipt.total)}</p>
              </div>
            </div>

            <div className="w-[45%]">
              <table className="w-full text-[10px] font-medium text-gray-800">
                <tbody>
                  <tr><td className="py-1">Subtotal</td><td className="text-right">₹ {subtotal.toFixed(2)}</td></tr>
                  {discAmt > 0 && <tr><td className="py-1 text-green-700">Discount</td><td className="text-right text-green-700">- ₹ {discAmt.toFixed(2)}</td></tr>}
                  {showGstBreakdown && <tr><td className="py-1 text-gray-500">Taxable Amount</td><td className="text-right text-gray-500">₹ {taxable.toFixed(2)}</td></tr>}
                  {!showGstBreakdown && discAmt === 0 && null}
                  {showGstBreakdown && Object.entries(gstSummary).flatMap(([rateStr, data]) => {
                    const rate = Number(rateStr);
                    const halfRate = rate / 2;
                    const halfTax = data.tax / 2;
                    return [
                      <tr key={`cgst-${rate}`}><td className="py-1 text-gray-500">CGST @ {halfRate}%</td><td className="text-right text-gray-500">₹ {halfTax.toFixed(2)}</td></tr>,
                      <tr key={`sgst-${rate}`}><td className="py-1 text-gray-500">SGST @ {halfRate}%</td><td className="text-right text-gray-500">₹ {halfTax.toFixed(2)}</td></tr>
                    ];
                  })}
                  {showGstBreakdown && totalGstAmount > 0 && (
                    <tr><td className="py-1 font-semibold text-blue-800">Total GST</td><td className="text-right font-semibold text-blue-800">₹ {totalGstAmount.toFixed(2)}</td></tr>
                  )}
                </tbody>
              </table>
              <div className="border-t-2 border-blue-900 pt-2 flex justify-between text-sm text-blue-900 font-black">
                <span>GRAND TOTAL</span>
                <span>₹ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="px-4 mt-8 flex justify-end items-end border-b border-gray-200 pb-6 mb-2">
            <div className="w-56 text-center">
              <p className="font-bold text-blue-900 text-[10px] mb-6 tracking-wide">For {receipt.billingCompany || settings?.shopName || "Sri Vishnu Priya Stationary"}</p>
              <div className="flex justify-center mb-1 h-8">
                {settings?.signature ? <img src={settings.signature} className="h-full mix-blend-multiply" /> : <div className="text-blue-900 opacity-30 text-lg" style={{ fontFamily: "cursive" }}>Sign</div>}
              </div>
              <div className="border-t border-dashed border-gray-400 w-full mb-1"></div>
              <p className="font-bold text-gray-800 text-[9px]">Authorized Signature</p>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="text-center pb-4">
            <p className="text-[12px] font-bold text-blue-900 uppercase tracking-widest">Thank You For Your Purchase</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Visit Again</p>
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
  purchases: boolean; customers: boolean; history: boolean; reports: boolean;
};

interface ReceiptSettings {
  showGst: boolean;
  printLogo: boolean;
  showThankYou: boolean;
  printBarcode: boolean;
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
  dashboard: { title: "Dashboard", subtitle: "23 May 2026, Friday · Vishnu Priya Stationary" },
  pos: { title: "POS Billing", subtitle: "Fast billing terminal" },
  products: { title: "Product Management", subtitle: "Manage your catalog" },
  inventory: { title: "Inventory", subtitle: "Track stock levels" },
  purchases: { title: "Purchase Management", subtitle: "Supplier orders & stock intake" },
  customers: { title: "Khata Management", subtitle: "Manage your Khata accounts" },
  reports: { title: "Reports & Analytics", subtitle: "Business performance insights" },
  history: { title: "Bill History", subtitle: "Review and reprint past sales" },
  settings: { title: "Settings", subtitle: "Configure your store" },
  receipt: { title: "Receipt Preview", subtitle: "INV-1043 · 23 May 2026" },
};

// ─── Bill History ─────────────────────────────────────────────────────────────
function BillHistoryScreen({ sales, onViewReceipt, onDeleteBill }: { sales: any[]; onViewReceipt: (sale: any) => void; onDeleteBill: (id: number) => void; }) {
  const [search, setSearch] = useState("");
  const filtered = sales.filter(s => String(s.id).includes(search) || (s.customer && s.customer.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><History className="w-6 h-6 text-blue-600" /> Bill History</h2>
          <p className="text-gray-500 text-sm">Browse, search, and reprint all your past transactions.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Bill ID or Customer..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <th className="py-4 px-6 text-center w-24">Bill ID</th>
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6">Customer</th>
              <th className="py-4 px-6">Items</th>
              <th className="py-4 px-6 text-center">Payment</th>
              <th className="py-4 px-6 text-right">Total</th>
              <th className="py-4 px-6 text-center w-32">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 italic">No sales records found.</td></tr>
            ) : filtered.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6 text-center font-mono font-bold text-gray-700">#{sale.id}</td>
                <td className="py-4 px-6 text-gray-600">{new Date(sale.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="py-4 px-6 font-medium text-gray-800">{sale.customer}</td>
                <td className="py-4 px-6 text-gray-600">{sale.items?.length || 0} items</td>
                <td className="py-4 px-6 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' : sale.paymentMethod === 'UPI' ? 'bg-blue-100 text-blue-700' : sale.paymentMethod === 'Khata' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{sale.paymentMethod || 'Unknown'}</span></td>
                <td className="py-4 px-6 text-right font-bold text-gray-900 font-mono">₹{sale.total?.toFixed(2)}</td>
                <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                  <button onClick={() => onViewReceipt(sale)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 flex-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-medium text-xs">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => {
                    const pwd = prompt("Enter master password to delete this bill:");
                    if (pwd === "7703") {
                      onDeleteBill(sale.id);
                    } else if (pwd !== null) {
                      alert("Incorrect password!");
                    }
                  }} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-medium text-xs" title="Delete Bill">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // ── Shared dataset state ──
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [saleStatus, setSaleStatus] = useState("No sale recorded yet");

  const refreshDataset = async () => {
    try {
      const [prodRes, custRes, purRes, sumRes, userRes, salesRes, setRes] = await Promise.all([
        fetch("/api/products"), fetch("/api/customers"), fetch("/api/purchases"), fetch("/api/summary"), fetch("/api/users"), fetch("/api/sales"), fetch("/api/settings")
      ]);
      if (prodRes.ok) { const d = await prodRes.json(); if (Array.isArray(d.products)) setProductRows(d.products.map((product: any) => ({ ...product, gst: product.gst ?? 18 }))); }
      if (custRes.ok) { const d = await custRes.json(); if (Array.isArray(d.customers)) setCustomers(d.customers); }
      if (purRes.ok) { const d = await purRes.json(); if (Array.isArray(d.purchases)) setPurchases(d.purchases); }
      if (sumRes.ok) { const d = await sumRes.json(); setSummary(d); }
      if (userRes.ok) { const d = await userRes.json(); if (Array.isArray(d.users)) setUsers(d.users); }
      if (salesRes.ok) { const d = await salesRes.json(); if (Array.isArray(d.sales)) setSalesHistory(d.sales.reverse()); }
      if (setRes.ok) { const d = await setRes.json(); setSettings(d.settings); }
    } catch (e) { console.warn("Failed to refresh dataset", e); }
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
    const now = new Date();
    setReceiptData({
      ...payload,
      invoice: "PREVIEW",
      date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setScreen("receipt");
  };

  const completeSale = async (payload: Omit<ReceiptData, "invoice" | "date" | "time">) => {
    const now = new Date();
    const receipt: ReceiptData = {
      ...payload,
      paidAmount: payload.paidAmount ?? payload.total,
      change: (payload.paidAmount ?? payload.total) - payload.total,
      invoice: `INV-${now.getTime()}`,
      date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setReceiptData(receipt);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: receipt.items, total: receipt.total, customer: receipt.customer }),
      });

      if (!response.ok) {
        throw new Error("Failed to save sale");
      }

      const data = await response.json();
      setSaleStatus(`Sale recorded: #${data.sale?.id ?? "unknown"}`);

      // Update local product stocks based on successful sale
      refreshDataset();
    } catch (error) {
      console.warn("Sale submission failed", error);
      setSaleStatus("Sale saved locally; backend unavailable");
    }

    return receipt;
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const [prodRes, custRes, purRes, sumRes, userRes] = await Promise.all([
          fetch("/api/products", { signal: controller.signal }),
          fetch("/api/customers", { signal: controller.signal }),
          fetch("/api/purchases", { signal: controller.signal }),
          fetch("/api/summary", { signal: controller.signal }),
          fetch("/api/users", { signal: controller.signal }),
        ]);

        if (!prodRes.ok || !custRes.ok || !purRes.ok || !sumRes.ok || !userRes.ok) {
          throw new Error("Failed to load backend dataset");
        }

        const [prodData, custData, purData, sumData, userData] = await Promise.all([
          prodRes.json(), custRes.json(), purRes.json(), sumRes.json(), userRes.json()
        ]);

        if (Array.isArray(prodData.products)) {
          setProductRows(prodData.products.map((product: any) => ({ ...product, gst: product.gst ?? 18 })));
        }

        if (Array.isArray(custData.customers)) {
          setCustomers(custData.customers);
        }

        if (Array.isArray(purData.purchases)) {
          setPurchases(purData.purchases);
        }

        if (sumData) {
          setSummary(sumData);
        }

        if (Array.isArray(userData.users)) {
          setUsers(userData.users);
        }
      } catch (error) {
        console.warn("Could not load backend dataset:", error);
        setProductRows(products.map(p => ({ ...p, gst: 18 })));
        setCustomers(customers);
        setPurchases(purchases);
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
          setScreen(u.role === "Staff" ? "products" : (u.role === "Cashier" ? "pos" : "dashboard"));
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
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} subtitle={subtitle} userName={userName} portalMode={portalMode} />
        {screen === "dashboard" && <Dashboard setScreen={setScreen} summary={summary} sales={salesHistory} />}
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
            onCompleteSale={async (payload) => {
              const receipt = await completeSale(payload);
              setScreen("receipt");
              return receipt;
            }}
            onPreviewReceipt={previewReceipt}
          />
        )}
        {screen === "products" && (
          <ProductsScreen productRows={productRows} onSaveProduct={saveProductToServer} onDeleteProduct={deleteProduct} />
        )}
        {screen === "inventory" && <InventoryScreen productRows={productRows} sales={salesHistory} />}
        {screen === "purchases" && <PurchasesScreen purchases={purchases} onAddPurchase={addPurchaseToServer} />}
        {screen === "customers" && <CustomersScreen customers={customers} onAddCustomer={addCustomerToServer} onRecordPayment={recordPaymentToServer} refreshDataset={refreshDataset} />}
        {screen === "history" && <BillHistoryScreen sales={salesHistory} onDeleteBill={async (id) => {
          try {
            const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
            if (res.ok) {
              refreshDataset();
            } else {
              alert("Failed to delete bill.");
            }
          } catch (e) {
            alert("Error deleting bill.");
          }
        }} onViewReceipt={(sale) => {
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
            date: new Date(sale.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            time: new Date(sale.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
            billType: sale.billType || "Tax Invoice"
          });
          setSaleStatus("Reprinting Old Bill");
          setScreen("receipt");
        }} />}
        {screen === "reports" && <ReportsScreen summary={summary} sales={salesHistory} />}
        {screen === "settings" && portalMode === "admin" && (
          <SettingsScreen settings={settings} setSettings={setSettings} onResetDb={resetDatabase} />
        )}
        {screen === "receipt" && <ReceiptScreen receiptData={receiptData} saleStatus={saleStatus} settings={settings} />}
      </div>
    </div>
  );
}
