import "./style.css";
import { CATEGORIES, PRODUCTS, findProduct, formatPrice } from "./data";
import { SLOW_PAGE_MS, randomDelay, stockCheckFails } from "./mess";
import {
  type Order,
  addToCart,
  cartCount,
  cartTotals,
  clearCart,
  findOrder,
  getCart,
  getOrders,
  isLoggedIn,
  logIn,
  logOut,
  removeFromCart,
  saveOrder,
  setQuantity,
} from "./store";

const header = document.getElementById("header")!;
const app = document.getElementById("app")!;

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function go(path: string): void {
  location.hash = `#${path}`;
}

// --- header ---

function renderHeader(): void {
  header.innerHTML = `
    <a href="#/" class="brand">Squally Demo Shop</a>
    <nav>
      <a href="#/">Shop</a>
      <a href="#/cart">Cart (<span data-testid="cart-count">${cartCount()}</span>)</a>
      <a href="#/orders">Order history</a>
      ${
        isLoggedIn()
          ? `<span data-testid="signed-in">Signed in as demo</span> <button type="button" id="logout">Log out</button>`
          : `<a href="#/login">Log in</a>`
      }
    </nav>`;
  header.querySelector("#logout")?.addEventListener("click", () => {
    logOut();
    renderHeader();
    go("/");
  });
}

// --- product list ---

function renderProductList(): void {
  app.innerHTML = `
    <h1>Products</h1>
    <div data-testid="deal-slot"></div>
    <div class="filters">
      <label>Search <input type="search" id="search" placeholder="Search products" /></label>
      <label>Category
        <select id="category">
          <option value="">All</option>
          ${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </label>
    </div>
    <p data-testid="result-count"></p>
    <ul class="products" data-testid="product-list"></ul>
    <p data-testid="empty-state" hidden>No products match your search.</p>`;

  // DELIBERATE MESS (src/mess.ts): the banner arrives after 0–3 s.
  const dealSlot = app.querySelector<HTMLElement>("[data-testid=deal-slot]")!;
  setTimeout(() => {
    dealSlot.innerHTML = `<p class="deal" data-testid="deal-banner">Today only: free delivery on every order.</p>`;
  }, randomDelay());

  const search = app.querySelector<HTMLInputElement>("#search")!;
  const category = app.querySelector<HTMLSelectElement>("#category")!;
  const list = app.querySelector<HTMLUListElement>("[data-testid=product-list]")!;
  const count = app.querySelector<HTMLElement>("[data-testid=result-count]")!;
  const empty = app.querySelector<HTMLElement>("[data-testid=empty-state]")!;

  const update = () => {
    const term = search.value.trim().toLowerCase();
    const matches = PRODUCTS.filter(
      (p) => (!category.value || p.category === category.value) && p.name.toLowerCase().includes(term),
    );
    list.innerHTML = matches
      .map(
        (p) => `
        <li class="card" data-testid="product-card">
          <a href="#/product/${p.id}">${p.name}</a>
          <span class="category">${p.category}</span>
          <span class="price">${formatPrice(p.priceCents)}</span>
          <button type="button" data-add="${p.id}">Add to cart</button>
        </li>`,
      )
      .join("");
    count.textContent = `${matches.length} ${matches.length === 1 ? "product" : "products"}`;
    empty.hidden = matches.length > 0;
  };

  search.addEventListener("input", update);
  category.addEventListener("change", update);
  list.addEventListener("click", (event) => {
    const id = (event.target as HTMLElement).dataset.add;
    if (!id) return;
    addToCart(id, 1);
    renderHeader();
  });
  update();
}

// --- product detail ---

function renderProductDetail(id: string): void {
  const product = findProduct(id);
  if (!product) {
    app.innerHTML = `<h1>Product not found</h1><a href="#/">Back to products</a>`;
    return;
  }
  app.innerHTML = `
    <a href="#/">← Back to products</a>
    <h1>${product.name}</h1>
    <p class="price" data-testid="price">${formatPrice(product.priceCents)}</p>
    <p data-testid="description">${product.description}</p>
    <p data-testid="stock">Checking stock…</p>
    <label>Quantity <input type="number" id="qty" min="1" value="1" /></label>
    <button type="button" id="add">Add to cart</button>
    <p role="status" data-testid="added-message"></p>
    <section>
      <h2>Customer reviews</h2>
      <div data-testid="reviews">Loading reviews…</div>
    </section>`;

  // DELIBERATE MESS (src/mess.ts): the stock check fails on ~15% of loads.
  const stock = app.querySelector<HTMLElement>("[data-testid=stock]")!;
  const stockFails = stockCheckFails();
  setTimeout(() => {
    if (stockFails) {
      console.error(`stock service: 503 Service Unavailable for ${product.id}`);
      stock.textContent = "Stock check failed. Try again later.";
      stock.className = "error";
    } else {
      stock.textContent = "In stock";
    }
  }, 300);

  // DELIBERATE MESS (src/mess.ts): reviews arrive after 0–3 s.
  const reviews = app.querySelector<HTMLElement>("[data-testid=reviews]")!;
  setTimeout(() => {
    reviews.innerHTML = `
      <ul data-testid="review-list">
        <li>★★★★★ Exactly as described. – Anna</li>
        <li>★★★★☆ Good, delivery took a day longer. – Ben</li>
      </ul>`;
  }, randomDelay());

  const qty = app.querySelector<HTMLInputElement>("#qty")!;
  const added = app.querySelector<HTMLElement>("[data-testid=added-message]")!;
  app.querySelector("#add")!.addEventListener("click", () => {
    const n = Math.max(1, Math.floor(Number(qty.value) || 1));
    addToCart(product.id, n);
    renderHeader();
    added.textContent = `Added ${n} to cart`;
  });
}

