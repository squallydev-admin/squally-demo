export type Category = "Coffee" | "Tea" | "Accessories";

export interface Product {
  id: string;
  name: string;
  category: Category;
  priceCents: number;
  description: string;
}

export const CATEGORIES: Category[] = ["Coffee", "Tea", "Accessories"];

export const PRODUCTS: Product[] = [
  { id: "espresso-beans", name: "Espresso Beans", category: "Coffee", priceCents: 1290, description: "Dark roast, 500 g, for espresso machines." },
  { id: "filter-blend", name: "Filter Blend", category: "Coffee", priceCents: 990, description: "Medium roast, 500 g, for filter and French press." },
  { id: "decaf-roast", name: "Decaf Roast", category: "Coffee", priceCents: 1150, description: "Swiss water decaf, 500 g." },
  { id: "cold-brew-pack", name: "Cold Brew Pack", category: "Coffee", priceCents: 1490, description: "Coarse grind in brew bags, 8 bags." },
  { id: "green-tea", name: "Green Tea", category: "Tea", priceCents: 650, description: "Sencha, 100 g loose leaf." },
  { id: "earl-grey", name: "Earl Grey", category: "Tea", priceCents: 720, description: "Black tea with bergamot, 100 g." },
  { id: "chai-spice", name: "Chai Spice", category: "Tea", priceCents: 840, description: "Assam with cardamom and ginger, 100 g." },
  { id: "peppermint-tea", name: "Peppermint Tea", category: "Tea", priceCents: 560, description: "Whole peppermint leaves, 50 g." },
  { id: "pour-over-dripper", name: "Pour-Over Dripper", category: "Accessories", priceCents: 2400, description: "Ceramic dripper, size 02." },
  { id: "milk-frother", name: "Milk Frother", category: "Accessories", priceCents: 3200, description: "Handheld, battery powered." },
  { id: "tea-infuser", name: "Tea Infuser", category: "Accessories", priceCents: 890, description: "Stainless steel mesh ball." },
  { id: "travel-mug", name: "Travel Mug", category: "Accessories", priceCents: 1990, description: "Insulated, 350 ml, leak-proof lid." },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}
