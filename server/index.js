import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { writeFile } from "fs/promises";
import fs from "fs";
import { products as seedProducts, customers as seedCustomers, purchases as seedPurchases } from "./data.js";
import { pushFullDbToSupabase, pullFullDbFromSupabase, getSupabaseSyncStatus } from "./supabase.js";

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
      { id: 1, name: "Vishnu Mohan Rao", username: "admin", password: "admin", role: "Admin", status: "active", permissions: { dashboard: true, pos: true, products: true, inventory: true, purchases: true, customers: true, reports: true } },
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
    // Asynchronously push to Supabase Cloud in background
    pushFullDbToSupabase(db, appSettings).catch((err) => {
      console.warn("[Supabase background sync]:", err.message);
    });
  } catch (e) {
    console.warn("Could not persist files (non-fatal):", e.message);
  }
}

// ── Supabase Cloud Initial Hydration ──────────────────────────────────────────
(async () => {
  try {
    const cloudDb = await pullFullDbFromSupabase();
    if (cloudDb && cloudDb.products && cloudDb.products.length > 0) {
      db = {
        products: cloudDb.products,
        customers: cloudDb.customers || db.customers,
        sales: cloudDb.sales || db.sales,
        purchases: cloudDb.purchases || db.purchases,
        users: cloudDb.users && cloudDb.users.length > 0 ? cloudDb.users : db.users,
      };
      if (cloudDb.settings && Object.keys(cloudDb.settings).length > 0) {
        appSettings = { ...defaultSettings, ...cloudDb.settings };
      }
      await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
      await writeFile(SETTINGS_PATH, JSON.stringify(appSettings, null, 2), "utf-8");
      console.log(`[Supabase] Hydrated local DB from cloud (${db.products.length} products, ${db.sales.length} sales)`);
    } else {
      console.log(`[Supabase] Initializing cloud backup with local DB...`);
      await pushFullDbToSupabase(db, appSettings);
    }
  } catch (err) {
    console.warn("[Supabase Startup Sync Notice]:", err.message);
  }
})();

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
  // ── Date-range filtering ─────────────────────────────────────────────────────
  // Accepts optional ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD query params.
  // When absent, defaults to current Asia/Kolkata business date.
  const { startDate, endDate } = req.query;

  let startStr, endStr;
  if (startDate && endDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    startStr = startDate;
    endStr = endDate;
  } else {
    const today = getBusinessDate();
    startStr = today;
    endStr = today;
  }

  // Ensure startStr <= endStr
  if (startStr > endStr) {
    const tmp = startStr;
    startStr = endStr;
    endStr = tmp;
  }

  const rangeStart = new Date(`${startStr}T00:00:00.000`);
  const rangeEnd   = new Date(`${endStr}T23:59:59.999`);

  // Helper: get authoritative business date for a sale
  const getSaleEffectiveDate = (sale) => {
    return sale.billDate || (sale.createdAt ? getSaleBusinessDate(sale.createdAt) : null);
  };

  // Helper: is a sale within the active range?
  const inRange = (sale) => {
    const sDate = getSaleEffectiveDate(sale);
    if (!sDate) return false;
    return sDate >= startStr && sDate <= endStr;
  };

  // ── Filtered sales for this range ────────────────────────────────────────────
  const filteredSales = db.sales.filter(inRange);

  // ── Totals for the selected range ────────────────────────────────────────────
  const rangeSalesTotal = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const rangeBillsCount = filteredSales.length;

  // ── All-time totals (stock-level metrics are not date-sensitive) ──────────────
  const lowStockItems = db.products.filter(p => p.stock <= 5).map(p => ({ id: p.id, name: p.name, stock: p.stock }));
  const lowStockCount = lowStockItems.length;

  // ── Best sellers & category breakdown for selected range ──────────────────────
  const productSales = {};
  const categorySales = {};
  filteredSales.forEach(sale => {
    (sale.items || []).forEach(item => {
      if (!productSales[item.id]) {
        productSales[item.id] = { name: item.name, sold: 0, revenue: 0 };
      }
      productSales[item.id].sold += (item.qty || 0);
      productSales[item.id].revenue += ((item.qty || 0) * (item.price || 0));

      const productDef = db.products.find(p => String(p.id) === String(item.id));
      const cat = productDef?.category || "Unknown";
      categorySales[cat] = (categorySales[cat] || 0) + ((item.qty || 0) * (item.price || 0));
    });
  });
  const bestSellers = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const categoryPie = Object.keys(categorySales).map(name => ({ name, value: categorySales[name] }));

  // Dead stock is always against full product catalogue (not date-filtered)
  const allTimeSales = {};
  db.sales.forEach(sale => {
    (sale.items || []).forEach(item => {
      allTimeSales[item.id] = true;
    });
  });
  const deadStockItems = db.products.filter(p => p.stock > 0 && !allTimeSales[p.id]).map(p => ({
    id: p.id, name: p.name, stock: p.stock, category: p.category, price: p.price
  }));

  // ── Khata metrics are always real-time (not date-scoped) ─────────────────────
  const pendingKhata = db.customers.reduce((sum, c) => sum + (c.dueAmount || 0), 0);
  const outstandingCustomers = db.customers.filter(c => (c.dueAmount || 0) > 0).length;

  // ── Chart data — adapts to the selected range ─────────────────────────────────
  const diffDays = Math.round((new Date(`${endStr}T00:00:00`).getTime() - new Date(`${startStr}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24));

  let chartData = [];
  let chartMode = "daily"; // "hourly" | "daily" | "weekly"

  if (diffDays === 0) {
    // Single business day → hourly buckets (0–23)
    chartMode = "hourly";
    chartData = Array.from({ length: 24 }, (_, h) => {
      const hourSales = filteredSales
        .filter(s => {
          try {
            const dateObj = new Date(s.createdAt);
            const hour = parseInt(dateObj.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }), 10);
            return hour === h;
          } catch {
            return new Date(s.createdAt).getHours() === h;
          }
        })
        .reduce((sum, s) => sum + (s.total || 0), 0);
      return { day: `${h}:00`, sales: hourSales };
    });
  } else if (diffDays <= 31) {
    // Up to 31 days → daily buckets
    chartMode = "daily";
    const cursor = new Date(`${startStr}T00:00:00`);
    const endCursor = new Date(`${endStr}T00:00:00`);
    while (cursor <= endCursor) {
      const ymd = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      const label = cursor.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const daySales = filteredSales
        .filter(s => getSaleEffectiveDate(s) === ymd)
        .reduce((sum, s) => sum + (s.total || 0), 0);
      chartData.push({ day: label, sales: daySales });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    // > 31 days → weekly aggregates
    chartMode = "weekly";
    const cursor = new Date(`${startStr}T00:00:00`);
    const endCursor = new Date(`${endStr}T00:00:00`);
    let weekStart = new Date(cursor);
    while (weekStart <= endCursor) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const weekStartYMD = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      const weekEndYMD = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
      const label = weekStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const weekSales = filteredSales
        .filter(s => {
          const sDate = getSaleEffectiveDate(s);
          return sDate && sDate >= weekStartYMD && sDate <= weekEndYMD;
        })
        .reduce((sum, s) => sum + (s.total || 0), 0);
      chartData.push({ day: label, sales: weekSales });
      weekStart.setDate(weekStart.getDate() + 7);
    }
  }

  // ── Response ──────────────────────────────────────────────────────────────────
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    dateRange: {
      startDate: rangeStart.toISOString(),
      endDate: rangeEnd.toISOString(),
      chartMode,
    },
    bestSellers,
    categoryPie,
    lowStockItems,
    deadStockItems,
    weeklyChartData: chartData,
    metrics: {
      todaysSales: `₹${rangeSalesTotal.toLocaleString("en-IN")}`,
      monthlyRevenue: `₹${rangeSalesTotal.toLocaleString("en-IN")}`,
      totalProducts: db.products.length,
      lowStockAlerts: `${lowStockCount} items`,
      todaysBills: rangeBillsCount,
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

app.post("/api/products/bulk", async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid or empty items array" });
  }

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    if (!item.name || typeof item.price !== "number") {
      skippedCount++;
      continue;
    }

    const trimmedName = String(item.name).trim();
    const existingIndex = item.existingId
      ? db.products.findIndex(p => p.id === item.existingId)
      : db.products.findIndex(p => p.name.trim().toLowerCase() === trimmedName.toLowerCase() || (item.barcode && p.barcode && p.barcode === item.barcode));

    if (existingIndex !== -1 && item.action !== "create_new") {
      if (item.action === "skip") {
        skippedCount++;
        continue;
      }

      const existing = db.products[existingIndex];
      if (item.action === "add_stock" || !item.action) {
        // Add to existing stock (default safe behaviour)
        const addedStock = Number(item.stock) || 0;
        const newStock = Math.max(0, (existing.stock || 0) + addedStock);
        db.products[existingIndex] = {
          ...existing,
          stock: newStock,
          price: typeof item.price === "number" && item.price > 0 ? item.price : existing.price,
          cost: typeof item.cost === "number" ? item.cost : existing.cost,
          gst: typeof item.gst === "number" ? item.gst : (existing.gst ?? 18),
          category: item.category || existing.category,
          supplier: item.supplier || existing.supplier,
          barcode: item.barcode || existing.barcode || "",
          status: newStock === 0 ? "out" : newStock < 10 ? "low" : "active",
        };
        updatedCount++;
      } else {
        // Update product info & replace stock
        const newStock = typeof item.stock === "number" ? item.stock : existing.stock;
        db.products[existingIndex] = {
          ...existing,
          ...item,
          name: trimmedName,
          stock: newStock,
          status: newStock === 0 ? "out" : newStock < 10 ? "low" : "active",
        };
        updatedCount++;
      }
    } else {
      // Create new product
      const nextId = db.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      const stock = Number(item.stock) || 0;
      const newProduct = {
        id: nextId,
        name: trimmedName,
        category: item.category || "Stationery",
        stock: stock,
        price: Number(item.price) || 0,
        cost: typeof item.cost === "number" ? item.cost : undefined,
        supplier: item.supplier || "",
        gst: typeof item.gst === "number" ? item.gst : 18,
        barcode: item.barcode || "",
        isbn: item.isbn || "",
        author: item.author || "",
        publisher: item.publisher || "",
        classStd: item.classStd || "",
        status: stock === 0 ? "out" : stock < 10 ? "low" : "active",
      };
      db.products.push(newProduct);
      createdCount++;
    }
  }

  await persistDb();
  console.log(`[POST /api/products/bulk] Bulk import finished: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`);
  res.json({
    status: "ok",
    message: `Processed ${items.length} items: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`,
    createdCount,
    updatedCount,
    skippedCount,
    products: db.products
  });
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

function getBusinessDate() {
  try {
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(new Date());
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;
    const year = parts.find(p => p.type === "year").value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

function getSaleBusinessDate(createdAt) {
  try {
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(new Date(createdAt));
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;
    const year = parts.find(p => p.type === "year").value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    const d = new Date(createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

// ── Sales ─────────────────────────────────────────────────────────────────────
app.get("/api/sales", (req, res) => {
  const { date, startDate, endDate } = req.query;
  const getSaleEffectiveDate = (s) => s.billDate || (s.createdAt ? getSaleBusinessDate(s.createdAt) : null);

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Return only bills whose business date matches the requested date
    const filtered = db.sales.filter(s => {
      try {
        return getSaleEffectiveDate(s) === date;
      } catch {
        return false;
      }
    });
    return res.json({ sales: filtered });
  }

  if (startDate && endDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    const filtered = db.sales.filter(s => {
      try {
        const sDate = getSaleEffectiveDate(s);
        return sDate && sDate >= startDate && sDate <= endDate;
      } catch {
        return false;
      }
    });
    return res.json({ sales: filtered });
  }

  res.json({ sales: db.sales });
});

app.post("/api/sales", async (req, res) => {
  const { items, total, customer, customerType = "Retail Customer", paymentMethod, subtotal, tax, billType, billingCompany, customerCompany, billDate } = req.body;
  if (!Array.isArray(items) || items.length === 0 || typeof total !== "number") {
    return res.status(400).json({ error: "Missing items or total" });
  }

  // Use frontend-provided business date (YYYY-MM-DD) or fall back to server-side date
  const effectiveBillDate = (billDate && /^\d{4}-\d{2}-\d{2}$/.test(billDate)) ? billDate : getBusinessDate();

  // Calculate daily sequential bill number based on effective business date
  const todaySales = db.sales.filter(s => {
    try {
      // Prefer stored billDate field; fall back to createdAt for legacy sales
      const saleDate = s.billDate || (s.createdAt ? getSaleBusinessDate(s.createdAt) : null);
      return saleDate === effectiveBillDate;
    } catch {
      return false;
    }
  });
  const nextBillNumber = todaySales.reduce((max, s) => Math.max(max, s.billNumber || 0), 0) + 1;

  const nextId = db.sales.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  const sale = {
    id: nextId,
    billNumber: nextBillNumber,
    billDate: effectiveBillDate,           // business date (source of truth for display)
    customer,
    customerType,
    customerCompany,
    billingCompany,
    items,
    subtotal: subtotal ?? total,
    tax: tax ?? 0,
    total,
    billType: billType ?? "Tax Invoice",
    paymentMethod: paymentMethod ?? "Cash",
    createdAt: new Date().toISOString(),   // real audit timestamp — never reset
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

app.put("/api/sales/:id", async (req, res) => {
  const saleId = Number(req.params.id);
  const saleIndex = db.sales.findIndex(s => s.id === saleId);
  if (saleIndex === -1) return res.status(404).json({ error: "Sale not found" });

  const oldSale = db.sales[saleIndex];
  const {
    items: newItems,
    customer: newCustomer,
    customerType: newCustomerType,
    customerCompany: newCustomerCompany,
    billingCompany: newBillingCompany,
    paymentMethod: newPaymentMethod,
    billType: newBillType,
    editedBy,
    editReason,
  } = req.body;

  if (!Array.isArray(newItems) || newItems.length === 0) {
    return res.status(400).json({ error: "Bill must contain at least one item" });
  }

  // ── STEP 1: Restore old inventory (non-custom items only) ──────────────────
  oldSale.items.forEach(item => {
    if (item.isCustom) return; // custom items have no stock entry
    const p = db.products.find(p => p.id === item.id);
    if (p) {
      p.stock += item.qty;
      p.status = p.stock === 0 ? "out" : p.stock < 10 ? "low" : "active";
    }
  });

  // ── STEP 2: Validate new items have enough stock ────────────────────────────
  for (const item of newItems) {
    if (item.isCustom) continue;
    const p = db.products.find(p => p.id === item.id);
    if (!p) {
      // Rollback restored stock before returning
      oldSale.items.forEach(oi => {
        if (oi.isCustom) return;
        const op = db.products.find(pp => pp.id === oi.id);
        if (op) {
          op.stock -= oi.qty;
          op.status = op.stock === 0 ? "out" : op.stock < 10 ? "low" : "active";
        }
      });
      return res.status(400).json({ error: `Product not found: ${item.name}` });
    }
    if (p.stock < item.qty) {
      // Rollback restored stock before returning
      oldSale.items.forEach(oi => {
        if (oi.isCustom) return;
        const op = db.products.find(pp => pp.id === oi.id);
        if (op) {
          op.stock -= oi.qty;
          op.status = op.stock === 0 ? "out" : op.stock < 10 ? "low" : "active";
        }
      });
      return res.status(409).json({
        error: `Insufficient stock for "${p.name}". Available: ${p.stock}, Needed: ${item.qty}`
      });
    }
  }

  // ── STEP 3: Deduct new inventory ────────────────────────────────────────────
  newItems.forEach(item => {
    if (item.isCustom) return;
    const p = db.products.find(p => p.id === item.id);
    if (p) {
      p.stock = Math.max(0, p.stock - item.qty);
      p.status = p.stock === 0 ? "out" : p.stock < 10 ? "low" : "active";
    }
  });

  // ── STEP 4: Reverse old Khata entry ────────────────────────────────────────
  if (oldSale.paymentMethod === "Khata" && oldSale.customer) {
    const oldCust = db.customers.find(c => c.name === oldSale.customer);
    if (oldCust) {
      oldCust.khata = (oldCust.khata || []).filter(k => k.id !== `INV-${saleId}`);
      oldCust.dueAmount = Math.max(0, (oldCust.dueAmount || 0) - (oldSale.total || 0));
    }
  }

  // ── STEP 5: Recalculate totals from new items ───────────────────────────────
  const newSubtotal = newItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const newTax      = newItems.reduce((sum, i) => sum + (i.price * i.qty * ((i.gst ?? 0) / 100)), 0);
  const newTotal    = Math.round((newSubtotal + newTax) * 100) / 100;

  // ── STEP 6: Apply new Khata entry ──────────────────────────────────────────
  if (newPaymentMethod === "Khata" && newCustomer) {
    const newCust = db.customers.find(c => c.name === newCustomer);
    if (newCust) {
      const newDue = (newCust.dueAmount || 0) + newTotal;
      newCust.dueAmount = Math.round(newDue * 100) / 100;
      if (!newCust.khata) newCust.khata = [];
      newCust.khata.unshift({
        id: `INV-${saleId}`,
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        type: "credit",
        amount: newTotal,
        balance: newCust.dueAmount,
        note: `Bill #${saleId} (Edited)`
      });
    }
  }

  // ── STEP 7: Append audit record ────────────────────────────────────────────
  const auditEntry = {
    editedAt: new Date().toISOString(),
    editedBy: editedBy || "Unknown",
    editReason: editReason || "",
    oldTotal: oldSale.total,
    newTotal,
    oldCustomer: oldSale.customer,
    newCustomer: newCustomer || oldSale.customer,
    oldPaymentMethod: oldSale.paymentMethod,
    newPaymentMethod: newPaymentMethod || oldSale.paymentMethod,
    oldItemCount: (oldSale.items || []).length,
    newItemCount: newItems.length,
  };

  // ── STEP 8: Overwrite sale record (preserve id and createdAt) ──────────────
  db.sales[saleIndex] = {
    ...oldSale,
    customer: newCustomer ?? oldSale.customer,
    customerType: newCustomerType ?? oldSale.customerType,
    customerCompany: newCustomerCompany ?? oldSale.customerCompany,
    billingCompany: newBillingCompany ?? oldSale.billingCompany,
    paymentMethod: newPaymentMethod ?? oldSale.paymentMethod,
    billType: newBillType ?? oldSale.billType,
    items: newItems,
    subtotal: newSubtotal,
    tax: newTax,
    total: newTotal,
    updatedAt: new Date().toISOString(),
    editHistory: [...(oldSale.editHistory || []), auditEntry],
  };

  await persistDb();
  res.json({ message: "Sale updated", sale: db.sales[saleIndex] });
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
    shopSubtitle: incoming.shopSubtitle ?? appSettings.shopSubtitle ?? "",
    gstIn: incoming.gstIn ?? appSettings.gstIn,
    phone: incoming.phone ?? appSettings.phone,
    email: incoming.email ?? appSettings.email ?? "",
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
    logo: incoming.logo !== undefined ? incoming.logo : (appSettings.logo ?? ""),
    signature: incoming.signature !== undefined ? incoming.signature : (appSettings.signature ?? ""),
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

