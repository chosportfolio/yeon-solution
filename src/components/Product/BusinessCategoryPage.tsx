import { useEffect } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { businessCategories } from "../../data/business";
import { productAsset, productsInGroup } from "../../data/products";
import centralAir from "../../assets/business-hvac.png";
import systemAir from "../../assets/business-air.png";
import appliances from "../../assets/business-appliance.png";
import "./BusinessCategoryPage.css";

const images: Record<string, string> = {
  hvac: centralAir,
  "air-conditioner": systemAir,
  appliance: appliances,
};

export default function BusinessCategoryPage() {
  const { category: slug } = useParams();
  const { hash } = useLocation();
  const category = businessCategories.find((item) => item.slug === slug);

  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView({ block: "center", behavior: "instant" });
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug, hash]);

  if (!category) return <Navigate to="/" replace />;
  const products = category.products.map((product) => ({
    ...product,
    thumbnail: productsInGroup(category.slug, product.slug)[0]?.thumbnail,
  }));
  const catalogProducts = products.filter((product) => product.thumbnail);
  const consultationProducts = products.filter((product) => !product.thumbnail);

  return (
    <article className="business-category">
      <nav className="business-category-breadcrumb" aria-label="현재 위치">
        <Link to="/">홈</Link><span aria-hidden="true">›</span><strong>{category.name}</strong>
      </nav>
      <div className="business-category-intro">
        <div><p>BUSINESS AREA</p><h1>{category.name}</h1><span>{category.description}</span></div>
        <img src={images[category.slug]} alt={`${category.name} 적용 공간`} />
      </div>
      <section className="business-category-products" aria-labelledby="business-products-title">
        <div className="business-category-heading">
          <h2 id="business-products-title">제품 안내</h2>
          <p>품목을 선택하면 제품 정보를 확인할 수 있습니다.</p>
        </div>
        <div className="business-category-grid">
          {catalogProducts.map((product) => (
            <Link className={`business-category-product${hash === `#${product.slug}` ? " is-selected" : ""}`} to={product.path} id={product.slug} key={product.slug}>
              <div className="business-category-product-image">
                <img src={productAsset(product.thumbnail)} alt="" width="320" height="220" loading="lazy" />
              </div>
              <div className="business-category-product-copy">
                <div><h3>{product.name}</h3>{product.note && <p>{product.note}</p>}</div>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {consultationProducts.length > 0 && <section className="business-category-consultation" aria-labelledby="business-consultation-title">
        <div><h2 id="business-consultation-title">현장 맞춤 설비</h2><p>현장 조건에 맞춰 구성하는 공조 설비</p></div>
        <div className="business-category-consultation-links">{consultationProducts.map((product) => (
          <Link className={hash === `#${product.slug}` ? "is-selected" : undefined} to={product.path} id={product.slug} key={product.slug}>
            <h3>{product.name}</h3><span>상담 안내 <b aria-hidden="true">→</b></span>
          </Link>
        ))}</div>
      </section>}
    </article>
  );
}
