import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { lgProducts, productAsset, productPath, technicalPortal, categoryLabel, groupPath, productsInGroup, loadProductDetail } from "../../data/products";
import type { LGProduct, ProductFeature, ProductFeatureItem, ProductImage, ProductSummary } from "../../data/products";
import "./ProductDetailPage.css";

function ProductPicture({ image, className = "" }: { image: ProductImage; className?: string }) {
  return (
    <picture className={className}>
      {image.mobile && <source media="(max-width: 760px)" srcSet={productAsset(image.mobile)} width={image.mobileWidth} height={image.mobileHeight} />}
      <img src={productAsset(image.src)} alt={image.alt} width={image.width} height={image.height} loading="lazy" />
    </picture>
  );
}

// The importer allowlists these small static text fragments and the lineup
// tables. No remote HTML, scripts, event handlers or forms are rendered here.
function FeatureCopy({ feature }: { feature: Partial<ProductFeatureItem> }) {
  return (
    <div className={`product-feature-copy${feature.light ? " is-light" : ""}${feature.desktopCopyOnly ? " is-desktop-copy" : ""}`}>
      {feature.eyebrow && <p className="product-feature-eyebrow">{feature.eyebrow}</p>}
      {feature.title && <h2 dangerouslySetInnerHTML={{ __html: feature.title }} />}
      {feature.description && <div className="product-feature-description" dangerouslySetInnerHTML={{ __html: feature.description }} />}
      {feature.notes && feature.notes.length > 0 && <div className="product-feature-notes">{feature.notes.map((note, index) => <p key={index} dangerouslySetInnerHTML={{ __html: note }} />)}</div>}
    </div>
  );
}