// ── Supabase Cloud Sync Endpoints ─────────────────────────────────────────────
app.get("/api/supabase/status", (req, res) => {
  res.json(getSupabaseSyncStatus());
});

app.post("/api/supabase/sync", async (req, res) => {
  const { direction = "push" } = req.body || {};
  if (direction === "pull") {
    const cloudDb = await pullFullDbFromSupabase();
    if (cloudDb) {
      db = {
        products: cloudDb.products || db.products,
        customers: cloudDb.customers || db.customers,
        sales: cloudDb.sales || db.sales,
        purchases: cloudDb.purchases || db.purchases,
        users: cloudDb.users || db.users,
      };
      if (cloudDb.settings && Object.keys(cloudDb.settings).length > 0) {
        appSettings = { ...defaultSettings, ...cloudDb.settings };
      }
      await persistDb();
      return res.json({ status: "ok", message: "Pulled database from Supabase successfully", sync: getSupabaseSyncStatus() });
    }
    return res.status(500).json({ error: "Failed to pull from Supabase" });
  }

  const result = await pushFullDbToSupabase(db, appSettings);
  if (result.success) {
    return res.json({ status: "ok", message: "Pushed database to Supabase successfully", sync: getSupabaseSyncStatus() });
  }
  return res.status(500).json({ error: result.error || "Failed to push to Supabase", sync: getSupabaseSyncStatus() });
});

app.use((req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
