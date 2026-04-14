import { useEffect, useMemo, useState } from "react";
import {
  productsSeed,
  categories,
  salesLast14Days,
  hourlySalesToday,
  deliveriesSeed,
  ordersSeed,
  maintenanceSeed,
  cleaningChecklist,
  staffSeed,
  adminFinance,
} from "./data/seed.js";
import {
  LineSalesChart,
  BarHourlyChart,
  CategoryBarChart,
  TrendBadge,
} from "./components/SalesCharts.jsx";
import { InfoModal } from "./components/InfoModal.jsx";

const STORE_NAME = "GreenCart POS";

const NAV = [
  { id: "login", label: "Login" },
  { id: "dashboard", label: "Dashboard" },
  { id: "pos", label: "POS Terminal" },
  { id: "products", label: "Products" },
  { id: "analytics", label: "Analytics" },
  { id: "delivery", label: "Delivery" },
  { id: "orders", label: "Orders" },
  { id: "maintenance", label: "Maintenance" },
  { id: "staff", label: "Staff" },
  { id: "admin", label: "Admin $$$" },
  { id: "inventory", label: "Inventory" },
  { id: "reports", label: "Reports" },
  { id: "users", label: "Users" },
  { id: "planning", label: "Planning & UX" },
];
const CASHIER_ALLOWED_PAGES = ["pos", "delivery"];

const HEADER_LINKS = [
  { id: "test", label: "Test" },
  { id: "help", label: "Help" },
  { id: "inline", label: "Inline" },
  { id: "about", label: "About" },
  { id: "helpline", label: "Helpline" },
];

const EMPLOYEES_SEED = [
  {
    id: "ADM-0001",
    name: "Admin",
    role: "admin",
    title: "Administrator",
    station: "Office / Admin",
    pin: "1124",
    photoUrl: "",
  },
  {
    id: "EMP-1001",
    name: "Employee 1",
    role: "cashier",
    title: "Cashier",
    station: "Register 1",
    pin: "1001",
    photoUrl: "",
  },
  {
    id: "EMP-1002",
    name: "Employee 2",
    role: "cashier",
    title: "Cashier",
    station: "Register 2",
    pin: "1002",
    photoUrl: "",
  },
  {
    id: "EMP-1003",
    name: "Employee 3",
    role: "cashier",
    title: "Cashier",
    station: "Register 3",
    pin: "1003",
    photoUrl: "",
  },
  {
    id: "EMP-1004",
    name: "Employee 4",
    role: "cashier",
    title: "Cashier",
    station: "Register 4",
    pin: "1004",
    photoUrl: "",
  },
  {
    id: "EMP-1005",
    name: "Employee 5",
    role: "cashier",
    title: "Cashier",
    station: "Register 5",
    pin: "1005",
    photoUrl: "",
  },
  {
    id: "EMP-1006",
    name: "Employee 6",
    role: "cashier",
    title: "Cashier",
    station: "Register 6",
    pin: "1006",
    photoUrl: "",
  },
  {
    id: "EMP-1007",
    name: "Employee 7",
    role: "cashier",
    title: "Cashier",
    station: "Register 7",
    pin: "1007",
    photoUrl: "",
  },
];

const RECHARGE_CATALOG = [
  { id: "boss-revolution", name: "Boss Revolution (International Calling)" },
  { id: "international-topup", name: "International Mobile Top-Up" },
  { id: "gift-card", name: "Gift Card / Store Credit" },
  { id: "prepaid-card", name: "Prepaid / Reload Card" },
];

/** One icon per login tile — animals & plants (no people icons) */
const EMPLOYEE_EMOJIS = ["🌳", "🦊", "🌻", "🐢", "🦋", "🌵", "🦉", "🍀"];

const categoryMix = [
  { name: "Beverages", value: 4200 },
  { name: "Snacks", value: 3100 },
  { name: "Dairy", value: 2800 },
  { name: "Tobacco", value: 5100 },
  { name: "Grocery", value: 3600 },
];

