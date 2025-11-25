// server.js
import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";
import PgSession from "connect-pg-simple";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ENV
const {
  PORT = 5000,
  DATABASE_URL,
  SESSION_SECRET,
  COOKIE_NAME = "yr.sid",
} = process.env;

if (!DATABASE_URL) {
  console.error("Please set DATABASE_URL in .env");
  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error("Please set SESSION_SECRET in environment variables");
  process.exit(1);
}

// DB pool
const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL });

// App
const app = express();
app.use(express.json());

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Session store
const ConnectPgSimple = PgSession(session);
app.use(
  session({
    store: new ConnectPgSimple({ pool }),
    name: COOKIE_NAME,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// ----------------------------
// Static files
// ----------------------------
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------
// DEFAULT → index.html
// ----------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ----------------------------
// AUTH ROUTES
// ----------------------------
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, pass, phone, address } = req.body;
    if (!email || !pass) return res.status(400).json({ error: "Missing email or password" });

    const lower = email.toLowerCase().trim();
    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [lower]);
    if (exists.rowCount > 0) return res.status(409).json({ error: "Email already exists" });

    const pass_hash = await bcrypt.hash(pass, 10);
    const uid = "UID-" + Math.random().toString(36).slice(2, 9);

    const r = await pool.query(
      `INSERT INTO users (uid, email, pass_hash, name, phone, address, created_at, last_login_at)
       VALUES ($1,$2,$3,$4,$5,$6, now(), now()) RETURNING id, email, name`,
      [uid, lower, pass_hash, name || null, phone || null, address || null]
    );

    req.session.userId = r.rows[0].id;
    req.session.email = r.rows[0].email;
    req.session.cart = [];

    res.status(201).json({ ok: true, user: r.rows[0] });
  } catch (err) {
    console.error("REGISTER ERR", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, pass } = req.body;
    if (!email || !pass) return res.status(400).json({ error: "Missing email or password" });

    const lower = email.toLowerCase().trim();
    const r = await pool.query("SELECT id, pass_hash, name FROM users WHERE email=$1", [lower]);

    if (r.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(pass, r.rows[0].pass_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = r.rows[0].id;
    req.session.email = lower;
    req.session.cart = req.session.cart || [];

    await pool.query("UPDATE users SET last_login_at = now() WHERE id=$1", [r.rows[0].id]);

    res.json({ ok: true, user: { email: lower, name: r.rows[0].name || null } });
  } catch (err) {
    console.error("LOGIN ERR", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie(COOKIE_NAME);
    res.json({ ok: true });
  });
});

app.get("/api/me", async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });

  const r = await pool.query(
    "SELECT id, email, name, phone, address, is_admin FROM users WHERE id=$1",
    [req.session.userId]
  );

  if (r.rowCount === 0) return res.json({ user: null });

  res.json({ user: r.rows[0] });
});

// ----------------------------
// ORDERS
// ----------------------------
app.get("/api/orders", async (req, res) => {
  try {
    if (!req.session.userId) return res.json({ orders: [] });

    const r = await pool.query(
      "SELECT id, order_id, items, total, payment_method, status, placed_at FROM orders WHERE user_id=$1 ORDER BY placed_at DESC",
      [req.session.userId]
    );

    const orders = r.rows.map(order => ({
      id: order.id,
      order_id: order.order_id,
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.placed_at
    }));

    res.json({ orders });
  } catch (err) {
    console.error("ORDERS ERR", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------
// PRODUCTS
// ----------------------------
app.get("/api/products", async (req, res) => {
  try {
    const { q = "", page = 1, pageSize = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    let query = "SELECT id, name, price, img, description FROM products";
    let countQuery = "SELECT COUNT(*) as total FROM products";
    let params = [];
    
    if (q.trim()) {
      query += " WHERE name ILIKE $1 OR description ILIKE $1";
      countQuery += " WHERE name ILIKE $1 OR description ILIKE $1";
      params.push(`%${q}%`);
    }
    
    query += " ORDER BY id LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
    params.push(pageSize, offset);
    
    const data = await pool.query(query, params);
    const countParams = q.trim() ? [`%${q}%`] : [];
    const countData = await pool.query(countQuery, countParams);
    
    res.json({ 
      products: data.rows,
      total: parseInt(countData.rows[0].total),
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error("PRODUCTS ERR", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------
// CART (Session-based)
// ----------------------------
app.get("/api/cart", (req, res) => {
  res.json({ cart: req.session.cart || [] });
});

app.post("/api/cart/add", (req, res) => {
  const { id, qty = 1 } = req.body;
  req.session.cart = req.session.cart || [];
  const existing = req.session.cart.find((x) => x.id === id);

  if (existing) existing.qty += qty;
  else req.session.cart.push({ id, qty });

  res.json({ ok: true, cart: req.session.cart });
});

// ----------------------------
// CHECKOUT
// ----------------------------
app.post("/api/checkout", async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0)
      return res.status(400).json({ error: "Cart is empty" });

    const { name, phone, address, paymentMethod = "cod" } = req.body;
    if (!name || !phone || !address)
      return res.status(400).json({ error: "Missing delivery details" });

    const ids = cart.map((c) => c.id);
    const prodRes = await pool.query(
      "SELECT * FROM products WHERE id = ANY($1::int[])",
      [ids]
    );

    const prodMap = {};
    prodRes.rows.forEach((p) => (prodMap[p.id] = p));

    const items = cart.map((it) => ({
      id: it.id,
      name: prodMap[it.id].name,
      price: prodMap[it.id].price,
      qty: it.qty,
      subtotal: prodMap[it.id].price * it.qty,
    }));

    const total = items.reduce((s, i) => s + i.subtotal, 0);

    const orderId = "ORD-" + Date.now();

    await pool.query(
      `INSERT INTO orders (order_id, user_id, items, total, payment_method, delivery_name, delivery_phone, delivery_address, status, placed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'placed',now())`,
      [
        orderId,
        req.session.userId || null,
        JSON.stringify(items),
        total,
        paymentMethod,
        name,
        phone,
        address,
      ]
    );

    req.session.cart = [];
    res.json({ ok: true, orderId });
  } catch (err) {
    console.error("CHECKOUT ERR", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------
// ADMIN APIs
// ----------------------------
app.get("/api/admin/users", async (req, res) => {
  try {
    const data = await pool.query(
      "SELECT id, email, name, phone, address, is_admin, created_at, last_login_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users: data.rows });
  } catch (err) {
    console.error("ADMIN USERS ERR", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    const data = await pool.query(
      `SELECT o.id, o.order_id, o.user_id, o.items, o.total, o.status, o.placed_at, u.email, u.name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.placed_at DESC`
    );
    res.json({ orders: data.rows });
  } catch (err) {
    console.error("ADMIN ORDERS ERR", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------
// START SERVER
// ----------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
