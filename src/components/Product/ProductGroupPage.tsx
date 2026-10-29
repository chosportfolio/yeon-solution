import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { catalogGroups, categoryLabel, groupPath, productAsset, productPath, productsInGroup } from "../../data/products";
import type { CatalogGroup } from "../../data/products";
import "./ProductGroupPage.css";

const consultationContent: Record<string, { description: string; points: string[]; requirements: string[] }> = {
  "cooling-tower": {
    description: "건물의 냉방 시스템과 현장 조건을 함께 고려해 냉각탑의 설치와 연계 구성을 검토합니다.",
    points: ["냉동기·열원 설비와의 연계", "설치 위치와 배관 동선 검토", "운전 조건과 유지관리 계획"],
    requirements: ["건물 용도와 설치 위치", "연계 냉동기 및 기존 설비 정보", "요구 용량과 운전 시간", "현장 도면 또는 설비 사진"],
  },
  "temperature-humidity": {
    description: "공간에서 요구하는 온도·습도 조건과 설치 환경을 검토해 현장에 맞는 항온항습 설비 구성을 안내합니다.",
    points: ["공간별 요구 조건 확인", "기존 공조 설비와의 연계", "운전·점검 환경을 고려한 구성"],
    requirements: ["적용 공간의 용도와 면적", "목표 온도·습도 조건", "발열 부하와 운전 시간", "기존 설비 정보와 현장 도면"],
  },
};

function GroupContent({ group }: { group: CatalogGroup }) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const products = useMemo(() => productsInGroup(group.category, group.slug), [group.category, group.slug]);
  const families = Array.from(new Set(products.map((product) => product.family)));
  const normalized = query.trim().toLocaleLowerCase();
  const visible = products.filter((product) => (!family || product.family === family) && `${product.name} ${product.model} ${product.family}`.toLocaleLowerCase().includes(normalized));
  const consultation = consultationContent[group.slug];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const previousTitle = document.title;
    document.title = `${group.name} | ${categoryLabel(group.category)} | 연솔루션`;
    return () => { document.title = previousTitle; };
  }, [group.name, group.category]);

  return (
    <article className="product-group-page">
      <nav className="product-group-breadcrumb" aria-label="현재 위치"><Link to="/">홈</Link><span aria-hidden="true">›</span><Link to={`/business/${group.category}`}>{categoryLabel(group.category)}</Link><span aria-hidden="true">›</span><strong>{group.name}</strong></nav>
      <header className="product-group-intro"><p>{categoryLabel(group.category)}</p><h1>{group.name}</h1><span>{consultation ? consultation.description : `${group.name} 제품을 살펴보고 공간에 맞는 구성을 찾아보세요.`}</span></header>
      <nav className="product-group-nav" aria-label={`${categoryLabel(group.category)} 취급품목`}>
        {catalogGroups.filter((item) => item.category === group.category).map((item) => <Link key={item.slug} to={groupPath(item.category, item.slug)} aria-current={item.slug === group.slug ? "page" : undefined}>{item.name}</Link>)}
      </nav>

      {consultation ? <>
        <section className="product-consultation-overview" aria-labelledby="consultation-heading">
          <div><p>ENGINEERING SOLUTION</p><h2 id="consultation-heading">현장에 맞춘<br />설비 구성과 시공</h2></div>
          <ul>{consultation.points.map((point, index) => <li key={point}><span>{String(index + 1).padStart(2, "0")}</span><h3>{point}</h3></li>)}</ul>
        </section>
        <section className="product-consultation-requirements"><h2>상담 전 확인하면 좋은 정보</h2><div>{consultation.requirements.map((requirement) => <p key={requirement}>{requirement}</p>)}</div><span>제조사·모델·용량은 현장 조건에 맞춰 개별 제안합니다.</span></section>
        <div className="product-group-references"><a href="https://www.lge.co.kr/kr/business/product/cooling" target="_blank" rel="noopener noreferrer">LG전자 B2B 공조 시스템 ↗</a><a href="https://www.lge.co.kr/kr/business/contents/support/catalog-download.do" target="_blank" rel="noopener noreferrer">공조 제품 카탈로그 ↗</a></div>
      </> : <>
        <div className="product-group-toolbar"><p>전체 <strong>{products.length}</strong>개 제품<span aria-live="polite">{query || family ? ` · 검색 결과 ${visible.length}개` : ""}</span></p><label><span className="sr-only">모델명 또는 제품명 검색</span><input type="search" placeholder="제품명 또는 모델명 검색" value={query} onChange={(event) => setQuery(event.target.value)} /><span aria-hidden="true">⌕</span></label></div>
        {families.length > 1 && <div className="product-family-filters" aria-label="제품 종류"><button type="button" aria-pressed={!family} onClick={() => setFamily("")}>전체</button>{families.map((item) => <button type="button" key={item} aria-pressed={family === item} onClick={() => setFamily(item)}>{item}</button>)}</div>}
        {visible.length ? <div className="product-group-grid">{visible.map((product) => <Link to={productPath(product)} className="product-list-card" key={product.id}>
          <div className="product-list-card-image"><img src={productAsset(product.thumbnail)} alt="" width="280" height="280" loading="lazy" /></div><div className="product-list-card-copy"><p>{product.family}</p><h2>{product.name}</h2><span>제품 자세히 보기 <b aria-hidden="true">→</b></span></div>
        </Link>)}</div> : <div className="product-group-empty"><p>검색 조건에 맞는 제품이 없습니다.</p><button type="button" onClick={() => { setQuery(""); setFamily(""); }}>전체 제품 보기</button></div>}
      </>}
      <section className="product-group-contact"><div><p>YEON SOLUTION</p><h2>{group.name}, 전문가와 상담하세요.</h2></div><a href="tel:0312335559">031-233-5559 <span aria-hidden="true">↗</span></a></section>
    </article>
  );
}

export default function ProductGroupPage() {
  const { category, group: slug } = useParams();
  const group = catalogGroups.find((item) => item.category === category && item.slug === slug);
  if (!group) return <Navigate to={category ? `/business/${category}` : "/"} replace />;
  return <GroupContent key={`${category}/${slug}`} group={group} />;
}