// --- cart ---

function renderCart(): void {
  const lines = getCart();
  if (lines.length === 0) {
    app.innerHTML = `
      <h1>Your cart</h1>
      <p data-testid="cart-empty">Your cart is empty.</p>
      <a href="#/">Continue shopping</a>`;
    return;
  }

  app.innerHTML = `
    <h1>Your cart</h1>
    <table>
      <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th></th></tr></thead>
      <tbody>
        ${lines
          .map((l) => {
            const p = findProduct(l.productId)!;
            return `
            <tr data-testid="cart-line" data-id="${p.id}">
              <td>${p.name}</td>
              <td><input type="number" min="1" value="${l.qty}" aria-label="Quantity for ${p.name}" data-qty="${p.id}" /></td>
              <td data-testid="line-total">${formatPrice(p.priceCents * l.qty)}</td>
              <td><button type="button" data-remove="${p.id}">Remove</button></td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>
    <dl class="totals">
      <dt>Subtotal</dt><dd data-testid="subtotal"></dd>
      <dt data-discount>Multi-buy discount (10%)</dt><dd data-testid="discount" data-discount></dd>
      <dt>Total</dt><dd data-testid="total"></dd>
    </dl>
    <p data-testid="delivery-estimate">Calculating delivery date…</p>
    <a href="#/checkout" class="button">Checkout</a>`;

  const refreshTotals = () => {
    const t = cartTotals();
    app.querySelector("[data-testid=subtotal]")!.textContent = formatPrice(t.subtotalCents);
    app.querySelector("[data-testid=discount]")!.textContent = `−${formatPrice(t.discountCents)}`;
    app.querySelectorAll<HTMLElement>("[data-discount]").forEach((el) => (el.hidden = t.discountCents === 0));
    app.querySelector("[data-testid=total]")!.textContent = formatPrice(t.totalCents);
  };
  refreshTotals();

  // DELIBERATE MESS (src/mess.ts): the estimate arrives after 0–3 s.
  const estimate = app.querySelector<HTMLElement>("[data-testid=delivery-estimate]")!;
  setTimeout(() => {
    estimate.textContent = "Estimated delivery: 2–3 working days";
  }, randomDelay());

  app.querySelectorAll<HTMLInputElement>("[data-qty]").forEach((input) => {
    input.addEventListener("input", () => {
      const n = Math.floor(Number(input.value));
      if (!Number.isFinite(n) || n < 1) return;
      const p = findProduct(input.dataset.qty!)!;
      setQuantity(p.id, n);
      input.closest("tr")!.querySelector("[data-testid=line-total]")!.textContent = formatPrice(p.priceCents * n);
      refreshTotals();
      renderHeader();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeFromCart(button.dataset.remove!);
      renderHeader();
      renderCart();
    });
  });
}

// --- checkout ---

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTCODE = /^\d{5}$/;

function renderCheckout(): void {
  if (getCart().length === 0) {
    go("/cart");
    return;
  }
  const field = (id: string, label: string, type = "text") => `
    <div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" name="${id}" type="${type}" />
      <p class="error" data-testid="error-${id}"></p>
    </div>`;

  app.innerHTML = `
    <h1>Checkout</h1>
    <p>Order total: <strong data-testid="checkout-total">${formatPrice(cartTotals().totalCents)}</strong></p>
    <form novalidate>
      ${field("name", "Full name")}
      ${field("email", "Email", "email")}
      ${field("street", "Street")}
      ${field("postcode", "Postcode")}
      ${field("city", "City")}
      <button type="submit">Place order</button>
    </form>`;

  const form = app.querySelector("form")!;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = (id: string) => (form.elements.namedItem(id) as HTMLInputElement).value.trim();
    const errors: Record<string, string> = {};
    if (!value("name")) errors.name = "Full name is required.";
    if (!value("email")) errors.email = "Email is required.";
    else if (!EMAIL.test(value("email"))) errors.email = "Enter a valid email address.";
    if (!value("street")) errors.street = "Street is required.";
    if (!value("postcode")) errors.postcode = "Postcode is required.";
    else if (!POSTCODE.test(value("postcode"))) errors.postcode = "Postcode must be 5 digits.";
    if (!value("city")) errors.city = "City is required.";

    for (const id of ["name", "email", "street", "postcode", "city"]) {
      app.querySelector(`[data-testid=error-${id}]`)!.textContent = errors[id] ?? "";
    }
    if (Object.keys(errors).length > 0) return;

    const order: Order = {
      id: `SQ-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      items: getCart().map((l) => {
        const p = findProduct(l.productId)!;
        return { name: p.name, qty: l.qty, priceCents: p.priceCents };
      }),
      totalCents: cartTotals().totalCents,
      customer: {
        name: value("name"),
        email: value("email"),
        street: value("street"),
        postcode: value("postcode"),
        city: value("city"),
      },
    };
    saveOrder(order);
    clearCart();
    renderHeader();
    go(`/confirmation/${order.id}`);
  });
}

