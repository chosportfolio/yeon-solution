type BusinessProduct = { slug: string; name: string; note?: string; path?: string };
type BusinessCategory = { slug: string; name: string; description: string; products: BusinessProduct[] };

const businessDefinitions: BusinessCategory[] = [
  {
    slug: "hvac",
    name: "중앙공조",
    description: "대형 건물과 산업시설에 맞춘 공조 솔루션",
    products: [
      { slug: "absorption", name: "흡수식 냉온수기" },
      { slug: "turbo", name: "터보냉동기" },
      { slug: "screw", name: "스크류냉동기" },
      { slug: "inverter-scroll", name: "인버터스크롤칠러" },
      { slug: "fan-coil", name: "휀코일유니트" },
      { slug: "ahu", name: "AHU", note: "일반형 · DX Type · 특수형" },
    ],
  },
  {
    slug: "air-conditioner",
    name: "시스템에어컨",
    description: "주거·상업 공간에 맞춘 LG전자 냉난방 솔루션",
    products: [
      { slug: "ghp", name: "GHP" },
      { slug: "ehp", name: "EHP", path: "/business/air-conditioner/ehp" },
      { slug: "residential", name: "주거용 시스템에어컨" },
      { slug: "doas", name: "DOAS" },
      { slug: "boiler", name: "시스템보일러" },
      { slug: "erv", name: "ERV", note: "전열교환기" },
    ],
  },
  {
    slug: "appliance",
    name: "B2B 가전",
    description: "비즈니스 공간의 편리함을 높이는 LG전자 가전",
    products: [
      { slug: "refrigerator", name: "냉장고" },
      { slug: "freezer", name: "냉동고" },
      { slug: "dishwasher", name: "식기세척기" },
      { slug: "induction", name: "인덕션" },
      { slug: "washer", name: "세탁기" },
      { slug: "dryer", name: "건조기" },
      { slug: "oven", name: "광파오븐" },
      { slug: "tv", name: "TV" },
      { slug: "vacuum", name: "청소기" },
    ],
  },
];

export const businessCategories = businessDefinitions.map((category) => ({
  ...category,
  products: category.products.map((product) => ({
    ...product,
    path: `/business/${category.slug}/${product.slug}`,
  })),
}));
