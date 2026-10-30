import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { estimateBudgets, estimateIndustries, estimateProducts, estimateSchedules } from "../../data/estimateOptions";
import "./SupportPage.css";

type SupportPageProps = { page: "estimate" | "faq" };
type QuoteResult = { reference: string };

function ProductIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "air-conditioner" ? <><rect x="6" y="9" width="36" height="22" rx="3" /><path d="M11 24h26M13 16h4m14 0h4M16 35v4m8-4v7m8-7v4" /></>
      : kind === "hvac" ? <><rect x="7" y="7" width="34" height="34" rx="2" /><circle cx="24" cy="24" r="11" /><path d="M24 13v22M13 24h22M16 16l16 16m0-16L16 32" /><circle cx="24" cy="24" r="3" /></>
      : kind === "appliance" ? <><rect x="11" y="5" width="26" height="38" rx="2" /><path d="M11 19h26M17 11v3m0 11v7M15 43v2m18-2v2" /></>
      : <><path d="M9 39V9h21l9 9v21H9Z" /><path d="M29 9v10h10M16 25h15m-15 7h10M5 43h38" /></>}
  </svg>;
}

function Required() {
  return <span className="support-required" aria-label="필수">*</span>;
}

function QuoteForm() {
  const [product, setProduct] = useState(estimateProducts[0].id);
  const [customerType, setCustomerType] = useState("business");
  const [messageLength, setMessageLength] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [revision, setRevision] = useState(0);
  const token = useRef<string | null>(null);
  const submitting = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const currentProduct = estimateProducts.find(item => item.id === product)!;

  useEffect(() => {
    if (error || result) feedback.current?.focus();
  }, [error, result]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const fields = new FormData(event.currentTarget);
    const input = Object.fromEntries(fields);
    submitting.current = true;
    setSending(true);
    setError("");
    try {
      if (!token.current) {
        const response = await fetch("/api/support/quote-token", { cache: "no-store", signal: AbortSignal.timeout(15_000) });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.token) throw new Error(data?.error || "문의 서버에 연결할 수 없습니다. 대표전화 031-233-5559로 문의해 주세요.");
        token.current = data.token;
      }
      const response = await fetch("/api/support/estimate", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Quote-Token": token.current! },
        body: JSON.stringify({ ...input, product, customerType, quantity: Number(fields.get("quantity")), consent: fields.get("consent") === "on" }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.reference) {
        if (response.status === 403) token.current = null;
        throw new Error(data?.error || "전송 결과를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }
      setResult(data);
      token.current = null;
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TypeError" && cause.name !== "TimeoutError" ? cause.message : "서버 연결 또는 전송 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도하거나 대표전화로 문의해 주세요.");
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  if (result) return <div className="support-success" ref={feedback} tabIndex={-1} role="status">
    <span className="support-success-icon" aria-hidden="true">✓</span>
    <h2>견적 문의를 전송했습니다.</h2>
    <p>담당자가 내용을 확인한 후 입력하신 연락처로 안내해 드립니다.</p>
    <small>접수번호 <span>{result.reference}</span></small>
    <button type="button" className="support-button" onClick={() => { setResult(null); setMessageLength(0); setRevision(value => value + 1); }}>새 견적 문의 작성</button>
  </div>;

  return <form key={revision} className="support-form" onSubmit={submit} onChange={() => { setError(""); token.current = null; }}>
    <fieldset disabled={sending} className="support-form-fields">
      <section className="support-form-section" aria-labelledby="quote-product-title">
        <div className="support-section-heading"><h2 id="quote-product-title"><span>01</span>제품 정보</h2><p><Required /> 표시는 필수 입력 항목입니다.</p></div>
        <fieldset className="support-product-fieldset">
          <legend>관심 제품 <Required /></legend>
          <div className="support-product-options">
            {estimateProducts.map(item => <label key={item.id} className={product === item.id ? "is-selected" : ""}>
              <input type="radio" name="product" value={item.id} checked={product === item.id} onChange={() => setProduct(item.id)} />
              <ProductIcon kind={item.id} /><span>{item.name}</span><b aria-hidden="true">{product === item.id ? "✓" : "+"}</b>
            </label>)}
          </div>
        </fieldset>
        <div className="support-field-grid">
          <div className="support-field"><label htmlFor="quote-detail">상세 분류 <Required /></label><select id="quote-detail" name="detail" key={product} required defaultValue=""><option value="" disabled>상세 분류를 선택해 주세요</option>{currentProduct.details.map(item => <option key={item}>{item}</option>)}</select></div>
          <div className="support-field"><label htmlFor="quote-model">모델명 <small>선택</small></label><input id="quote-model" name="model" maxLength={100} placeholder="모르시면 비워 두셔도 됩니다" /></div>
          <div className="support-field support-field--half"><label htmlFor="quote-quantity">구매 수량 <Required /></label><div className="support-number"><input id="quote-quantity" name="quantity" type="number" min={1} max={9999} step={1} defaultValue={1} required /><span>대</span></div></div>
        </div>
      </section>

      <section className="support-form-section" aria-labelledby="quote-customer-title">
        <div className="support-section-heading"><h2 id="quote-customer-title"><span>02</span>고객 정보</h2><p>상담 안내를 받으실 정보를 입력해 주세요.</p></div>
        <fieldset className="support-customer-type"><legend>고객 구분 <Required /></legend><div>
          <label><input type="radio" name="customerType" value="business" checked={customerType === "business"} onChange={() => setCustomerType("business")} />기업 / 사업자</label>
          <label><input type="radio" name="customerType" value="individual" checked={customerType === "individual"} onChange={() => setCustomerType("individual")} />개인</label>
        </div></fieldset>
        <div className="support-field-grid">
          {customerType === "business" && <>
            <div className="support-field"><label htmlFor="quote-company">회사명 <Required /></label><input id="quote-company" name="company" autoComplete="organization" maxLength={100} required placeholder="회사명을 입력해 주세요" /></div>
            <div className="support-field"><label htmlFor="quote-business-number">사업자등록번호 <small>선택</small></label><input id="quote-business-number" name="businessNumber" inputMode="numeric" maxLength={12} pattern="[0-9]{3}-?[0-9]{2}-?[0-9]{5}" placeholder="000-00-00000" /></div>
          </>}
          <div className="support-field"><label htmlFor="quote-name">{customerType === "business" ? "담당자명" : "이름"} <Required /></label><input id="quote-name" name="name" autoComplete="name" maxLength={50} required placeholder="성함을 입력해 주세요" /></div>
          <div className="support-field"><label htmlFor="quote-phone">연락처 <Required /></label><input id="quote-phone" name="phone" type="tel" autoComplete="tel" maxLength={25} pattern={"0[0-9\\s\\-]{8,24}"} required placeholder="010-0000-0000" /></div>
          <div className="support-field support-field--full"><label htmlFor="quote-email">이메일 <Required /></label><input id="quote-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="example@company.com" /><p className="support-field-help">회신받으실 이메일 주소를 정확히 입력해 주세요.</p></div>
        </div>
      </section>

      <section className="support-form-section" aria-labelledby="quote-site-title">
        <div className="support-section-heading"><h2 id="quote-site-title"><span>03</span>설치 현장 및 문의 내용</h2></div>
        <div className="support-field-grid">
          <div className="support-field"><label htmlFor="quote-industry">설치 장소 <small>선택</small></label><select id="quote-industry" name="industry" defaultValue=""><option value="">설치 장소를 선택해 주세요</option>{estimateIndustries.map(item => <option key={item}>{item}</option>)}</select></div>
          <div className="support-field"><label htmlFor="quote-schedule">구매 시기</label><select id="quote-schedule" name="schedule">{estimateSchedules.map(item => <option key={item}>{item}</option>)}</select></div>
          <div className="support-field support-field--full"><label htmlFor="quote-address">설치 현장 주소 <Required /></label><input id="quote-address" name="address" maxLength={250} required placeholder="시·군·구, 도로명과 상세 주소를 입력해 주세요" /></div>
          <div className="support-field support-field--half"><label htmlFor="quote-budget">예상 예산</label><select id="quote-budget" name="budget">{estimateBudgets.map(item => <option key={item}>{item}</option>)}</select></div>
          <div className="support-field support-field--full"><label htmlFor="quote-message">문의 내용 <Required /></label><textarea id="quote-message" name="message" rows={6} maxLength={5000} required onChange={event => setMessageLength(event.target.value.length)} placeholder="설치 면적, 공간 용도, 희망 제품과 수량 등 상담에 필요한 내용을 남겨 주세요." /><div className="support-textarea-caption"><p>제품을 결정하지 못하셨다면 현장 상황을 알려 주세요.</p><span>{messageLength.toLocaleString()} / 5,000</span></div></div>
        </div>
      </section>

      <section className="support-consent" aria-labelledby="quote-consent-title">
        <h2 id="quote-consent-title">개인정보 수집 및 이용 동의</h2>
        <details><summary>견적 상담을 위한 개인정보 수집 및 이용 안내 <span>내용 보기</span></summary><div>
          <dl><div><dt>수집·이용 주체</dt><dd>주식회사 연솔루션</dd></div><div><dt>수집·이용 목적</dt><dd>견적 문의 확인, 제품·설치 상담 및 회신</dd></div><div><dt>수집 항목</dt><dd>이름, 연락처, 이메일, 설치 현장 주소, 문의 내용 및 직접 입력한 회사·제품·현장 정보</dd></div><div><dt>보유·이용 기간</dt><dd>견적 상담 목적 달성 시까지</dd></div></dl>
          <p>동의를 거부하실 수 있으며, 동의하지 않으시면 온라인 견적 문의를 이용하실 수 없습니다. 입력하신 내용은 연솔루션 담당자의 이메일로 전달됩니다.</p>
        </div></details>
        <label className="support-checkbox"><input type="checkbox" name="consent" required /><span><b>[필수]</b> 개인정보 수집 및 이용에 동의합니다.</span></label>
      </section>
      <div className="support-honeypot" aria-hidden="true"><label htmlFor="quote-website">웹사이트</label><input id="quote-website" name="website" tabIndex={-1} autoComplete="off" /></div>
    </fieldset>
    {error && <div className="support-error" ref={feedback} tabIndex={-1} role="alert">{error}</div>}
    <div className="support-submit"><p>입력하신 내용을 확인하신 후 전송해 주세요.</p><button className="support-button" type="submit" disabled={sending}>{sending ? "문의 내용을 전송하고 있습니다…" : "견적 문의 전송"}<span aria-hidden="true">{sending ? "" : "→"}</span></button></div>
  </form>;
}

const faqs = [
  { category: "견적 상담", question: "제품이나 모델명을 몰라도 견적 문의를 할 수 있나요?", answer: "네. 관심 제품에서 제품군을 선택하고 상세 분류를 ‘상담 후 결정’으로 선택해 주세요. 모델명은 비워 두셔도 됩니다. 설치 장소와 공간 용도, 필요한 내용을 남겨 주시면 제품 선정부터 상담해 드립니다." },
  { category: "견적 상담", question: "견적 문의 시 어떤 정보를 준비하면 되나요?", answer: "설치할 현장 주소, 공간 용도와 면적, 희망 제품과 수량, 구매 시기를 알려 주시면 상담에 도움이 됩니다. 정해지지 않은 항목은 ‘상담 후 결정’으로 선택하고 문의 내용에 현장 상황을 적어 주세요." },
  { category: "견적 상담", question: "기업이나 사업자가 아닌 개인도 문의할 수 있나요?", answer: "네. 견적 문의에서 고객 구분을 ‘개인’으로 선택하면 회사명과 사업자등록번호 없이 문의하실 수 있습니다. 주거 공간의 시스템에어컨 등 필요한 제품과 설치 환경을 남겨 주세요." },
  { category: "설계 · 시공", question: "제품 선정과 설치 설계도 함께 상담할 수 있나요?", answer: "연솔루션은 시스템에어컨, 냉난방·공조 설비 및 B2B 가전의 제품 선정과 설계·시공에 관한 상담을 진행합니다. 관심 제품에서 ‘설계 · 시공 상담’을 선택하고 필요한 내용을 남겨 주세요." },
  { category: "설계 · 시공", question: "온라인 문의만으로 최종 견적이 확정되나요?", answer: "제품 사양과 수량뿐 아니라 설치 환경, 배관 및 전기 공사 등 현장 조건에 따라 견적이 달라질 수 있습니다. 담당자와 세부 사항을 확인한 후 견적을 안내해 드립니다." },
  { category: "이용 안내", question: "전송한 문의에 내용을 추가하거나 수정하고 싶어요.", answer: "대표전화 031-233-5559 또는 cy6907@naver.com으로 연락해 주세요. 문의하신 성함과 연락처, 전송 완료 화면의 접수번호를 함께 알려 주시면 확인에 도움이 됩니다." },
  { category: "이용 안내", question: "전화 상담은 언제 가능한가요?", answer: "평일 09:00~18:00에 상담하실 수 있으며, 점심시간은 12:00~13:00입니다. 토요일·일요일·공휴일은 휴무입니다. 온라인 견적 문의는 상담 시간과 관계없이 작성하실 수 있습니다." },
];

function Faq() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const filtered = faqs.filter(item => (category === "전체" || item.category === category) && `${item.question} ${item.answer}`.includes(query.trim()));
  return <section className="support-faq" aria-label="자주 묻는 질문 목록">
    <form className="support-faq-search" role="search" onSubmit={event => event.preventDefault()}><label htmlFor="faq-query">궁금한 내용을 찾아보세요.</label><div><input id="faq-query" value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="검색어를 입력해 주세요" /><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg></div></form>
    <div className="support-faq-filters" aria-label="질문 분류">{["전체", "견적 상담", "설계 · 시공", "이용 안내"].map(item => <button type="button" key={item} aria-pressed={item === category} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <p className="support-faq-count" role="status">총 <strong>{filtered.length}</strong>개의 질문</p>
    <div className="support-faq-list">{filtered.length ? filtered.map(item => <details key={item.question}><summary><span className="support-faq-q" aria-hidden="true">Q</span><span className="support-faq-category">{item.category}</span><h2>{item.question}</h2><span className="support-faq-toggle" aria-hidden="true" /></summary><div className="support-faq-answer"><b aria-hidden="true">A</b><p>{item.answer}</p></div></details>) : <div className="support-faq-empty"><h2>검색 결과가 없습니다.</h2><p>다른 검색어를 입력하거나 아래 견적 문의를 이용해 주세요.</p><button type="button" onClick={() => { setQuery(""); setCategory("전체"); }}>전체 질문 보기</button></div>}</div>
    <div className="support-faq-contact"><div><h2>찾으시는 답변이 없으신가요?</h2><p>현장에 맞는 제품과 견적을 상담해 드립니다.</p></div><Link to="/support/estimate">견적 문의하기 <span aria-hidden="true">→</span></Link></div>
  </section>;
}

export default function SupportPage({ page }: SupportPageProps) {
  const title = page === "faq" ? "자주 묻는 질문" : "견적 문의";
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const previousTitle = document.title;
    document.title = `${title} | 연솔루션`;
    return () => { document.title = previousTitle; };
  }, [title]);

  return <article className="support-page">
    <div className="support-container">
      <nav className="support-breadcrumb" aria-label="현재 위치"><Link to="/">홈</Link><span aria-hidden="true">›</span><Link to="/support">고객 지원</Link><span aria-hidden="true">›</span><strong aria-current="page">{title}</strong></nav>
      <header className="support-heading"><p>CUSTOMER SUPPORT</p><h1>{title}</h1><div>{page === "faq" ? "제품과 견적 상담에 관한 궁금한 점을 확인해 보세요." : <>공간에 맞는 솔루션, 연솔루션이 함께 찾겠습니다.<br />간단한 정보를 남겨 주시면 담당자가 상담을 도와드립니다.</>}</div></header>
      <nav className="support-tabs" aria-label="고객 지원 메뉴"><Link to="/support/estimate" aria-current={page === "estimate" ? "page" : undefined}>견적 문의</Link><Link to="/support/faq" aria-current={page === "faq" ? "page" : undefined}>자주 묻는 질문</Link></nav>
      {page === "estimate" ? <div className="support-quote-layout"><div className="support-quote-main"><QuoteForm /></div><aside className="support-aside"><p>견적 상담 안내</p><h2>더 편한 방법으로<br />문의해 주세요.</h2><a className="support-aside-phone" href="tel:0312335559">031-233-5559 <span aria-hidden="true">↗</span></a><dl><div><dt>상담시간</dt><dd>평일 09:00–18:00</dd></div><div><dt>점심시간</dt><dd>12:00–13:00</dd></div></dl><small>토요일·일요일·공휴일 휴무</small><Link to="/support/faq">자주 묻는 질문 <span aria-hidden="true">→</span></Link></aside></div> : <Faq />}
    </div>
  </article>;
}
