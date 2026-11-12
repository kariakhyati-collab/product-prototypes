/**
 * Fictional catalogue for "Sundar Distributors", an FMCG distributor in Pune.
 * Prices are trade prices per orderable unit, in paise, GST included.
 * Brand names belong to their owners and are used only as realistic sample data.
 */

export type Category = "Biscuits" | "Noodles" | "Staples" | "Tea" | "Home care" | "Personal care" | "Snacks" | "Beverages";

export interface CatalogItem {
  id: string;
  name: string;
  /** What one orderable unit is, e.g. "Box of 24". */
  unit: string;
  category: Category;
  pricePaise: number;
  /** Minimum order quantity, in units. */
  moq: number;
  /** Lower-case phrases a retailer might type. Longest match wins. */
  aliases: string[];
  /** Suggested replacement when this item is out of stock. */
  substituteId?: string;
}

export const CATALOG: CatalogItem[] = [
  { id: "PRL-G70", name: "Parle-G Glucose 70g", unit: "Box of 24", category: "Biscuits", pricePaise: 10800, moq: 1, aliases: ["parle g", "parleg", "parle glucose", "parle"] },
  { id: "PRL-MON", name: "Parle Monaco Classic 63g", unit: "Box of 24", category: "Biscuits", pricePaise: 21600, moq: 1, aliases: ["monaco", "parle monaco"] },
  { id: "BRT-GDC", name: "Britannia Good Day Cashew 60g", unit: "Box of 24", category: "Biscuits", pricePaise: 22800, moq: 1, aliases: ["good day", "goodday", "britannia good day"] },
  { id: "BRT-MRG", name: "Britannia Marie Gold 120g", unit: "Box of 12", category: "Biscuits", pricePaise: 24000, moq: 1, aliases: ["marie gold", "marie"] },
  { id: "NES-MG12", name: "Maggi 2-Minute Masala 70g", unit: "Tray of 12", category: "Noodles", pricePaise: 15600, moq: 2, aliases: ["maggi 12 pack", "maggi 12pack", "maggi tray", "maggi noodles", "maggi masala", "maggi"] },
  { id: "SNF-YPM12", name: "Sunfeast YiPPee! Magic Masala 70g", unit: "Tray of 12", category: "Noodles", pricePaise: 14400, moq: 2, aliases: ["yippee", "yippie", "sunfeast yippee", "sunfeast noodles"] },
  { id: "TAT-SLT1", name: "Tata Salt 1kg", unit: "Bale of 10", category: "Staples", pricePaise: 27000, moq: 1, aliases: ["tata salt", "tata namak", "salt", "namak"], substituteId: "SDS-SLT1" },
  { id: "SDS-SLT1", name: "Sundar Select Iodised Salt 1kg", unit: "Bale of 10", category: "Staples", pricePaise: 23500, moq: 1, aliases: ["sundar select salt", "sundar salt", "select salt"] },
  { id: "FOR-SUN1", name: "Fortune Sunlite Sunflower Oil 1L", unit: "Pouch", category: "Staples", pricePaise: 15500, moq: 5, aliases: ["fortune oil", "fortune sunflower", "fortune", "sunflower oil", "oil", "tel"] },
  { id: "ASH-ATA5", name: "Aashirvaad Shudh Chakki Atta 5kg", unit: "Bag", category: "Staples", pricePaise: 26200, moq: 1, aliases: ["aashirvaad atta", "aashirvaad", "ashirvad", "aashirvad", "atta"] },
  { id: "TAT-TEA250", name: "Tata Tea Premium 250g", unit: "Pack", category: "Tea", pricePaise: 12800, moq: 1, aliases: ["tata tea", "tata chai", "tea", "chai patti"] },
  { id: "BRB-RL250", name: "Brooke Bond Red Label 250g", unit: "Pack", category: "Tea", pricePaise: 13200, moq: 1, aliases: ["red label", "brooke bond"] },
  { id: "SRF-EW1", name: "Surf Excel Easy Wash 1kg", unit: "Pack", category: "Home care", pricePaise: 12800, moq: 1, aliases: ["surf excel", "surf"] },
  { id: "RIN-BAR4", name: "Rin Detergent Bar 250g", unit: "Pack of 4", category: "Home care", pricePaise: 7800, moq: 1, aliases: ["rin bar", "rin"] },
  { id: "VIM-BAR3", name: "Vim Dishwash Bar 300g", unit: "Pack of 3", category: "Home care", pricePaise: 8400, moq: 1, aliases: ["vim bar", "vim"] },
  { id: "LUX-SG4", name: "Lux Soft Glow Soap 100g", unit: "Pack of 4", category: "Personal care", pricePaise: 14800, moq: 1, aliases: ["lux soap", "lux"] },
  { id: "CLG-ST200", name: "Colgate Strong Teeth 200g", unit: "Tube", category: "Personal care", pricePaise: 10200, moq: 1, aliases: ["colgate", "toothpaste"] },
  { id: "DTL-OR3", name: "Dettol Original Soap 125g", unit: "Pack of 3", category: "Personal care", pricePaise: 16800, moq: 1, aliases: ["dettol soap", "dettol"] },
  { id: "KRK-MM12", name: "Kurkure Masala Munch 40g", unit: "Strip of 12", category: "Snacks", pricePaise: 21600, moq: 1, aliases: ["kurkure"] },
  { id: "HLD-AB200", name: "Haldiram's Aloo Bhujia 200g", unit: "Pack", category: "Snacks", pricePaise: 5000, moq: 6, aliases: ["aloo bhujia", "haldirams bhujia", "haldirams", "haldiram", "bhujia"] },
  { id: "FRT-125", name: "Frooti Mango 125ml", unit: "Case of 40", category: "Beverages", pricePaise: 36000, moq: 1, aliases: ["frooti", "mango drink"] },
];

/** Units on hand at the start of the demo. Tata Salt is deliberately out of stock. */
export const INITIAL_STOCK: Record<string, number> = {
  "PRL-G70": 140, "PRL-MON": 42, "BRT-GDC": 38, "BRT-MRG": 25, "NES-MG12": 36, "SNF-YPM12": 30,
  "TAT-SLT1": 0, "SDS-SLT1": 60, "FOR-SUN1": 90, "ASH-ATA5": 24, "TAT-TEA250": 55, "BRB-RL250": 18,
  "SRF-EW1": 40, "RIN-BAR4": 64, "VIM-BAR3": 70, "LUX-SG4": 33, "CLG-ST200": 48, "DTL-OR3": 20,
  "KRK-MM12": 6, "HLD-AB200": 72, "FRT-125": 15,
};

export const CATALOG_BY_ID: Record<string, CatalogItem> = Object.fromEntries(CATALOG.map((c) => [c.id, c]));

export function getItem(id: string): CatalogItem {
  const item = CATALOG_BY_ID[id];
  if (!item) throw new Error(`Unknown SKU ${id}`);
  return item;
}
