import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./ProductDetailPage.css";

const keyFeatures = [
  { number: "01", title: "스마트 운전", description: "공간과 운전 환경을 고려한 효율적인 제어" },
  { number: "02", title: "에너지 관리", description: "전력 사용량을 고려한 체계적인 에너지 관리" },
  { number: "03", title: "원격 관리", description: "운전 상태 확인과 편리한 시스템 관리" },
  { number: "04", title: "강력한 성능", description: "다양한 외부 환경에서도 안정적인 냉난방" },
];

const productFeatures = [
  { eyebrow: "SMART OPERATION", title: ["공간의 상황에 맞춘", "쾌적한 냉난방 운전"], description: "외부 환경과 실내 조건을 고려해 공간에 필요한 냉난방을 효율적으로 제공합니다.", tone: "blue" },
  { eyebrow: "ENERGY CARE", title: ["필요한 에너지만 사용하는", "효율적인 전력 관리"], description: "건물의 전력 사용 환경에 맞춰 에너지 낭비를 줄이고 운전 상태를 편리하게 확인할 수 있습니다.", tone: "green" },
  { eyebrow: "PERFORMANCE", title: ["혹한과 폭염에도 안정적인", "냉난방 성능"], description: "계절과 외기 조건 변화에도 안정적인 성능을 유지하도록 설계된 시스템입니다.", tone: "silver" },
];

const lineups = [
  { type: "단일", capacity: "8~12 HP", note: "소규모 상업 공간" },
  { type: "단일", capacity: "14~20 HP", note: "중형 상업·업무 공간" },
  { type: "단일", capacity: "22~24 HP", note: "대형 업무 공간" },
  { type: "조합", capacity: "26~48 HP", note: "중대형 빌딩" },
  { type: "조합", capacity: "50~68 HP", note: "대규모 복합 시설" },
  { type: "조합", capacity: "70~96 HP", note: "초대형 빌딩·시설" },
];

function ProductUnit() {
  return (
    <div className="product-unit" aria-label="제품 이미지 준비 중" role="img">
      <div className="product-unit-brand">LG</div>
      <div className="product-unit-fan"><i /></div>
      <div className="product-unit-fan"><i /></div>
      <div className="product-unit-grille" />
      <small>제품 이미지 준비 중</small>
    </div>
  );
}

export default function ProductDetailPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <article className="product-detail">
      <nav className="product-breadcrumb" aria-label="현재 위치">
        <Link to="/">홈</Link><span>›</span>
        <Link to="/business/cooling">냉난방 시스템</Link><span>›</span>
        <Link to="/business/cooling/building">중대형 빌딩 시스템</Link><span>›</span>
        <strong>멀티 V 실외기</strong>
      </nav>

      <section className="product-summary">
        <div className="product-summary-visual"><ProductUnit /></div>
        <div className="product-summary-copy">
          <p>AI 기반 통합 냉난방 솔루션</p>
          <h1>LG MULTI V i</h1>
          <span>빌딩의 공간과 운전 환경을 고려해 쾌적함과 에너지 효율을 함께 제공하는 시스템에어컨 실외기입니다.</span>
          <dl>
            <div><dt>제품 구분</dt><dd>중대형 빌딩 시스템</dd></div>
            <div><dt>모델명</dt><dd>LG MULTI V i</dd></div>
          </dl>
          <Link className="product-quote" to="/support">온라인 견적 문의 <b>→</b></Link>
        </div>
      </section>

      <section className="product-key-section">
        <div className="product-section-inner">
          <div className="product-section-heading"><p>KEY FEATURES</p><h2>주요 특장점</h2></div>
          <div className="product-key-list">
            {keyFeatures.map((feature) => (
              <div className="product-key-card" key={feature.number}>
                <span>{feature.number}</span><h3>{feature.title}</h3><p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav className="product-tabs" aria-label="제품 상세 메뉴">
        <a href="#features">특장점</a>
        <a href="#lineup">제품 라인업</a>
        <a href="#documents">기술자료</a>
      </nav>

      <section className="product-intro" id="features">
        <div>
          <p>LG MULTI V i</p>
          <h2>공간과 에너지를 생각한<br />빌딩 냉난방 솔루션</h2>
          <span>현장에 필요한 제품 이미지와 상세 설명은 제공 자료에 맞춰 교체할 수 있습니다.</span>
        </div>
      </section>

      <div className="product-feature-list">
        {productFeatures.map((feature, index) => (
          <section className={`product-feature${index % 2 ? " is-reverse" : ""}`} key={feature.eyebrow}>
            <div className={`product-feature-image product-feature-image--${feature.tone}`}><span>PRODUCT FEATURE IMAGE</span></div>
            <div className="product-feature-copy">
              <p>{feature.eyebrow}</p>
              <h2>{feature.title.map((line) => <span key={line}>{line}</span>)}</h2>
              <div /><strong>{feature.description}</strong>
            </div>
          </section>
        ))}
      </div>

      <section className="product-lineup" id="lineup">
        <div className="product-section-inner">
          <div className="product-section-heading">
            <p>PRODUCT LINEUP</p><h2>제품 라인업</h2><span>현장 규모와 필요한 용량에 따라 알맞은 구성을 제안합니다.</span>
          </div>
          <div className="product-lineup-table" role="table" aria-label="MULTI V i 제품 라인업">
            <div className="product-lineup-row is-head" role="row">
              <span role="columnheader">구성</span><span role="columnheader">용량</span><span role="columnheader">추천 공간</span>
            </div>
            {lineups.map((lineup) => (
              <div className="product-lineup-row" role="row" key={lineup.capacity}>
                <strong role="cell">{lineup.type}</strong><span role="cell">{lineup.capacity}</span><span role="cell">{lineup.note}</span>
              </div>
            ))}
          </div>
          <p className="product-notice">※ 실제 적용 모델과 사양은 현장 조건 및 제조사 자료에 따라 달라질 수 있습니다.</p>
        </div>
      </section>

      <section className="product-documents" id="documents">
        <div><p>TECHNICAL DOCUMENTS</p><h2>제품 자료가 필요하신가요?</h2><span>카탈로그와 기술자료는 자료를 받은 뒤 다운로드 방식으로 연결할 수 있습니다.</span></div>
        <button type="button" disabled>기술자료 준비 중</button>
      </section>

      <section className="product-contact-banner">
        <div><p>전문가 상담</p><h2>현장에 맞는 제품을 추천해 드립니다.</h2></div>
        <Link to="/support">견적 문의하기 <span>→</span></Link>
      </section>
    </article>
  );
}
