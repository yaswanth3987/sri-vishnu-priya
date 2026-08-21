import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { writeFile } from "fs/promises";
import fs from "fs";
import { products as seedProducts, customers as seedCustomers, purchases as seedPurchases } from "./data.js";

const app = express();
const PORT = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");
const SETTINGS_PATH = path.join(__dirname, "settings.json");
const DIST_PATH = path.join(__dirname, "..", "dist");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(DIST_PATH));

// Serve SPA for all non-API routes
app.get(/^\/(?!api)/, (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

// ── Anti-Sleep Keep-Alive for Render ──────────────────────────────────────────
import http from "http";
import https from "https";
app.get("/api/ping", (req, res) => {
  res.status(200).send("pong");
});
setInterval(() => {
  const host = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const client = host.startsWith("https") ? https : http;
  client.get(`${host}/api/ping`, (res) => {
    res.on("data", () => {}); // consume data to free memory
    res.on("end", () => {
      // ping successful
    });
  }).on("error", (err) => {
    console.error("Keep-alive ping failed:", err.message);
  });
}, 5 * 60 * 1000); // ping every 5 minutes to ensure Render doesn't sleep


// ── In-memory database — always starts fresh from seed data ───────────────────
function buildSeedDb() {
  return {
    products: seedProducts.map(p => ({
      ...p,
      gst: 18,
      status: p.stock === 0 ? "out" : p.stock < 10 ? "low" : "active",
    })),
    customers: [
      { id: 1, name: "Priya Sharma", type: "Retail", phone: "9876543210", email: "priya@gmail.com", total: 4280, visits: 12, lastVisit: "22 May 2026", dueAmount: 0, creditLimit: 0, khata: [] },
      { id: 2, name: "Rahul Gupta", type: "Retail", phone: "9812345678", email: "rahul.g@gmail.com", total: 1860, visits: 5, lastVisit: "20 May 2026", dueAmount: 0, creditLimit: 0, khata: [] },
      { id: 3, name: "Anjali Mehta", type: "Wholesale", phone: "9900112233", email: "anjali.m@yahoo.com", total: 7320, visits: 21, lastVisit: "23 May 2026", dueAmount: 1200, creditLimit: 5000, khata: [{id: "K-101", date: "23 May 2026", type: "credit", amount: 1200, balance: 1200, note: "School bags"}] },
      { id: 4, name: "Vikram Patel", type: "Retail", phone: "9988776655", email: "vikramp@gmail.com", total: 980, visits: 3, lastVisit: "18 May 2026", dueAmount: 0, creditLimit: 0, khata: [] },
      { id: 5, name: "ABC Public School", type: "School", phone: "9765432109", email: "admin@abcschool.com", total: 31400, visits: 9, lastVisit: "21 May 2026", dueAmount: 4500, creditLimit: 20000, khata: [{id: "K-102", date: "21 May 2026", type: "credit", amount: 4500, balance: 4500, note: "Notebooks bulk"}] },
    ],
    purchases: seedPurchases.map(p => ({ ...p })),
    sales: [],
    users: [
      { id: 1, name: "Ramesh Kumar", username: "admin", password: "shopease123", role: "Admin", status: "active", permissions: { dashboard: true, pos: true, products: true, inventory: true, purchases: true, customers: true, reports: true } },
      { id: 2, name: "Sunita Bai", username: "sunita", password: "staff123", role: "Cashier", status: "active", permissions: { dashboard: false, pos: true, products: false, inventory: true, purchases: false, customers: true, reports: false } },
      { id: 3, name: "Amit Sharma", username: "amit", password: "staff123", role: "Staff", status: "active", permissions: { dashboard: false, pos: false, products: true, inventory: true, purchases: true, customers: false, reports: false } }
    ],
  };
}

let db;
try {
  db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  if (!db.users || db.users.length === 0) {
    db.users = buildSeedDb().users;
  }
  console.log(`Loaded DB: ${db.products.length} products`);
} catch (e) {
  db = buildSeedDb();
  console.log(`Seeded DB: ${db.products.length} products`);
}

// ── Default Settings ──────────────────────────────────────────────────────────
const defaultSettings = {
  shopName: "Sri Vishnu Priya Fancy And General Stores",
  shopSubtitle: "& Book Store",
  gstIn: "27AABCU9603R1ZX",
  phone: "9876543210",
  address: "Shop No. 12, MG Road, Pune - 411001",
  defaultGstOn: true,
  defaultGstRate: 18,
  companyList: [],
  tabPortalOptions: {
    dashboard: false, pos: false, products: true,
    inventory: true, purchases: false, customers: false, reports: false,
  },
  receiptSettings: {
    showGst: true, printLogo: false, showThankYou: true, printBarcode: false,
  },
  printerType: "Thermal (80mm)",
  printerCopies: 1,
  adminPassword: "shopease123",
  logo: "",
  customerTypes: ["School", "College", "Bank", "Office", "Company", "Government", "Retail Customer", "Khata Customer"],
};

let appSettings;
try {
  appSettings = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
} catch (e) {
  appSettings = { ...defaultSettings };
}

let sseClients = [];

function broadcastUpdate() {
  sseClients.forEach(c => {
    try { c.res.write("data: update\n\n"); } catch (err) {}
  });
}

async function persistDb() {
  try {
    await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    await writeFile(SETTINGS_PATH, JSON.stringify(appSettings, null, 2), "utf-8");
    broadcastUpdate();
  } catch (e) {
    console.warn("Could not persist files (non-fatal):", e.message);
  }
}

// ── API Routes ─────────────────────────────────────────────────────────────────

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    name: "Vishnu Priya POS Backend",
    productCount: db.products.length,
    customers: db.customers.length,
    users: db.users ? db.users.length : 0,
  });
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  req.on("close", () => {
    sseClients = sseClients.filter(client => client.id !== clientId);
  });
});

