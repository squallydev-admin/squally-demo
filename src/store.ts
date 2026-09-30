import { findProduct } from "./data";
import { MULTI_BUY_BUG } from "./mess";

// All state lives in localStorage: cart, orders and the login session.

export interface CartLine {
  productId: string;
  qty: number;
}

export interface OrderItem {
  name: string;
  qty: number;
  priceCents: number;
}

export interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  totalCents: number;
  customer: { name: string; email: string; street: string; postcode: string; city: string };
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- cart ---

export function getCart(): CartLine[] {
  return read<CartLine[]>("cart", []);
}

export function saveCart(lines: CartLine[]): void {
  write("cart", lines);
}

export function addToCart(productId: string, qty: number): void {
  const lines = getCart();
  const line = lines.find((l) => l.productId === productId);
  if (line) line.qty += qty;
  else lines.push({ productId, qty });
  saveCart(lines);
}

export function setQuantity(productId: string, qty: number): void {
  saveCart(getCart().map((l) => (l.productId === productId ? { ...l, qty } : l)));
}

export function removeFromCart(productId: string): void {
  saveCart(getCart().filter((l) => l.productId !== productId));
}

export function clearCart(): void {
  saveCart([]);
}

export function cartCount(lines = getCart()): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export const MULTI_BUY_MIN_ITEMS = 3;

export interface CartTotals {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

export function cartTotals(lines = getCart()): CartTotals {
  const subtotalCents = lines.reduce((sum, l) => sum + (findProduct(l.productId)?.priceCents ?? 0) * l.qty, 0);
  const discountCents = cartCount(lines) >= MULTI_BUY_MIN_ITEMS ? Math.round(subtotalCents * 0.1) : 0;
  let totalCents = subtotalCents - discountCents;
  if (MULTI_BUY_BUG && discountCents > 0) {
    // DELIBERATE BUG (src/mess.ts): the discount is taken a second time.
    totalCents -= discountCents;
  }
  return { subtotalCents, discountCents, totalCents };
}

// --- orders ---

export function getOrders(): Order[] {
  return read<Order[]>("orders", []);
}

export function saveOrder(order: Order): void {
  write("orders", [...getOrders(), order]);
}

export function findOrder(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id);
}

// --- session ---

export const DEMO_USER = { username: "demo", password: "demo123" };

export function isLoggedIn(): boolean {
  return localStorage.getItem("session") === DEMO_USER.username;
}

export function logIn(username: string, password: string): boolean {
  if (username !== DEMO_USER.username || password !== DEMO_USER.password) return false;
  localStorage.setItem("session", username);
  return true;
}

export function logOut(): void {
  localStorage.removeItem("session");
}