function App() {
  const [activePage, setActivePage] = useState("login");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("cashier");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [voucherCode, setVoucherCode] = useState("");
  const [products, setProducts] = useState(productsSeed);
  const [cart, setCart] = useState([
    { ...productsSeed[1], qty: 2 },
    { ...productsSeed[3], qty: 1 },
  ]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    barcode: "",
    category: "",
    price: "",
    stock: "",
    supplier: "",
  });
  const [posCategory, setPosCategory] = useState("All");
  const [scanInput, setScanInput] = useState("");
  const [keypadBuffer, setKeypadBuffer] = useState("");
  const [modal, setModal] = useState(null);
  const [adminPin, setAdminPin] = useState("");
  const [adminPinError, setAdminPinError] = useState("");
  /** 0 = off; 1–4 = clickable prototype steps on POS */
  const [prototypeStep, setPrototypeStep] = useState(0);
  const [sessionUser, setSessionUser] = useState(null);
  const [loginTarget, setLoginTarget] = useState(null);
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [lastLoginById, setLastLoginById] = useState(() => {
    try {
      const raw = localStorage.getItem("gcpos_lastLoginByEmployeeId");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [couponType, setCouponType] = useState(null); // store | telemarketing | other
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { type, code }
  const [rechargeType, setRechargeType] = useState(RECHARGE_CATALOG[0]?.id ?? "");
  const [rechargeValue, setRechargeValue] = useState("");
  const [rechargeCustomerRef, setRechargeCustomerRef] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setModal(null);
        setAdminPin("");
        setAdminPinError("");
        setLoginTarget(null);
        setLoginPin("");
        setLoginError("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleNav = role === "cashier"
    ? NAV.filter((page) => CASHIER_ALLOWED_PAGES.includes(page.id))
    : NAV;

  const openAdminPinModal = () => {
    setAdminPin("");
    setAdminPinError("");
    setModal("adminPin");
  };

  const unlockAdmin = () => {
    if (adminPin === "1124") {
      setRole("admin");
      setActivePage("dashboard");
      setModal("admin");
      setAdminPin("");
      setAdminPinError("");
      return;
    }
    setAdminPinError("Incorrect PIN. Please enter correct admin PIN.");
  };

  const formatLastLogin = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const startLogin = (emp) => {
    setLoginTarget(emp);
    setLoginPin("");
    setLoginError("");
    setModal("loginPin");
  };

  const finalizeLogin = () => {
    if (!loginTarget) return;
    if ((loginPin || "").trim() !== String(loginTarget.pin)) {
      setLoginError("Incorrect PIN. Please try again.");
      return;
    }

    const nowIso = new Date().toISOString();
    const nextLast = { ...lastLoginById, [loginTarget.id]: nowIso };
    setLastLoginById(nextLast);
    try {
      localStorage.setItem("gcpos_lastLoginByEmployeeId", JSON.stringify(nextLast));
    } catch {
      // ignore
    }

    setSessionUser({
      id: loginTarget.id,
      name: loginTarget.name,
      role: loginTarget.role,
      title: loginTarget.title,
      station: loginTarget.station,
      photoUrl: loginTarget.photoUrl,
      loginAt: nowIso,
    });
    setRole(loginTarget.role);
    setModal(null);
    setLoginTarget(null);
    setLoginPin("");
    setLoginError("");
    setActivePage(loginTarget.role === "admin" ? "dashboard" : "pos");
  };

  const logout = () => {
    setSessionUser(null);
    setRole("cashier");
    setActivePage("login");
    setCart([]);
    setDiscount(0);
    setVoucherCode("");
    setKeypadBuffer("");
    setAppliedCoupon(null);
    setCouponType(null);
    setCouponCode("");
    setPrototypeStep(0);
  };

  const openCouponChooser = () => {
    setCouponType(null);
    setCouponCode("");
    setModal("couponChooser");
  };

  const beginCouponEntry = (type) => {
    setCouponType(type);
    setCouponCode("");
    setModal("couponEnter");
  };

  const applyCoupon = () => {
    if (!couponType) return;
    const code = couponCode.trim();
    if (!code) return;
    setAppliedCoupon({ type: couponType, code });
    setModal(null);
  };

  const openRecharge = () => {
    setRechargeType(RECHARGE_CATALOG[0]?.id ?? "");
    setRechargeValue("");
    setRechargeCustomerRef("");
    setModal("recharge");
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.barcode.includes(query)
    );
  }, [products, query]);

  const posProducts = useMemo(() => {
    let list = products;
    if (posCategory !== "All") {
      list = list.filter((p) => p.category === posCategory);
    }
    if (scanInput.trim()) {
      const q = scanInput.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.includes(scanInput.trim())
      );
    }
    return list;
  }, [products, posCategory, scanInput]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );
  const discountAmount = useMemo(
    () => subtotal * (discount / 100),
    [subtotal, discount]
  );
  const grandTotal = useMemo(
    () => Math.max(0, subtotal - discountAmount),
    [subtotal, discountAmount]
  );

  const lowStockProducts = products.filter((item) => item.stock <= 10);
  const totalTransactions = 142;
  const dailySales = adminFinance.sales1d;
  const weeklySales = adminFinance.sales1w;
  const revenue = adminFinance.sales1m;

  const addToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const resetNewProduct = () => {
    setNewProduct({
      name: "",
      barcode: "",
      category: "",
      price: "",
      stock: "",
      supplier: "",
    });
  };

  const addProduct = () => {
    if (
      !newProduct.name ||
      !newProduct.barcode ||
      !newProduct.category ||
      !newProduct.price ||
      !newProduct.stock ||
      !newProduct.supplier
    ) {
      return;
    }

    const next = {
      id: Date.now(),
      name: newProduct.name,
      barcode: newProduct.barcode,
      category: newProduct.category,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      supplier: newProduct.supplier,
      hotKey: "",
    };
    setProducts((prev) => [next, ...prev]);
    resetNewProduct();
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const completePayment = () => {
    const nextStock = products.map((p) => {
      const soldItem = cart.find((c) => c.id === p.id);
      if (!soldItem) return p;
      return { ...p, stock: Math.max(0, p.stock - soldItem.qty) };
    });
    setProducts(nextStock);
    setCart([]);
    setDiscount(0);
    setVoucherCode("");
    setKeypadBuffer("");
  };

  const keypadPress = (key) => {
    if (key === "C") {
      setKeypadBuffer("");
      return;
    }
    if (key === "⌫") {
      setKeypadBuffer((b) => b.slice(0, -1));
      return;
    }
    setKeypadBuffer((b) => (b + key).slice(0, 12));
  };

  const tryScanBarcode = () => {
    const code = scanInput.trim();
    if (!code) return;
    const hit = products.find((p) => p.barcode === code);
    if (hit) addToCart(hit);
    setScanInput("");
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>{STORE_NAME}</h1>
          <p>Supermarket · C-store style terminal</p>
          {sessionUser ? (
            <div className="header-session-row" aria-label="Session">
              <div className="header-session-left">
                <span className="header-role-label">Signed in</span>
                <span className="header-session-meta">
                  {sessionUser.name} · {sessionUser.title} · {sessionUser.station}
                </span>
              </div>
              <div className="header-session-right">
                <div className="session-chip" title={`${sessionUser.name} (${sessionUser.id})`}>
                  <div className="avatar">
                    {sessionUser.photoUrl ? (
                      <img src={sessionUser.photoUrl} alt={`${sessionUser.name} avatar`} />
                    ) : (
                      <span>{(sessionUser.name || "U").slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="session-chip-text">
                    <strong>{sessionUser.id}</strong>
                    <span className="muted small">
                      Last login: {formatLastLogin(lastLoginById[sessionUser.id])}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`header-role-btn ${sessionUser.role === "admin" ? "on" : ""}`}
                  onClick={() => {
                    if (sessionUser.role === "admin") {
                      setModal("admin");
                    } else {
                      setModal("cashier");
                    }
                  }}
                >
                  {sessionUser.role === "admin" ? "Admin" : "Employee"}
                </button>
                <button type="button" className="header-role-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="header-session-row" aria-label="Not signed in">
              <span className="header-role-label">Status</span>
              <span className="header-session-meta">Please select an employee to start POS.</span>
            </div>
          )}
        </div>
        <nav className="header-nav scroll-nav" aria-label="Main">
          {visibleNav
            .filter((p) => (sessionUser ? p.id !== "login" : p.id === "login"))
            .map((page) => (
            <button
              key={page.id}
              type="button"
              className={`header-btn ${activePage === page.id ? "active" : ""}`}
              onClick={() => setActivePage(page.id)}
            >
              {page.label}
            </button>
          ))}
        </nav>
        <div className="header-links">
          {HEADER_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="header-link-btn"
              onClick={() => setModal(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="main">
        {activePage === "login" && (
          <section className="login-screen">
            <div className="login-hero">
              <h2 className="store-title">{STORE_NAME}</h2>
              <p className="muted">
                When POS is turned on, select an employee below to sign in quickly.
              </p>
            </div>

            <div className="login-grid" aria-label="Employee login tiles">
              {EMPLOYEES_SEED.map((emp, idx) => (
                <button
                  key={emp.id}
                  type="button"
                  className={`emp-tile ${emp.role === "admin" ? "admin" : ""} ${
                    idx % 3 === 0 ? "size-xl" : idx % 3 === 1 ? "size-lg" : "size-md"
                  }`}
                  onClick={() => startLogin(emp)}
                >
                  <div className="emp-tile-top">
                    <div className="emp-left">
                      <span className="emp-emoji" aria-hidden="true">
                        {EMPLOYEE_EMOJIS[idx % EMPLOYEE_EMOJIS.length]}
                      </span>
                      <strong className="emp-name">{emp.name}</strong>
                    </div>
                    <span className="emp-id">{emp.id}</span>
                  </div>
                  <div className="emp-tile-mid">
                    <span className="pill">{emp.title}</span>
                    <span className="emp-station muted small">{emp.station}</span>
                  </div>
                  <div className="emp-tile-bottom">
                    <span className="muted small">Last login</span>
                    <strong className="emp-last">{formatLastLogin(lastLoginById[emp.id])}</strong>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ——— POS TERMINAL (7-Eleven / QT–style: categories + tiles + cart + keypad) ——— */}
        {activePage === "pos" && sessionUser && (
          <section className="pos-terminal">
            {prototypeStep > 0 && (
              <div className="prototype-banner" role="status">
                <div className="prototype-banner-text">
                  <strong>
                    Clickable prototype — Step {prototypeStep} of 4
                  </strong>
                  <span>
                    {prototypeStep === 1 &&
                      "Scan or search a product, or tap a category / tile to add to cart."}
                    {prototypeStep === 2 &&
                      "Review the cart on the right: adjust quantities or remove lines."}
                    {prototypeStep === 3 &&
                      "Set discount if needed, choose payment (cash / debit / credit / voucher), then pay."}
                    {prototypeStep === 4 &&
                      "Complete payment and print receipt. End of journey — or restart from Planning & UX."}
                  </span>
                </div>
                <div className="prototype-banner-actions">
                  {prototypeStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setPrototypeStep((s) => Math.min(4, s + 1))}
                    >
                      Next step
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPrototypeStep(0);
                        setActivePage("planning");
                      }}
                    >
                      Back to Planning
                    </button>
                  )}
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setPrototypeStep(0)}
                  >
                    Exit prototype
                  </button>
                </div>
              </div>
            )}
            <div className="pos-terminal-grid">
            <aside className="pos-rail">
              <div className="pos-rail-title">Categories</div>
              <div className="pos-cat-list">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`pos-cat-btn ${posCategory === c ? "active" : ""}`}
                    onClick={() => setPosCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="pos-rail-title">Quick keys</div>
              <div className="quick-keys">
                {products.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="qk"
                    onClick={() => addToCart(p)}
                    title={p.name}
                  >
                    <span className="qk-k">{p.hotKey || "—"}</span>
                    <span className="qk-n">{p.name.slice(0, 14)}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="pos-center">
              <div className="pos-toolbar">
                <label className="scan-field">
                  Scan / search barcode or name
                  <div className="scan-row">
                    <input
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && tryScanBarcode()}
                      placeholder="890112233002 or type product…"
                    />
                    <button type="button" onClick={tryScanBarcode}>
                      Add
                    </button>
                  </div>
                </label>
              </div>
              <div className="pos-product-grid">
                {posProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="pos-tile"
                    onClick={() => addToCart(p)}
                  >
                    <span className="pos-tile-name">{p.name}</span>
                    <span className="pos-tile-meta">
                      {p.category} · Stock {p.stock}
                    </span>
                    <span className="pos-tile-price">${p.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            <aside className="pos-ticket">
              <div className="ticket-head">
                <h3>Current sale</h3>
                <span className="reg-badge">Register 1</span>
              </div>
              <div className="pos-top-actions">
                <button type="button" className="ghost-btn" onClick={openCouponChooser}>
                  Coupons
                </button>
                <button type="button" className="ghost-btn" onClick={openRecharge}>
                  Recharge / International
                </button>
              </div>
              {appliedCoupon && (
                <div className="coupon-chip" role="status">
                  <div>
                    <strong>Coupon applied</strong>
                    <div className="muted small">
                      {appliedCoupon.type} · <code>{appliedCoupon.code}</code>
                    </div>
                  </div>
                  <button type="button" className="header-link-btn" onClick={() => setAppliedCoupon(null)}>
                    Remove
                  </button>
                </div>
              )}
              <ul className="list cart-list pos-cart-list">
                {cart.length === 0 ? (
                  <li className="muted">No items — tap a tile or scan.</li>
                ) : (
                  cart.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          ${item.price.toFixed(2)} × {item.qty}
                        </small>
                      </div>
                      <div className="inline-actions">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty - 1)}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty + 1)}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <div className="pos-total-strip">
                <div>
                  <span>Subtotal</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>-${discountAmount.toFixed(2)}</strong>
                </div>
                <div className="grand">
                  <span>Total due</span>
                  <strong>${grandTotal.toFixed(2)}</strong>
                </div>
              </div>
              <label className="pos-inline">
                Discount %
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </label>
              <label className="pos-inline">
                Pay with
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                  <option value="voucher">Voucher / QR</option>
                </select>
              </label>
              {paymentMethod === "voucher" && (
                <label className="pos-inline">
                  Voucher
                  <input
                    placeholder="Scan voucher"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                  />
                </label>
              )}
              <div className="pos-keypad" aria-label="Numeric keypad">
                {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "⌫"].map(
                  (k) => (
                    <button
                      key={k}
                      type="button"
                      className="kp"
                      onClick={() => keypadPress(k)}
                    >
                      {k}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className="kp wide"
                  onClick={() => keypadPress("C")}
                >
                  Clear
                </button>
              </div>
              <p className="keypad-hint muted small">
                Buffer: <code>{keypadBuffer || "—"}</code> (demo for price override / ID)
              </p>
              <div className="pos-pay-row">
                <button type="button" className="btn-pay cash" onClick={completePayment}>
                  Cash / Pay
                </button>
                <button type="button" className="btn-pay card">
                  Card
                </button>
              </div>
              <button type="button" className="btn-receipt full">
                Print receipt
              </button>
            </aside>
            </div>
          </section>
        )}

        {activePage === "dashboard" && (
          <section className="grid two-col">
            <article className="panel">
              <h3>Store pulse</h3>
              <div className="stats">
                <div className="card-stat">
                  <span>Today sales</span>
                  <strong>${dailySales}</strong>
                  <TrendBadge
                    current={adminFinance.sales1d}
                    previous={adminFinance.prevSales1d}
                  />
                </div>
                <div className="card-stat">
                  <span>This week</span>
                  <strong>${weeklySales}</strong>
                  <TrendBadge
                    current={adminFinance.sales1w}
                    previous={adminFinance.prevSales1w}
                  />
                </div>
                <div className="card-stat">
                  <span>This month</span>
                  <strong>${revenue}</strong>
                  <TrendBadge
                    current={adminFinance.sales1m}
                    previous={adminFinance.prevSales1m}
                  />
                </div>
                <div className="card-stat">
                  <span>Transactions</span>
                  <strong>{totalTransactions}</strong>
                </div>
              </div>
            </article>
            <article className="panel">
              <h3>Low stock</h3>
              <ul className="list">
                {lowStockProducts.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <strong>{item.stock} left</strong>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        )}

        {activePage === "analytics" && (
          <section className="grid analytics-grid">
            <LineSalesChart data={salesLast14Days} title="Sales trend (14 days)" />
            <BarHourlyChart data={hourlySalesToday} title="Intraday volume" />
            <CategoryBarChart items={categoryMix} title="Sales by category" />
            <article className="panel span-2">
              <h3>What this view is for</h3>
              <p className="muted">
                <strong>Line chart:</strong> daily revenue with up/down vs previous period.
                <strong> Bars:</strong> rush hours (morning coffee, lunch, evening traffic).
                <strong> Category mix:</strong> like tobacco / beverage-heavy c-store reporting.
              </p>
            </article>
          </section>
        )}

        {activePage === "delivery" && (
          <section className="panel">
            <h3>Delivery operations</h3>
            <p className="muted">
              Route planning, driver assignment, time windows, and customer contact — aligned
              with order queue and receiving.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th>Zone</th>
                    <th>Status</th>
                    <th>Driver</th>
                    <th>ETA</th>
                    <th>Slot</th>
                    <th>Items</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveriesSeed.map((d) => (
                    <tr key={d.id}>
                      <td>{d.id}</td>
                      <td>{d.customer}</td>
                      <td>{d.address}</td>
                      <td>{d.zone}</td>
                      <td>
                        <span
                          className={`pill ${d.status === "Delivered" ? "st-ok" : d.status === "Packing" ? "st-warn" : "st-go"}`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td>{d.driver}</td>
                      <td>{d.eta}</td>
                      <td>{d.slot}</td>
                      <td>{d.items}</td>
                      <td>${d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid two-col sub-panels">
              <div className="sub-panel">
                <h4>Delivery zones</h4>
                <ul className="list">
                  <li>
                    <span>North</span>
                    <strong>3 active</strong>
                  </li>
                  <li>
                    <span>East</span>
                    <strong>2 active</strong>
                  </li>
                  <li>
                    <span>South</span>
                    <strong>1 completed</strong>
                  </li>
                </ul>
              </div>
              <div className="sub-panel">
                <h4>Driver checklist</h4>
                <ul className="checklist">
                  <li>☑ Vehicle inspection</li>
                  <li>☑ Cold chain bags loaded</li>
                  <li>☐ Proof of delivery app updated</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {activePage === "orders" && (
          <section className="panel">
            <h3>Orders (pickup · delivery · in-store)</h3>
            <p className="muted">
              Single queue for app/web orders and POS completions — status for kitchen /
              packing / handoff.
            </p>
            <div className="order-cards">
              {ordersSeed.map((o) => (
                <article key={o.id} className="order-card">
                  <header>
                    <strong>{o.id}</strong>
                    <span
                      className={`pill ${o.status === "Completed" ? "st-ok" : o.status === "Ready" ? "st-go" : "st-warn"}`}
                    >
                      {o.status}
                    </span>
                  </header>
                  <p>
                    <span className="label">Type</span> {o.type} · {o.channel}
                  </p>
                  <p>
                    <span className="label">Customer</span> {o.customer}
                  </p>
                  <p>
                    <span className="label">Placed</span> {o.placed}
                  </p>
                  <p>
                    <span className="label">Items</span> {o.items} ·{" "}
                    <strong>${o.total}</strong>
                  </p>
                  <div className="order-actions">
                    <button type="button">Mark ready</button>
                    <button type="button">Notify</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activePage === "maintenance" && (
          <section className="grid two-col">
            <article className="panel">
              <h3>Store maintenance & equipment</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>WO</th>
                      <th>Area</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceSeed.map((m) => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.area}</td>
                        <td>{m.type}</td>
                        <td>{m.priority}</td>
                        <td>{m.status}</td>
                        <td>{m.due}</td>
                        <td>{m.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <h3>Daily cleaning & compliance</h3>
              <ul className="checklist big">
                {cleaningChecklist.map((c, i) => (
                  <li key={i}>
                    {c.done ? "☑" : "☐"} <strong>{c.task}</strong> — {c.owner}
                  </li>
                ))}
              </ul>
              <p className="muted small">
                Tie tasks to <strong>Staff</strong> shifts; managers sign off in Admin.
              </p>
            </article>
          </section>
        )}

        {activePage === "staff" && (
          <section className="panel">
            <h3>Staff roster & aligned work</h3>
            <p className="muted">
              Each role maps to stations: front register, back receiving, delivery staging,
              admin. Tasks roll up to daily ops.
            </p>
            <div className="sub-panel employee-tools">
              <div className="panel-title">
                <h4>Employee tools</h4>
                <div className="actions">
                  <button type="button" onClick={openRecharge}>
                    Recharge / International cards
                  </button>
                  <button type="button" onClick={openCouponChooser}>
                    Coupons
                  </button>
                </div>
              </div>
              <p className="muted small">
                Add recharge interactions (example: Boss Revolution cards, international top-up) and coupons
                to support fast checkout.
              </p>
            </div>
            <div className="staff-grid">
              {staffSeed.map((s) => (
                <article key={s.id} className="staff-card">
                  <header>
                    <strong>{s.name}</strong>
                    <span className="pill">{s.role}</span>
                  </header>
                  <p>
                    <span className="label">Shift</span> {s.shift}
                  </p>
                  <p>
                    <span className="label">Station</span> {s.station}
                  </p>
                  <p>
                    <span className="label">Phone</span> {s.phone}
                  </p>
                  <h4>Today&apos;s tasks</h4>
                  <ul>
                    {s.tasks.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {activePage === "admin" && (
          <section className="admin-hub">
            <article className="panel">
              <h3>Sales periods (management)</h3>
              <div className="stats admin-stats">
                <div className="card-stat big">
                  <span>1 day</span>
                  <strong>${adminFinance.sales1d}</strong>
                  <TrendBadge
                    current={adminFinance.sales1d}
                    previous={adminFinance.prevSales1d}
                  />
                </div>
                <div className="card-stat big">
                  <span>1 week</span>
                  <strong>${adminFinance.sales1w}</strong>
                  <TrendBadge
                    current={adminFinance.sales1w}
                    previous={adminFinance.prevSales1w}
                  />
                </div>
                <div className="card-stat big">
                  <span>1 month</span>
                  <strong>${adminFinance.sales1m}</strong>
                  <TrendBadge
                    current={adminFinance.sales1m}
                    previous={adminFinance.prevSales1m}
                  />
                </div>
                <div className="card-stat big">
                  <span>YoY (demo)</span>
                  <strong>+6.2%</strong>
                  <span className="muted small">vs same month last year</span>
                </div>
              </div>
            </article>

            <article className="panel">
              <h3>Daily money & drawer (cash overflow / variance)</h3>
              <p className="muted">{adminFinance.notes}</p>
              <div className="money-grid">
                <div className="money-box">
                  <span>Opening cash (float)</span>
                  <strong>${adminFinance.openingCash}</strong>
                </div>
                <div className="money-box">
                  <span>Expected in drawer</span>
                  <strong>${adminFinance.expectedDrawer}</strong>
                </div>
                <div className="money-box highlight">
                  <span>Counted cash</span>
                  <strong>${adminFinance.countedCash}</strong>
                </div>
                <div className={`money-box ${adminFinance.variance >= 0 ? "pos" : "neg"}`}>
                  <span>Variance (overflow / short)</span>
                  <strong>
                    {adminFinance.variance >= 0 ? "+" : ""}
                    ${adminFinance.variance}
                  </strong>
                </div>
                <div className="money-box">
                  <span>Petty cash</span>
                  <strong>${adminFinance.pettyCash}</strong>
                </div>
                <div className="money-box">
                  <span>Safe drop (today)</span>
                  <strong>${adminFinance.safeDrop}</strong>
                </div>
              </div>
            </article>

            <article className="panel">
              <h3>Daily management — money outflow & adjustments</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Voids</td>
                      <td>${adminFinance.voids}</td>
                      <td>Manager-approved line voids</td>
                    </tr>
                    <tr>
                      <td>Refunds</td>
                      <td>${adminFinance.refunds}</td>
                      <td>Customer returns</td>
                    </tr>
                    <tr>
                      <td>Discounts given</td>
                      <td>${adminFinance.discountsGiven}</td>
                      <td>Loyalty + manual %</td>
                    </tr>
                    <tr>
                      <td>Card fees (est.)</td>
                      <td>${adminFinance.cardFeesEst}</td>
                      <td>Settlement preview</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel">
              <h3>Quick admin actions</h3>
              <div className="admin-actions">
                <button type="button">Close day &amp; reconcile</button>
                <button type="button">Bank deposit slip</button>
                <button type="button">Export GL / CSV</button>
                <button type="button">Lock registers</button>
                <button type="button" onClick={openRecharge}>
                  Recharge / International cards
                </button>
                <button type="button" onClick={openCouponChooser}>
                  Coupons
                </button>
              </div>
            </article>
          </section>
        )}

        {activePage === "products" && (
          <section className="grid two-col">
            <article className="panel">
              <h3>Product management</h3>
              <p className="muted">
                Add, edit, delete, categories, stock — ties to inventory and POS tiles.
              </p>
              <div className="form-grid">
                {Object.keys(newProduct).map((field) => (
                  <label key={field}>
                    {field}
                    <input
                      value={newProduct[field]}
                      onChange={(e) =>
                        setNewProduct((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      placeholder={`Enter ${field}`}
                    />
                  </label>
                ))}
              </div>
              <div className="actions">
                <button type="button" onClick={addProduct}>
                  Add product
                </button>
                <button type="button" onClick={resetNewProduct}>
                  Clear
                </button>
              </div>
            </article>
            <article className="panel">
              <h3>Catalog</h3>
              <input
                className="search"
                placeholder="Search name or barcode"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Barcode</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Supplier</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.barcode}</td>
                        <td>{item.category}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>{item.stock}</td>
                        <td>{item.supplier}</td>
                        <td className="row-actions">
                          <button type="button" onClick={() => addToCart(item)}>
                            Cart
                          </button>
                          <button type="button" onClick={() => deleteProduct(item.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        {activePage === "inventory" && (
          <section className="panel">
            <h3>Inventory</h3>
            <p className="muted">
              Stock drops on checkout; low stock feeds Dashboard and receiving tasks.
            </p>
            <ul className="list">
              {products.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.name} ({item.category})
                  </span>
                  <strong>{item.stock} on hand</strong>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activePage === "reports" && (
          <section className="panel">
            <h3>Reports</h3>
            <div className="stats">
              <div className="card-stat">
                <span>Daily</span>
                <strong>${dailySales}</strong>
              </div>
              <div className="card-stat">
                <span>Weekly</span>
                <strong>${weeklySales}</strong>
              </div>
              <div className="card-stat">
                <span>Best seller</span>
                <strong>Sunflower Oil 1L</strong>
              </div>
              <div className="card-stat">
                <span>Transactions</span>
                <strong>{totalTransactions}</strong>
              </div>
              <div className="card-stat">
                <span>Revenue (MTD)</span>
                <strong>${revenue}</strong>
              </div>
            </div>
            <p className="muted">
              For charts and period comparisons, use <strong>Analytics</strong>; for cash
              variance use <strong>Admin $$$</strong>.
            </p>
          </section>
        )}

        {activePage === "users" && (
          <section className="panel">
            <h3>Users &amp; roles</h3>
            <div className="grid two-col">
              <div>
                <h4>Admin</h4>
                <ul className="list">
                  <li>
                    <span>Products &amp; pricing</span>
                    <strong>Yes</strong>
                  </li>
                  <li>
                    <span>Reports &amp; analytics</span>
                    <strong>Yes</strong>
                  </li>
                  <li>
                    <span>Cash / variance</span>
                    <strong>Yes</strong>
                  </li>
                </ul>
              </div>
              <div>
                <h4>Cashier</h4>
                <ul className="list">
                  <li>
                    <span>POS &amp; receipts</span>
                    <strong>Yes</strong>
                  </li>
                  <li>
                    <span>Discount limits</span>
                    <strong>Manager override</strong>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {activePage === "planning" && (
          <section className="planning-hub">
            <article className="panel">
              <h3>Planning work — UI/UX deliverables</h3>
              <p className="muted">
                This section documents the <strong>user journey</strong>, low-fidelity{" "}
                <strong>wireframes</strong>, and a <strong>clickable prototype</strong> path aligned
                with coursework / team planning expectations.
              </p>
            </article>

            <article className="panel">
              <h3>Team roles (project scope)</h3>
              <div className="grid two-col">
                <div className="sub-panel">
                  <h4>Frontend Developers</h4>
                  <p className="muted small">Responsibilities</p>
                  <ul className="formal-list">
                    <li>POS interface</li>
                    <li>Dashboard</li>
                    <li>Product management UI</li>
                  </ul>
                  <p className="muted small" style={{ marginTop: "0.75rem" }}>
                    Key pages
                  </p>
                  <ul className="formal-list">
                    <li>Login</li>
                    <li>Product management</li>
                    <li>Checkout screen</li>
                    <li>Sales dashboard</li>
                  </ul>
                </div>
                <div className="sub-panel">
                  <h4>UI/UX Designer</h4>
                  <p className="muted small">Responsibilities</p>
                  <ul className="formal-list">
                    <li>Design cashier-friendly interface</li>
                    <li>Create layout wireframes</li>
                    <li>Optimize workflow for fast checkout</li>
                  </ul>
                </div>
              </div>
            </article>

            <article className="panel">
              <h3>1. User journey (primary flow)</h3>
              <p className="muted">
                Target path for front-line checkout: fast, linear, minimal decision points.
              </p>
              <div className="journey-flow" aria-label="User journey">
                <div className="journey-step">
                  <span className="journey-num">1</span>
                  <strong>Cashier</strong>
                  <span className="journey-desc">Signs in / selects register</span>
                </div>
                <span className="journey-arrow" aria-hidden="true">
                  →
                </span>
                <div className="journey-step">
                  <span className="journey-num">2</span>
                  <strong>Scan</strong>
                  <span className="journey-desc">Barcode scan or search / hot keys</span>
                </div>
                <span className="journey-arrow" aria-hidden="true">
                  →
                </span>
                <div className="journey-step">
                  <span className="journey-num">3</span>
                  <strong>Checkout</strong>
                  <span className="journey-desc">Cart review, discounts, age-restricted prompts</span>
                </div>
                <span className="journey-arrow" aria-hidden="true">
                  →
                </span>
                <div className="journey-step">
                  <span className="journey-num">4</span>
                  <strong>Payment</strong>
                  <span className="journey-desc">Cash / card / voucher → receipt</span>
                </div>
              </div>
              <ul className="formal-list">
                <li>
                  <strong>Success criteria:</strong> average transaction time kept low; errors recoverable
                  without clearing the cart.
                </li>
                <li>
                  <strong>Edge paths (documented elsewhere):</strong> void line, manager override,
                  out-of-stock substitute.
                </li>
              </ul>
            </article>

            <article className="panel">
              <h3>2. Design wireframes (low-fidelity)</h3>
              <p className="muted">
                Structural layout only — spacing, hierarchy, and touch targets for register hardware.
              </p>
              <div className="wireframe-row">
                <div className="wireframe-box">
                  <span className="wf-label">Screen A — POS register</span>
                  <div className="wf-inner">
                    <div className="wf-block sm">Header · nav</div>
                    <div className="wf-block">Category rail</div>
                    <div className="wf-grid-mini">
                      <div className="wf-tile" />
                      <div className="wf-tile" />
                      <div className="wf-tile" />
                      <div className="wf-tile" />
                    </div>
                  </div>
                </div>
                <div className="wireframe-box">
                  <span className="wf-label">Screen B — Cart &amp; totals</span>
                  <div className="wf-inner">
                    <div className="wf-block">Line items list</div>
                    <div className="wf-block sm">Subtotal / tax / discount</div>
                    <div className="wf-block">Keypad · pay actions</div>
                  </div>
                </div>
                <div className="wireframe-box">
                  <span className="wf-label">Screen C — Admin / reports</span>
                  <div className="wf-inner">
                    <div className="wf-block sm">Period filters (day / week / month)</div>
                    <div className="wf-block">KPI cards · charts</div>
                    <div className="wf-block sm">Cash variance · export</div>
                  </div>
                </div>
              </div>
            </article>

            <article className="panel">
              <h3>3. Clickable prototype</h3>
              <p className="muted">
                Simulates the journey above on the live UI: guided steps on{" "}
                <strong>POS Terminal</strong> with on-screen instructions.
              </p>
              <div className="prototype-actions">
                <button
                  type="button"
                  onClick={() => {
                    setActivePage("pos");
                    setPrototypeStep(1);
                  }}
                >
                  Start prototype (go to POS, step 1)
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setPrototypeStep(0)}
                >
                  Reset prototype banner
                </button>
              </div>
              <p className="muted small">
                After starting, use <strong>Next step</strong> on the green banner until step 4, or
                exit anytime. Press <kbd>Esc</kbd> to close any open info dialog.
              </p>
            </article>
          </section>
        )}
      </main>

      {modal === "about" && (
        <InfoModal title="About — GreenCart POS" onClose={() => setModal(null)}>
          <p className="formal-p">
            <strong>GreenCart POS</strong> is a front-end demonstration of a supermarket
            point-of-sale system for small to medium stores. It illustrates cashier checkout,
            product and inventory views, delivery and operations placeholders, and administrative
            reporting concepts.
          </p>
          <p className="formal-p">
            <strong>Version:</strong> demo / educational UI (not production software).{" "}
            <strong>Scope:</strong> browser-based interface only; no live payment processing or
            backend integration in this build.
          </p>
          <p className="formal-p">
            <strong>Team:</strong> UI/UX — visual design, component patterns, and user flows. For
            project documentation, see <strong>Planning &amp; UX</strong> in the main navigation.
          </p>
        </InfoModal>
      )}

      {modal === "help" && (
        <InfoModal title="Help — Using this application" onClose={() => setModal(null)}>
          <ul className="formal-list">
            <li>
              <strong>POS Terminal:</strong> filter by category, scan or type a barcode, tap tiles to
              add items, then complete payment on the right panel.
            </li>
            <li>
              <strong>Products:</strong> add items to the catalog; use search to find rows quickly.
            </li>
            <li>
              <strong>Admin $$$:</strong> review day / week / month sales and cash drawer variance
              (demo numbers).
            </li>
            <li>
              <strong>Planning &amp; UX:</strong> view the documented user journey, wireframes, and
              start the clickable prototype.
            </li>
          </ul>
          <p className="muted small">
            Tip: use the top navigation to switch modules; your role (Admin / Cashier) is for
            labeling and training context in this demo.
          </p>
        </InfoModal>
      )}

      {modal === "inline" && (
        <InfoModal title="Inline — Contextual help" onClose={() => setModal(null)}>
          <p className="formal-p">
            <strong>Inline help</strong> (in a full product) appears next to fields and actions
            (tooltips, “?” icons, short hints). In this demo, use:
          </p>
          <ul className="formal-list">
            <li>
              <strong>Scan field:</strong> enter a full barcode from the Products table, press{" "}
              <strong>Add</strong> or Enter.
            </li>
            <li>
              <strong>Discount %:</strong> applies to the whole ticket for training purposes.
            </li>
            <li>
              <strong>Voucher / QR:</strong> shown when payment method is voucher — represents
              scanned codes or gift cards.
            </li>
          </ul>
        </InfoModal>
      )}

      {modal === "test" && (
        <InfoModal title="Test — QA checklist (demo)" onClose={() => setModal(null)}>
          <p className="formal-p">
            Use this list to walk through the UI before a review or presentation.
          </p>
          <ol className="formal-ol">
            <li>Navigate each top menu item; confirm panels load without errors.</li>
            <li>On POS, add an item via tile and via barcode; change quantity; remove a line.</li>
            <li>Apply discount; switch payment methods; complete payment (stock should decrease).</li>
            <li>Open Analytics and confirm charts render.</li>
            <li>Open Planning &amp; UX → start clickable prototype; step through all 4 steps.</li>
          </ol>
        </InfoModal>
      )}

      {modal === "helpline" && (
        <InfoModal title="Helpline — Support &amp; escalation (sample)" onClose={() => setModal(null)}>
          <p className="formal-p">
            <strong>Store operations helpline (fictitious — replace with real contacts).</strong>
          </p>
          <dl className="formal-dl">
            <dt>IT / POS issues</dt>
            <dd>+1 (555) 010-0200 — 24/7 hardware &amp; network</dd>
            <dt>Payment / card terminal</dt>
            <dd>+1 (555) 010-0201 — acquirer support reference on terminal sticker</dd>
            <dt>Security / fraud</dt>
            <dd>Internal extension 7999 — follow company policy</dd>
          </dl>
          <p className="muted small">
            For coursework: list your real supervisor, email, and SLA. This block is placeholder
            formal copy only.
          </p>
        </InfoModal>
      )}

      {modal === "admin" && (
        <InfoModal title="Administrator — Role &amp; responsibilities" onClose={() => setModal(null)}>
          <p className="formal-p">
            <strong>Purpose:</strong> administrators configure the store catalog, monitor sales and
            cash, and ensure compliance with inventory and pricing.
          </p>
          <ul className="formal-list">
            <li>
              <strong>Products &amp; categories:</strong> add/edit/delete items; maintain barcodes and
              stock levels.
            </li>
            <li>
              <strong>Financials:</strong> review day / week / month sales, voids, refunds, discounts,
              and cash drawer variance (overflow / short).
            </li>
            <li>
              <strong>Reporting:</strong> use Analytics and Reports for trends; export in a full system.
            </li>
            <li>
              <strong>Staff alignment:</strong> assign tasks via Staff / Maintenance; approve overrides.
            </li>
          </ul>
          <p className="muted small">
            In this demo, selecting <strong>Admin</strong> also sets the role label for your session;
            use <strong>Admin $$$</strong> and <strong>Products</strong> for the main admin tasks.
          </p>
        </InfoModal>
      )}

      {modal === "adminPin" && (
        <InfoModal title="Admin Access PIN" onClose={() => setModal(null)}>
          <p className="formal-p">
            Enter admin security PIN to unlock full interface and management sections.
          </p>
          <label>
            Admin PIN
            <input
              type="password"
              className="pin-input"
              value={adminPin}
              onChange={(e) => {
                setAdminPin(e.target.value);
                setAdminPinError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && unlockAdmin()}
              placeholder="Enter 4-digit PIN"
              autoFocus
            />
          </label>
          {adminPinError && <p className="pin-error">{adminPinError}</p>}
          <div className="actions">
            <button type="button" onClick={unlockAdmin}>
              Unlock Admin
            </button>
          </div>
        </InfoModal>
      )}

      {modal === "cashier" && (
        <InfoModal title="Cashier — Role &amp; responsibilities" onClose={() => setModal(null)}>
          <p className="formal-p">
            <strong>Purpose:</strong> cashiers complete sales quickly and accurately while following
            store policies (discounts, age-restricted items, returns).
          </p>
          <ul className="formal-list">
            <li>
              <strong>Scan &amp; search:</strong> use the scanner or barcode field; use categories and
              hot keys for common items.
            </li>
            <li>
              <strong>Cart:</strong> verify quantities and prices before payment.
            </li>
            <li>
              <strong>Payment:</strong> cash, debit, credit, or voucher — confirm total with the
              customer before printing a receipt.
            </li>
            <li>
              <strong>Escalation:</strong> call a supervisor for overrides, voids, or system errors
              (see Helpline for sample contacts).
            </li>
          </ul>
          <p className="muted small">
            Use <strong>POS Terminal</strong> for checkout; <strong>Planning &amp; UX</strong> →
            Clickable prototype for the guided journey.
          </p>
        </InfoModal>
      )}

      {modal === "loginPin" && (
        <InfoModal
          title={`Login — ${loginTarget ? `${loginTarget.name} (${loginTarget.id})` : "Employee"}`}
          onClose={() => {
            setModal(null);
            setLoginTarget(null);
            setLoginPin("");
            setLoginError("");
          }}
        >
          <p className="formal-p">
            Enter PIN to sign in. Demo pins: Admin <strong>1124</strong>, employees{" "}
            <strong>1001–1007</strong>.
          </p>
          <label>
            PIN
            <input
              type="password"
              className="pin-input"
              value={loginPin}
              onChange={(e) => {
                setLoginPin(e.target.value);
                setLoginError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && finalizeLogin()}
              placeholder="Enter PIN"
              autoFocus
            />
          </label>
          {loginError && <p className="pin-error">{loginError}</p>}
          <div className="actions">
            <button type="button" onClick={finalizeLogin}>
              Sign in
            </button>
          </div>
        </InfoModal>
      )}

      {modal === "couponChooser" && (
        <InfoModal title="Coupons" onClose={() => setModal(null)}>
          <p className="formal-p">
            Choose coupon type. This supports store coupons, telemarketing coupons, or other promotions.
          </p>
          <div className="actions">
            <button type="button" onClick={() => beginCouponEntry("store")}>
              Store coupon
            </button>
            <button type="button" onClick={() => beginCouponEntry("telemarketing")}>
              Telemarketing coupon
            </button>
            <button type="button" onClick={() => beginCouponEntry("other")}>
              Other coupon
            </button>
          </div>
          {appliedCoupon && (
            <p className="muted small" style={{ marginTop: "0.75rem" }}>
              Currently applied: <strong>{appliedCoupon.type}</strong> · <code>{appliedCoupon.code}</code>
            </p>
          )}
        </InfoModal>
      )}

      {modal === "couponEnter" && (
        <InfoModal
          title={`Enter coupon${couponType ? ` — ${couponType}` : ""}`}
          onClose={() => setModal(null)}
        >
          <label>
            Coupon code
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
              placeholder="Scan / type coupon"
              autoFocus
            />
          </label>
          <div className="actions">
            <button type="button" onClick={applyCoupon}>
              Apply
            </button>
            <button type="button" className="ghost-btn" onClick={() => setModal("couponChooser")}>
              Back
            </button>
          </div>
        </InfoModal>
      )}

      {modal === "recharge" && (
        <InfoModal title="Recharge / International" onClose={() => setModal(null)}>
          <p className="formal-p">
            Quick checkout add-on for recharges and international calling/top-up cards (example: Boss
            Revolution).
          </p>
          <label>
            Recharge type
            <select value={rechargeType} onChange={(e) => setRechargeType(e.target.value)}>
              {RECHARGE_CATALOG.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid two-col">
            <label>
              Amount
              <input
                inputMode="decimal"
                placeholder="e.g. 10, 20, 50"
                value={rechargeValue}
                onChange={(e) => setRechargeValue(e.target.value)}
              />
            </label>
            <label>
              Customer reference
              <input
                placeholder="Phone / account / card #"
                value={rechargeCustomerRef}
                onChange={(e) => setRechargeCustomerRef(e.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button
              type="button"
              onClick={() => setModal(null)}
              disabled={!rechargeValue.trim() || !rechargeCustomerRef.trim()}
            >
              Confirm (demo)
            </button>
          </div>
          <p className="muted small">
            UI-only: in a full system this would call a provider API and print a receipt.
          </p>
        </InfoModal>
      )}
    </div>
  );
}

export default App;