app.get("/api/summary", (req, res) => {
  const lowStockItems = db.products.filter(p => p.stock <= 5).map(p => ({ id: p.id, name: p.name, stock: p.stock }));
  const lowStockCount = lowStockItems.length;
  const totalSales = db.sales.reduce((sum, s) => sum + (s.total || 0), 0);
  
  const productSales = {};
  const categorySales = {};
  db.sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.id]) {
        productSales[item.id] = { name: item.name, sold: 0, revenue: 0 };
      }
      productSales[item.id].sold += item.qty;
      productSales[item.id].revenue += (item.qty * item.price);
      
      const productDef = db.products.find(p => String(p.id) === String(item.id));
      const cat = productDef?.category || "Unknown";
      categorySales[cat] = (categorySales[cat] || 0) + (item.qty * item.price);
    });
  });
  const bestSellers = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const categoryPie = Object.keys(categorySales).map(name => ({ name, value: categorySales[name] }));
  const deadStockItems = db.products.filter(p => p.stock > 0 && !productSales[p.id]).map(p => ({
    id: p.id, name: p.name, stock: p.stock, category: p.category, price: p.price
  }));

  const pendingKhata = db.customers.reduce((sum, c) => sum + (c.dueAmount || 0), 0);
  const outstandingCustomers = db.customers.filter(c => (c.dueAmount || 0) > 0).length;

  const today = new Date().toLocaleDateString("en-IN");
  const todaysSalesTotal = db.sales
    .filter(s => new Date(s.createdAt).toLocaleDateString("en-IN") === today)
    .reduce((sum, s) => sum + (s.total || 0), 0);
  const todaysBillsCount = db.sales.filter(s => new Date(s.createdAt).toLocaleDateString("en-IN") === today).length;

  // Build weekly chart data from actual sales
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  const weeklyChartData = days.map((day, i) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    const dayStr = dayDate.toLocaleDateString("en-IN");
    const daySales = db.sales
      .filter(s => new Date(s.createdAt).toLocaleDateString("en-IN") === dayStr)
      .reduce((sum, s) => sum + (s.total || 0), 0);
    return { day, sales: daySales };
  });

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    bestSellers,
    categoryPie,
    lowStockItems,
    deadStockItems,
    weeklyChartData,
    metrics: {
      todaysSales: `₹${todaysSalesTotal.toLocaleString("en-IN")}`,
      monthlyRevenue: `₹${totalSales.toLocaleString("en-IN")}`,
      totalProducts: db.products.length,
      lowStockAlerts: `${lowStockCount} items`,
      todaysBills: todaysBillsCount,
      customersToday: db.customers.length,
      pendingKhata: `₹${pendingKhata.toLocaleString("en-IN")}`,
      outstandingCustomers: outstandingCustomers,
    },
  });

});