function renderConfirmation(id: string): void {
  const order = findOrder(id);
  if (!order) {
    app.innerHTML = `<h1>Order not found</h1><a href="#/">Back to products</a>`;
    return;
  }
  app.innerHTML = `
    <h1>Thank you for your order!</h1>
    <p>Order number <strong data-testid="order-id">${order.id}</strong></p>
    <p>We sent a confirmation to ${escapeHtml(order.customer.email)}.</p>
    <p>Total paid: <strong data-testid="order-total">${formatPrice(order.totalCents)}</strong></p>
    <a href="#/">Continue shopping</a>`;
}

// --- login and order history ---

function renderLogin(): void {
  if (isLoggedIn()) {
    app.innerHTML = `<h1>Log in</h1><p>You are signed in as demo. <a href="#/orders">Order history</a></p>`;
    return;
  }
  app.innerHTML = `
    <h1>Log in</h1>
    <form novalidate>
      <div class="field"><label for="username">Username</label><input id="username" autocomplete="username" /></div>
      <div class="field"><label for="password">Password</label><input id="password" type="password" autocomplete="current-password" /></div>
      <p class="error" role="alert" data-testid="login-error"></p>
      <button type="submit">Log in</button>
    </form>
    <p class="hint">Demo user: demo / demo123</p>`;

  const form = app.querySelector("form")!;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = app.querySelector<HTMLInputElement>("#username")!.value.trim();
    const password = app.querySelector<HTMLInputElement>("#password")!.value;
    if (!logIn(username, password)) {
      app.querySelector("[data-testid=login-error]")!.textContent = "Wrong username or password.";
      return;
    }
    renderHeader();
    go("/orders");
  });
}

function renderOrders(): void {
  if (!isLoggedIn()) {
    go("/login");
    return;
  }
  app.innerHTML = `
    <h1>Order history</h1>
    <p data-testid="orders-loading">Loading order history…</p>
    <ul data-testid="order-list"></ul>`;

  // DELIBERATE MESS (src/mess.ts): this page takes ~8 s.
  const loading = app.querySelector<HTMLElement>("[data-testid=orders-loading]")!;
  const list = app.querySelector<HTMLElement>("[data-testid=order-list]")!;
  setTimeout(() => {
    const orders = getOrders();
    loading.remove();
    list.innerHTML = orders.length
      ? orders
          .map(
            (o) => `
            <li data-testid="order-row">
              ${o.id} · ${new Date(o.createdAt).toLocaleDateString("en-GB")} ·
              ${o.items.reduce((n, i) => n + i.qty, 0)} items · ${formatPrice(o.totalCents)}
            </li>`,
          )
          .join("")
      : `<li data-testid="no-orders">No orders yet.</li>`;
  }, SLOW_PAGE_MS);
}

// --- router ---

function route(): void {
  const [page = "", param = ""] = location.hash.replace(/^#\/?/, "").split("/");
  renderHeader();
  switch (page) {
    case "":
      return renderProductList();
    case "product":
      return renderProductDetail(param);
    case "cart":
      return renderCart();
    case "checkout":
      return renderCheckout();
    case "confirmation":
      return renderConfirmation(param);
    case "login":
      return renderLogin();
    case "orders":
      return renderOrders();
    default:
      app.innerHTML = `<h1>Page not found</h1><a href="#/">Back to products</a>`;
  }
}

window.addEventListener("hashchange", route);
route();
