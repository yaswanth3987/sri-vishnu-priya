import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://yjrbkjezerenfqneyyvz.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcmJramV6ZXJlbmZxbmV5eXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyOTQxNjQsImV4cCI6MjEwMjg3MDE2NH0.PS_V5UV05d8cohTlpGKGpBQR3HknugB7OGiknuT3TFA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let syncStatus = {
  connected: false,
  lastSyncAt: null,
  syncError: null,
  mode: "active",
  recordCounts: {
    products: 0,
    customers: 0,
    sales: 0,
    purchases: 0,
  }
};

/**
 * Maps POS product to Supabase product row
 */
function toSupabaseProduct(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.category || "Stationery",
    stock: Number(p.stock) || 0,
    price: Number(p.price) || 0,
    cost: Number(p.cost) || 0,
    gst: Number(p.gst) ?? 18,
    supplier: p.supplier || "",
    status: p.status || (p.stock === 0 ? "out" : p.stock < 10 ? "low" : "active"),
  };
}

/**
 * Maps POS customer to Supabase customer row
 */
function toSupabaseCustomer(c) {
  return {
    id: c.id,
    name: c.name,
    type: c.type || "Retail",
    phone: String(c.phone || ""),
    email: c.email || "",
    total: Number(c.total) || 0,
    visits: Number(c.visits) || 0,
    last_visit: c.lastVisit || c.last_visit || new Date().toLocaleDateString("en-GB"),
    due_amount: Number(c.dueAmount ?? c.due_amount) || 0,
    credit_limit: Number(c.creditLimit ?? c.credit_limit) || 0,
    khata: Array.isArray(c.khata) ? c.khata : [],
  };
}

/**
 * Maps POS sale to Supabase sale row
 */
function toSupabaseSale(s) {
  return {
    id: s.id,
    customer: s.customer || "Retail Customer",
    customer_type: s.customerType || s.customer_type || "Retail Customer",
    items: Array.isArray(s.items) ? s.items : [],
    total: Number(s.total) || 0,
    subtotal: Number(s.subtotal) || 0,
    discount: Number(s.discount) || 0,
    gst_total: Number(s.tax ?? s.gst_total) || 0,
    payment_method: s.paymentMethod || s.payment_method || "Cash",
    created_at: s.createdAt || s.created_at || new Date().toISOString(),
  };
}

/**
 * Maps POS purchase to Supabase purchase row
 */
function toSupabasePurchase(p) {
  return {
    id: typeof p.id === "number" ? p.id : (parseInt(String(p.id).replace(/\D/g, ""), 10) || Date.now()),
    supplier: p.supplier || "Supplier",
    invoice_no: p.invoice_no || p.invoiceNo || String(p.id),
    date: p.date || new Date().toLocaleDateString("en-GB"),
    total: Number(p.total ?? p.amount) || 0,
    paid: Number(p.paid ?? p.amount) || 0,
    status: p.status || "received",
    items: typeof p.items === "number" ? p.items : (Array.isArray(p.items) ? p.items.length : 1),
  };
}

/**
 * Pulls all tables from Supabase into memory
 */