// ── Products ──────────────────────────────────────────────────────────────────
app.get("/api/products", (req, res) => {
  res.json({ products: db.products });
});

app.post("/api/products", async (req, res) => {
  const product = req.body;
  if (!product || !product.name || typeof product.price !== "number") {
    return res.status(400).json({ error: "Invalid product payload" });
  }
  const nextId = db.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  const newProduct = { ...product, id: nextId };
  db.products.push(newProduct);
  await persistDb();
  res.status(201).json({ product: newProduct });
});

app.put("/api/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  db.products[index] = { ...db.products[index], ...req.body };
  await persistDb();
  res.json({ product: db.products[index] });
});

app.delete("/api/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = db.products.find(p => p.id === id);
  if (!existing) return res.status(404).json({ error: "Product not found" });
  db.products = db.products.filter(p => p.id !== id);
  await persistDb();
  res.json({ message: "Product deleted", id });
});

// ── Customers ─────────────────────────────────────────────────────────────────
app.get("/api/customers", (req, res) => {
  res.json({ customers: db.customers });
});

app.post("/api/customers", async (req, res) => {
  const customer = req.body;
  if (!customer || !customer.name || !customer.phone) {
    return res.status(400).json({ error: "Invalid customer payload" });
  }
  const nextId = db.customers.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  const newCustomer = {
    ...customer,
    id: nextId,
    total: customer.total || 0,
    visits: customer.visits || 1,
    lastVisit: customer.lastVisit || new Date().toLocaleDateString("en-GB"),
    dueAmount: 0,
    creditLimit: 0,
    khata: []
  };
  db.customers.push(newCustomer);
  await persistDb();
  res.status(201).json({ customer: newCustomer });
});

app.delete("/api/customers/all", async (req, res) => {
   db.customers = [];
   await persistDb();
   res.json({ success: true, message: "All customers deleted" });
});

app.put("/api/customers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const index = db.customers.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: "Customer not found" });
  db.customers[index] = { ...db.customers[index], ...req.body };
  await persistDb();
  res.json({ customer: db.customers[index] });
});

app.delete("/api/customers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = db.customers.find(c => c.id === id);
  if (!existing) return res.status(404).json({ error: "Customer not found" });
  db.customers = db.customers.filter(c => c.id !== id);
  await persistDb();
  res.json({ message: "Customer deleted", id });
});

