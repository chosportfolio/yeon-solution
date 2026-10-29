import rawCatalog from "./lg-catalog.json";
import { businessCategories } from "./business";

export type ProductImage = { src: string; alt: string; mobile?: string | null; width?: number; height?: number; mobileWidth?: number; mobileHeight?: number };
export type ProductFeatureItem = { image: ProductImage; title: string; eyebrow: string; description: string; notes: string[]; light: boolean; desktopCopyOnly: boolean };
export type ProductFeature = Partial<ProductFeatureItem> & { kind: "full" | "split" | "background" | "carousel" | "columns" | "story"; reverse?: boolean; video?: string | null; items?: ProductFeatureItem[] };
export type ProductSummary = { id: string; slug: string; category: string; group: string; groupName: string; name: string; model: string; family: string; kind: "family" | "model"; source: string; thumbnail: string; dataPath: string };
export type LGProduct = ProductSummary & { subtitle: string; imagePresentation?: "feature"; gallery: ProductImage[]; highlights: string[]; features: ProductFeature[]; lineupHtml: string; specifications: { label: string; value: string }[]; documents: { title: string; url: string }[] };
export type CatalogGroup = { category: string; slug: string; name: string; consultation: boolean; sources: string[]; productIds: string[] };

export const lgProducts = rawCatalog.products as ProductSummary[];
export const catalogGroups = (rawCatalog.groups as CatalogGroup[]).filter((group) =>
  businessCategories.some((category) => category.slug === group.category &&
    category.products.some((product) => product.slug === group.slug)),
);
export const productAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const groupPath = (category: string, group: string) => `/business/${category}/${group}`;
export const productPath = (product: ProductSummary | string) => {
  const summary = typeof product === "string" ? lgProducts.find((item) => item.slug === product) : product;
  return summary ? `${groupPath(summary.category, summary.group)}/${summary.slug}` : "/business/air-conditioner/ehp";
};
export const categoryLabel = (slug: string) => businessCategories.find((category) => category.slug === slug)?.name ?? slug;
export const productsInGroup = (category: string, group: string) => lgProducts.filter((product) => product.category === category && product.group === group);
export const technicalPortal = "https://kr.lgeaircon.com/gcac.common.index.dev";
const detailCache = new Map<string, Promise<LGProduct>>();
export function loadProductDetail(product: ProductSummary) {
  let pending = detailCache.get(product.id);
  if (!pending) {
    pending = fetch(productAsset(product.dataPath)).then((response) => {
      if (!response.ok) throw new Error("제품 정보를 불러오지 못했습니다.");
      return response.json() as Promise<LGProduct>;
    }).catch((error) => { detailCache.delete(product.id); throw error; });
    detailCache.set(product.id, pending);
  }
  return pending;
}