export async function pullFullDbFromSupabase() {
  try {
    const [prodRes, custRes, salesRes, purRes] = await Promise.all([
      supabase.from("products").select("*").order("id", { ascending: true }),
      supabase.from("customers").select("*").order("id", { ascending: true }),
      supabase.from("sales").select("*").order("id", { ascending: true }),
      supabase.from("purchases").select("*").order("id", { ascending: true }),
    ]);

    const products = (prodRes.data || []).map(p => ({
      ...p,
      stock: Number(p.stock) || 0,
      price: Number(p.price) || 0,
      cost: Number(p.cost) || 0,
      gst: p.gst !== undefined && p.gst !== null ? Number(p.gst) : 18,
      status: p.status || (p.stock === 0 ? "out" : p.stock < 10 ? "low" : "active"),
    }));

    const customers = (custRes.data || []).map(c => ({
      id: c.id,
      name: c.name,
      type: c.type || "Retail",
      phone: c.phone || "",
      email: c.email || "",
      total: Number(c.total) || 0,
      visits: Number(c.visits) || 0,
      lastVisit: c.last_visit || c.lastVisit || "",
      dueAmount: Number(c.due_amount ?? c.dueAmount) || 0,
      creditLimit: Number(c.credit_limit ?? c.creditLimit) || 0,
      khata: Array.isArray(c.khata) ? c.khata : [],
    }));

    const sales = (salesRes.data || []).map(s => ({
      id: s.id,
      billNumber: s.id,
      billDate: s.created_at ? s.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      createdAt: s.created_at || new Date().toISOString(),
      customer: s.customer || "Walk-in",
      customerType: s.customer_type || "Retail Customer",
      items: Array.isArray(s.items) ? s.items : [],
      total: Number(s.total) || 0,
      subtotal: Number(s.subtotal) || 0,
      tax: Number(s.gst_total ?? s.tax) || 0,
      paymentMethod: s.payment_method || "Cash",
      billType: "Tax Invoice",
      status: "active",
    }));

    const purchases = (purRes.data || []).map(p => ({
      id: String(p.id),
      supplier: p.supplier || "",
      date: p.date || "",
      items: typeof p.items === "number" ? p.items : 1,
      amount: Number(p.total ?? p.amount) || 0,
      status: p.status || "Received",
      billFile: "",
    }));

    syncStatus.connected = true;
    syncStatus.lastSyncAt = new Date().toISOString();
    syncStatus.syncError = null;
    syncStatus.recordCounts = {
      products: products.length,
      customers: customers.length,
      sales: sales.length,
      purchases: purchases.length,
    };

    console.log(`[Supabase Loaded] ${products.length} Products, ${customers.length} Customers, ${sales.length} Sales, ${purchases.length} Purchases`);

    return {
      products,
      customers,
      sales,
      purchases,
    };
  } catch (err) {
    syncStatus.connected = false;
    syncStatus.syncError = err.message;
    console.error("[Supabase Pull Error]:", err.message);
    return null;
  }
}

/**
 * Pushes the entire local dataset (or new records) directly to Supabase tables
 */
export async function pushFullDbToSupabase(db, appSettings) {
  try {
    const productsPayload = (db.products || []).map(toSupabaseProduct);
    const customersPayload = (db.customers || []).map(toSupabaseCustomer);
    const salesPayload = (db.sales || []).map(toSupabaseSale);
    const purchasesPayload = (db.purchases || []).map(toSupabasePurchase);

    // Upsert in parallel across all 4 tables
    const results = await Promise.allSettled([
      productsPayload.length > 0 ? supabase.from("products").upsert(productsPayload, { onConflict: "id" }) : Promise.resolve(),
      customersPayload.length > 0 ? supabase.from("customers").upsert(customersPayload, { onConflict: "id" }) : Promise.resolve(),
      salesPayload.length > 0 ? supabase.from("sales").upsert(salesPayload, { onConflict: "id" }) : Promise.resolve(),
      purchasesPayload.length > 0 ? supabase.from("purchases").upsert(purchasesPayload, { onConflict: "id" }) : Promise.resolve(),
    ]);

    const errors = results.filter(r => r.status === "rejected" || r.value?.error);
    const firstErr = errors[0]?.reason?.message || errors[0]?.value?.error?.message;

    syncStatus.connected = !firstErr;
    syncStatus.lastSyncAt = new Date().toISOString();
    syncStatus.syncError = firstErr || null;
    syncStatus.recordCounts = {
      products: productsPayload.length,
      customers: customersPayload.length,
      sales: salesPayload.length,
      purchases: purchasesPayload.length,
    };

    return { success: !firstErr, lastSyncAt: syncStatus.lastSyncAt, error: firstErr };
  } catch (err) {
    syncStatus.connected = false;
    syncStatus.syncError = err.message;
    console.error("[Supabase Push Error]:", err.message);
    return { success: false, error: err.message };
  }
}

export function getSupabaseSyncStatus() {
  return {
    ...syncStatus,
    supabaseUrl: SUPABASE_URL,
  };
}