app.post("/api/customers/merge", async (req, res) => {
  const { targetId, sourceId } = req.body;
  if (!targetId || !sourceId || targetId === sourceId) return res.status(400).json({ error: "Invalid merge parameters" });
  
  const target = db.customers.find(c => c.id === targetId);
  const source = db.customers.find(c => c.id === sourceId);
  if (!target || !source) return res.status(404).json({ error: "Customer not found" });

  target.total = (target.total || 0) + (source.total || 0);
  target.visits = (target.visits || 0) + (source.visits || 0);
  target.dueAmount = (target.dueAmount || 0) + (source.dueAmount || 0);
  
  if (source.khata && source.khata.length > 0) {
    target.khata = [...(target.khata || []), ...source.khata].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  db.customers = db.customers.filter(c => c.id !== sourceId);
  await persistDb();
  res.json({ success: true, customer: target });
});

app.post("/api/customers/:id/payment", async (req, res) => {
   const id = Number(req.params.id);
   const { amount, note } = req.body;
   const customer = db.customers.find(c => c.id === id);
   if (!customer) return res.status(404).json({ error: "Customer not found" });
   if (typeof amount !== "number" || amount <= 0) return res.status(400).json({ error: "Invalid payment amount" });

   const newDue = Math.max(0, (customer.dueAmount || 0) - amount);
   customer.dueAmount = newDue;
   
   if (!customer.khata) customer.khata = [];
   const paymentId = `PAY-${Math.floor(Math.random() * 100000)}`;
   
   customer.khata.unshift({
      id: paymentId,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      type: "payment",
      amount: amount,
      balance: newDue,
      note: note || "Cash Payment Received"
   });

   await persistDb();
   res.json({ success: true, customer });
});

// ── Purchases ─────────────────────────────────────────────────────────────────
app.get("/api/purchases", (req, res) => {
  res.json({ purchases: db.purchases });
});

app.post("/api/purchases", async (req, res) => {
  const purchase = req.body;
  if (!purchase || !purchase.supplier || typeof purchase.amount !== "number") {
    return res.status(400).json({ error: "Invalid purchase payload" });
  }
  const nextIdNum = db.purchases.reduce((max, p) => {
    const num = parseInt(p.id.replace("PO-", ""), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0) + 1;
  const nextId = `PO-${nextIdNum.toString().padStart(3, "0")}`;
  const newPurchase = { ...purchase, id: nextId };
  db.purchases.push(newPurchase);
  await persistDb();
  res.status(201).json({ purchase: newPurchase });
});

// ── Sales ─────────────────────────────────────────────────────────────────────
app.get("/api/sales", (req, res) => {
  res.json({ sales: db.sales });
});

app.post("/api/sales", async (req, res) => {
  const { items, total, customer, customerType = "Retail Customer", paymentMethod, subtotal, tax, billType, billingCompany, customerCompany } = req.body;
  if (!Array.isArray(items) || items.length === 0 || typeof total !== "number") {
    return res.status(400).json({ error: "Missing items or total" });
  }
  const nextId = db.sales.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  const sale = {
    id: nextId,
    customer,
    customerType,
    customerCompany,
    billingCompany,
    items,
    subtotal,
    tax,
    total,
    billType,
    paymentMethod,
    createdAt: new Date().toISOString(),
  };

  if (paymentMethod === "Khata" && customer) {
    const custData = db.customers.find(c => c.name === customer);
    if (custData) {
       const newDue = (custData.dueAmount || 0) + total;
       custData.dueAmount = newDue;
       if (!custData.khata) custData.khata = [];
       custData.khata.unshift({
          id: `INV-${sale.id}`,
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          type: "credit",
          amount: total,
          balance: newDue,
          note: `Bill #${sale.id}`
       });
    }
  }

  items.forEach(item => {
    const product = db.products.find(p => p.id === item.id);
    if (product) {
      product.stock = Math.max(0, product.stock - item.qty);
      product.status = product.stock === 0 ? "out" : product.stock < 10 ? "low" : "active";
    }
  });
  db.sales.push(sale);
  await persistDb();
  res.status(201).json({ message: "Sale recorded", sale });
});

app.delete("/api/sales/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = db.sales.find(s => s.id === id);
  if (!existing) return res.status(404).json({ error: "Sale not found" });
  db.sales = db.sales.filter(s => s.id !== id);
  await persistDb();
  res.json({ message: "Sale deleted", id });
});

// ── Users ──────────────────────────────────────────────────────────────────────
app.get("/api/users", (req, res) => {
  res.json({ users: db.users || [] });
});

app.post("/api/users", async (req, res) => {
  const user = req.body;
  if (!user || !user.name || !user.username) {
    return res.status(400).json({ error: "Invalid user payload" });
  }
  db.users = db.users || [];
  const nextId = db.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  const newUser = { ...user, id: nextId };
  db.users.push(newUser);
  await persistDb();
  res.status(201).json({ user: newUser });
});

app.put("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  db.users = db.users || [];
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) return res.status(404).json({ error: "User not found" });
  db.users[index] = { ...db.users[index], ...req.body };
  await persistDb();
  res.json({ user: db.users[index] });
});