function FeatureCarousel({ items }: { items: ProductFeatureItem[] }) {
  const [index, setIndex] = useState(0);
  const active = items[index];
  return (
    <section className="product-feature-carousel" aria-roledescription="캐러셀" aria-label="제품 세부 기술">
      <div className="product-feature-carousel-slide">
        <ProductPicture image={active.image} />
        <FeatureCopy feature={active} />
      </div>
      <div className="product-feature-carousel-controls">
        <button type="button" aria-label="이전 기술 보기" onClick={() => setIndex((index + items.length - 1) % items.length)}>←</button>
        <span aria-live="polite">{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
        <button type="button" aria-label="다음 기술 보기" onClick={() => setIndex((index + 1) % items.length)}>→</button>
      </div>
    </section>
  );
}

function FeatureSection({ feature }: { feature: ProductFeature }) {
  if (feature.kind === "carousel" && feature.items) return <FeatureCarousel items={feature.items} />;
  if (feature.kind === "columns" && feature.items) return (
    <section className={`product-feature-columns${feature.items.every((item) => item.light) ? " is-light" : ""}`}>
      {feature.items.map((item, index) => <div key={index}><ProductPicture image={item.image} /><FeatureCopy feature={item} /></div>)}
    </section>
  );
  if (!feature.image) return null;
  return (
    <section className={`product-feature-section product-feature-section--${feature.kind}${feature.reverse ? " is-reverse" : ""}${feature.light ? " is-light" : ""}${feature.title ? " has-copy" : ""}`}>
      {feature.video ? <a href={feature.video} target="_blank" rel="noopener noreferrer" className="product-feature-video" aria-label="제품 소개 영상 새 창에서 보기"><ProductPicture image={feature.image} /><span className="product-feature-play" aria-hidden="true">▶</span></a> : <ProductPicture image={feature.image} />}
      {(feature.title || feature.description || feature.notes?.length) ? <FeatureCopy feature={feature} /> : null}
    </section>
  );
}

function ProductDetailContent({ product }: { product: LGProduct }) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLElement>(null);
  const currentImage = product.gallery[galleryIndex];
  const galleryCount = product.gallery.length;
  const highlights = Array.from(new Set(product.highlights));
  const tabs = ["특장점", product.kind === "model" ? "제품 스펙" : "제품 라인업", "기술자료 다운로드"];
  const groupProducts = productsInGroup(product.category, product.group);
  const relatedProducts = groupProducts.length > 12 ? groupProducts.filter((item) => item.family === product.family) : groupProducts;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    selectorRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center", behavior: "instant" });
    const previousTitle = document.title;
    document.title = `${product.name} | ${categoryLabel(product.category)} | 연솔루션`;
    return () => { document.title = previousTitle; };
  }, [product.name, product.category]);

  const changeTab = (index: number) => {
    setTabIndex(index);
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    }));
  };

  return (
    <article className="product-detail">
      <nav className="product-breadcrumb" aria-label="현재 위치">
        <Link to="/">홈</Link><span aria-hidden="true">›</span>
        <Link to={`/business/${product.category}`}>{categoryLabel(product.category)}</Link><span aria-hidden="true">›</span>
        <Link to={groupPath(product.category, product.group)}>{product.groupName}</Link><span aria-hidden="true">›</span><strong>{product.name}</strong>
      </nav>

      <div className="product-group-heading"><span>{product.family}</span><Link to={groupPath(product.category, product.group)}>{product.groupName} 전체 제품 <span aria-hidden="true">↗</span></Link></div>
      <nav className="product-selector" aria-label={`${product.groupName} 제품 선택`} ref={selectorRef}>
        {relatedProducts.map((item) => (
          <Link to={productPath(item)} key={item.id} aria-current={item.id === product.id ? "page" : undefined}>
            <img src={productAsset(item.thumbnail)} alt="" width="80" height="70" />
            <span>{item.name}</span><small>{item.family}</small>
          </Link>
        ))}
      </nav>

      <section className="product-hero" aria-labelledby="product-title">
        {product.subtitle && <p>{product.subtitle}</p>}
        <h1 id="product-title">{product.name}</h1>
        <div className="product-gallery" aria-roledescription="캐러셀" aria-label={`${product.name} 제품 사진`}>
          <img className="product-gallery-image" src={productAsset(currentImage.src)} alt={currentImage.alt} width={currentImage.width} height={currentImage.height} fetchPriority="high" />
          {galleryCount > 1 && <>
            <button type="button" className="product-gallery-prev" aria-label="이전 제품 사진" onClick={() => setGalleryIndex((galleryIndex + galleryCount - 1) % galleryCount)}>‹</button>
            <button type="button" className="product-gallery-next" aria-label="다음 제품 사진" onClick={() => setGalleryIndex((galleryIndex + 1) % galleryCount)}>›</button>
          </>}
        </div>
        {product.imagePresentation === "feature" && <p className="product-gallery-caption">제조사 제품 소개 자료</p>}
        {galleryCount > 1 && <div className="product-gallery-dots" aria-label="제품 사진 선택">
          {product.gallery.map((image, index) => <button type="button" key={image.src} aria-label={`${index + 1}번 제품 사진`} aria-pressed={index === galleryIndex} onClick={() => setGalleryIndex(index)} />)}
        </div>}
      </section>

      <div className="product-overview">
        <h2>주요 특장점</h2>
        <ul>{highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
        <div className="product-model-row"><p>모델명 <strong>{product.name}</strong></p><a className="product-quote" href="tel:0312335559">제품 상담 문의 <span aria-hidden="true">↗</span></a></div>
      </div>

      <div className="product-tab-wrap" ref={tabsRef}>
        <div className="product-tabs" role="tablist" aria-label="제품 상세 정보">
          {tabs.map((tab, index) => <button
            type="button" key={tab} id={`product-tab-${index}`} role="tab" aria-selected={tabIndex === index}
            aria-controls="product-tabpanel" tabIndex={tabIndex === index ? 0 : -1}
            onClick={() => changeTab(index)}
            onKeyDown={(event) => {
              let next: number | undefined;
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
              if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
              if (event.key === "Home") next = 0;
              if (event.key === "End") next = tabs.length - 1;
              if (next !== undefined) {
                event.preventDefault(); changeTab(next);
                tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
              }
            }}
          ><span className="product-tab-icon" aria-hidden="true">{["◇", "▤", "↓"][index]}</span>{tab}</button>)}
        </div>
      </div>

      <div id="product-tabpanel" role="tabpanel" aria-labelledby={`product-tab-${tabIndex}`} tabIndex={0} className="product-tabpanel">
        {tabIndex === 0 && <div className="product-features">{product.features.length ? product.features.map((feature, index) => <FeatureSection feature={feature} key={index} />) : <section className="product-factual-summary"><h2>{product.name}</h2><dl>{product.specifications.slice(0, 8).map((spec, index) => <div key={`${spec.label}-${index}`}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></section>}</div>}
        {tabIndex === 1 && <section className="product-lineup">
          <div className="product-panel-heading"><p>{product.kind === "model" ? "SPECIFICATIONS" : "PRODUCT LINEUP"}</p><h2>{product.name} {tabs[1]}</h2><span>제품 구성과 주요 사양을 확인하세요.</span></div>
          <p className="product-table-hint">표가 넓은 경우 좌우로 밀어서 확인할 수 있습니다.</p>
          {product.lineupHtml ? <div className="product-lineup-content" dangerouslySetInnerHTML={{ __html: product.lineupHtml.replaceAll('src="images/', `src="${import.meta.env.BASE_URL}images/`) }} /> : <div className="product-lineup-reference"><h3>{product.name} 제품 구성</h3><ul>{highlights.map((item) => <li key={item}>{item}</li>)}</ul><p>세부 모델과 설계 조건은 제조사의 최신 기술자료에서 확인할 수 있습니다.</p><a href={product.source} target="_blank" rel="noopener noreferrer">공식 제품 정보 확인 ↗</a></div>}
        </section>}
        {tabIndex === 2 && <section className="product-documents">
          <div className="product-panel-heading"><p>TECHNICAL DOCUMENTS</p><h2>제품 기술자료</h2><span>{product.name}의 카탈로그와 설계·설치 자료를 확인하세요.</span></div>
          <div className="product-document-list">
            {product.category !== "appliance" && <a href={technicalPortal} target="_blank" rel="noopener noreferrer"><div><h3>LG 시스템에어컨 기술자료</h3><p>제품 데이터북 · 매뉴얼 · CAD · 인증서</p></div><span aria-hidden="true">↗</span></a>}
            {product.documents.map((document) => <a href={document.url} key={document.url} target="_blank" rel="noopener noreferrer"><div><h3>{document.title}</h3><p>제조사 공식 제품 자료</p></div><span aria-hidden="true">↗</span></a>)}
            <a href="https://www.lge.co.kr/kr/business/contents/support/catalog-download.do" target="_blank" rel="noopener noreferrer"><div><h3>LG전자 B2B 카탈로그</h3><p>제품군별 공식 카탈로그</p></div><span aria-hidden="true">↗</span></a>
            <a href={product.source} target="_blank" rel="noopener noreferrer"><div><h3>{product.name} 공식 제품 정보</h3><p>LG전자 B2B에서 제품 정보 확인</p></div><span aria-hidden="true">↗</span></a>
          </div>
        </section>}
      </div>

      <div className="product-disclaimer"><p>제품 이미지와 사양은 제조사 자료 기준이며, 제품 개선에 따라 변경될 수 있습니다.</p><p>기능의 적용 모델·별도 구매 사항·시험 조건은 각 제품 설명과 최신 기술자료를 확인해 주세요.</p></div>
      <section className="product-contact">
        <div><p>YEON SOLUTION</p><h2>공간에 맞는 제품, 연솔루션과 상담하세요.</h2></div>
        <a href="tel:0312335559">031-233-5559 <span aria-hidden="true">↗</span></a>
      </section>
    </article>
  );
}

function ProductDetailLoader({ summary }: { summary: ProductSummary }) {
  const [product, setProduct] = useState<LGProduct>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadProductDetail(summary).then((detail) => { if (!cancelled) setProduct(detail); }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [summary]);
  if (error) return <div className="product-load-state" role="alert"><p>제품 정보를 불러오지 못했습니다.</p><button type="button" onClick={() => window.location.reload()}>다시 불러오기</button></div>;
  if (!product) return <div className="product-load-state" role="status">제품 정보를 불러오고 있습니다.</div>;
  return <ProductDetailContent product={product} />;
}

export default function ProductDetailPage() {
  const { category = "air-conditioner", group = "ehp", productSlug = "multiv_i" } = useParams();
  const product = lgProducts.find((item) => item.slug === productSlug && item.category === category && item.group === group);
  if (!product) return <Navigate to={groupPath(category, group)} replace />;
  return <ProductDetailLoader key={product.id} summary={product} />;
}
