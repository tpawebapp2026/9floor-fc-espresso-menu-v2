import posterCatalog from "./posterCatalog.json";
import { posterPage1 } from "./posterPage1";
import { posterPage2 } from "./posterPage2";
import { posterPage3 } from "./posterPage3";
import { posterPage4 } from "./posterPage4";

// Exact album menu-name-to-photo mapping; original poster crop, not a verified prepared drink photo.
const photos: Record<string, string> = {
  ...posterPage1,
  ...posterPage2,
  ...posterPage3,
  ...posterPage4,
};
const names: Record<string, string> = {
  "iced sea salt latte": "p2_C06.jpg",
  "dalgona honey latte": "p2_C07.jpg",
  "iced oreo latte": "p2_C08.jpg",
  "caramel oreo latte": "p2_C09.jpg",
  "vanilla cold foam latte": "p2_C10.jpg",
  "honey lemon espresso": "p2_C11.jpg",
  "iced chocolate latte": "p2_C12.jpg",
  "chocolate cold foam": "p2_C13.jpg",
  "strawberry matcha latte": "p2_C14.jpg",
  "mixed berry matcha latte": "p2_C15.jpg",
  "taro matcha latte": "p2_C16.jpg",
  "passion lychee soda": "p3_F01A.jpg",
  "strawberry lychee soda": "p3_F02A.jpg",
  "mixed berry lychee soda": "p3_F03A.jpg",
  "strawberry passion soda": "p3_F04A.jpg",
  "blue passion soda": "p3_F05A.jpg",
  "blue lychee soda": "p3_F06A.jpg",
  "vanilla oreo milk": "p3_K01A.jpg",
  "strawberry cream milk": "p3_K02A.jpg",
  "mixed berry cream milk": "p3_K03A.jpg",
  "chocolate oreo cream": "p3_K04A.jpg",
  "taro oreo milk": "p3_K05A.jpg",
  espresso: "p1_C01.jpg",
  americano: "p1_C02.jpg",
  latte: "p1_C03.jpg",
  cappuccino: "p1_C04.jpg",
  mocha: "p1_C05.jpg",
  "caramel macchiato": "p1_S01.jpg",
  "honey latte": "p1_S02.jpg",
  "vanilla latte": "p1_S03.jpg",
  "sea salt latte": "p1_S04.jpg",
  "dalgona coffee": "p1_S05.jpg",
  "classic chocolate": "p1_CH01.jpg",
  "dark cocoa": "p1_CH02.jpg",
  "chocolate oreo": "p1_CH03.jpg",
  "matcha latte": "p1_M01.jpg",
  "matcha cream": "p1_M02.jpg",
  "matcha oreo": "p1_M03.jpg",
  "taro latte": "p1_T01.jpg",
  "taro cream": "p1_T02.jpg",
  "taro oreo": "p1_T03.jpg",
  "strawberry soda": "p1_F01.jpg",
  "mixed berry soda": "p1_F02.jpg",
  "passion fruit soda": "p1_F03.jpg",
  "lychee soda": "p1_F04.jpg",
  "blueberry soda": "p1_F05.jpg",
  "vanilla milk": "p1_MI01.jpg",
  "caramel milk": "p1_MI02.jpg",
  "honey milk": "p1_MI03.jpg",
  "milk green tea": "p1_MI04.jpg",
  "ice milk": "p1_MI05.jpg",
  "hot americano": "p1_H01.jpg",
  "hot latte": "p1_H02.jpg",
  "hot cappuccino": "p1_H03.jpg",
  "hot chocolate": "p1_H04.jpg",
  "oreo latte": "p4_C08A.jpg",
  "iced cocoa milk": "p4_CH06.jpg",
  "iced milk green tea": "p4_T04.jpg",
  "hot matcha latte": "p4_HT05.jpg",
  "hot taro latte": "p4_HT06.jpg",
  "hot milk green tea": "p4_HT07.jpg",
  "hot vanilla milk": "p4_HT08.jpg",
  "whipped cream": "p4_TP01.jpg",
  "oreo crumble": "p4_TP02.jpg",
  "chocolate sauce": "p4_TP03.jpg",
  "caramel sauce": "p4_TP04.jpg",
  "extra espresso shot": "p4_TP05.jpg",
};
export const posterAlbumNames = Object.keys(names);
export function posterImageForName(name: string): string | null {
  const key = name.toLowerCase().trim();
  const file =
    names[key === "hot espresso" ? "espresso" : key] ||
    (key.startsWith("iced ") ? names[key.slice(5)] : undefined);
  return file ? photos[file] || null : null;
}

export const posterGroups = [
  { id: "album-classic", name: "Classic Coffee" },
  { id: "album-signature", name: "Signature Coffee" },
  { id: "album-cream", name: "Cream & Milk" },
  { id: "album-chocolate", name: "Chocolate & Cocoa" },
  { id: "album-matcha", name: "Matcha & Taro" },
  { id: "album-fruit", name: "Fruit Soda" },
  { id: "album-milk", name: "Specialty Milk" },
  { id: "album-hot", name: "Hot Drinks" },
];
export function posterGroupForName(name: string): string | null {
  const key = name.toLowerCase().trim();
  const canonical =
    key === "hot espresso"
      ? "espresso"
      : names[key]
        ? key
        : key.startsWith("iced ")
          ? key.slice(5)
          : key;
  const row = posterCatalog.find((row) => row.name.toLowerCase() === canonical);
  if (!row) return null;
  if (canonical === "espresso") return "album-classic";
  if (/^hot /.test(canonical)) return "album-hot";
  if (/Cream &|Cream & Oreo/.test(row.category)) return "album-cream";
  if (/Signature/.test(row.category) && !/chocolate/i.test(canonical))
    return "album-signature";
  if (/Chocolate/.test(row.category)) return "album-chocolate";
  if (/Matcha|Taro/.test(row.category)) return "album-matcha";
  if (/Fruit/.test(row.category)) return "album-fruit";
  if (row.category === "Milk") return "album-milk";
  return row.category === "Classic Coffee" ? "album-classic" : null;
}