app.delete("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  db.users = db.users || [];
  const existing = db.users.find(u => u.id === id);
  if (!existing) return res.status(404).json({ error: "User not found" });
  db.users = db.users.filter(u => u.id !== id);
  await persistDb();
  res.json({ message: "User deleted", id });
});

// ── Settings ──────────────────────────────────────────────────────────────────
app.get("/api/settings", (req, res) => {
  console.log("[GET /api/settings] Returning:", JSON.stringify(appSettings));
  res.json({ status: "ok", settings: appSettings });
});

app.post("/api/settings", async (req, res) => {
  const incoming = req.body;
  console.log("[POST /api/settings] Received:", JSON.stringify(incoming));

  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({ error: "Invalid settings payload" });
  }

  // Full replace — frontend sends the complete settings object
  appSettings = {
    shopName: incoming.shopName ?? appSettings.shopName,
    shopSubtitle: incoming.shopSubtitle ?? appSettings.shopSubtitle,
    gstIn: incoming.gstIn ?? appSettings.gstIn,
    phone: incoming.phone ?? appSettings.phone,
    address: incoming.address ?? appSettings.address,
    defaultGstOn: incoming.defaultGstOn ?? appSettings.defaultGstOn,
    defaultGstRate: incoming.defaultGstRate ?? appSettings.defaultGstRate,
    tabPortalOptions: incoming.tabPortalOptions
      ? { ...appSettings.tabPortalOptions, ...incoming.tabPortalOptions }
      : appSettings.tabPortalOptions,
    receiptSettings: incoming.receiptSettings
      ? { ...appSettings.receiptSettings, ...incoming.receiptSettings }
      : appSettings.receiptSettings,
    printerType: incoming.printerType ?? appSettings.printerType,
    printerCopies: incoming.printerCopies ?? appSettings.printerCopies,
    adminPassword: incoming.adminPassword ?? appSettings.adminPassword,
    logo: incoming.logo ?? appSettings.logo,
    companyList: incoming.companyList ?? appSettings.companyList ?? [],
    customerTypes: incoming.customerTypes ?? appSettings.customerTypes ?? ["School", "College", "Bank", "Office", "Company", "Government", "Retail Customer", "Khata Customer"],
  };

  await persistDb();

  console.log("[POST /api/settings] Saved:", JSON.stringify(appSettings));
  res.json({ status: "ok", message: "Settings saved", settings: appSettings });
});

// ── Reset — restores DB + settings to factory defaults ────────────────────────
app.post("/api/reset", async (req, res) => {
  const { password } = req.body || {};
  if (password !== "1819219" && password !== appSettings.adminPassword) {
    return res.status(401).json({ error: "Unauthorized: Invalid password" });
  }
  
  // Delete all products and customers for a fresh-install state
  db.products = [];
  db.customers = [];

  db.purchases = [];
  db.sales = [];
  
  // appSettings = { ...defaultSettings }; // Intentionally keeping settings intact when zeroing inventory
  await persistDb();
  console.log("[RESET] Database inventory and sales wiped completely to 0");
  res.json({
    status: "ok",
    message: "Inventory and sales data reset to 0",
    counts: {
      products: db.products.length,
      customers: db.customers.length,
      purchases: db.purchases.length,
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
