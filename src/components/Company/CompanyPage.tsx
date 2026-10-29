import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import companyLandscape from "../../assets/companybg2.jpg";
import spaceImage from "../../assets/hero-campus.png";
import overviewImage from "../../assets/company/company-overview.webp";
import ciImage from "../../assets/company/company-ci.webp";
import historyImage from "../../assets/company/company-history.webp";
import locationImage from "../../assets/company/company-location.webp";
import logo from "../../assets/logo.png";
import logoType from "../../assets/logo2.png";
import businessCertificate from "../../assets/사업자등록증사본.pdf";
import constructionCertificate from "../../assets/건설업 등록증.pdf";
import "./CompanyPage.css";

const companyMenus = [
  { key: "greeting", name: "인사말" },
  { key: "overview", name: "회사 개요" },
  { key: "ci", name: "CI 소개" },
  { key: "history", name: "연혁" },
  { key: "location", name: "오시는 길" },
] as const;

type CompanyPageKey = (typeof companyMenus)[number]["key"];
const companyHeroImages: Record<CompanyPageKey, string> = {
  greeting: companyLandscape,
  overview: overviewImage,
  ci: ciImage,
  history: historyImage,
  location: locationImage,
};

type IconName = "home" | "arrow" | "download" | "pin" | "phone" | "mail" | "copy";

const company = {
  name: "주식회사 연솔루션",
  representative: "조창연",
  openingDate: "2023년 5월 17일",
  businessNumber: "199-81-03077",
  address: "경기도 수원시 권선구 효원로 230, 201호 중앙빌딩(권선동)",
  phone: "031-233-5559",
  email: "cy6907@naver.com",
};

const isCompanyPageKey = (value: string | undefined): value is CompanyPageKey =>
  companyMenus.some((menu) => menu.key === value);

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10H3Z" /><path d="M9 20v-7h6v7" /></>,
    arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    phone: <path d="m7 3 3 5-3 3a15 15 0 0 0 6 6l3-3 5 3-1 4C11 22 2 13 3 4Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 6 9 7 9-7" /></>,
    copy: <><rect x="8" y="8" width="12" height="13" rx="1" /><path d="M16 8V3H3v13h5" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function SectionHeading({ eyebrow, children, description }: { eyebrow: string; children: ReactNode; description?: string }) {
  return (
    <div className="company-section-heading">
      <p className="company-kicker">{eyebrow}</p>
      <h2>{children}</h2>
      {description && <p className="company-section-description">{description}</p>}
    </div>
  );
}

function Greeting() {
  return (
    <>
      <SectionHeading eyebrow="BETTER SPACE, BETTER LIFE" description="고객의 일상과 비즈니스가 더 쾌적해지도록, 공간의 처음부터 함께합니다.">
        공간을 이해하고,<br /><em>사람을 생각합니다.</em>
      </SectionHeading>
      <div className="company-greeting">
        <figure className="company-greeting-visual">
          <img src={spaceImage} alt="쾌적한 공간의 가치를 표현하는 건축 이미지" />
          <figcaption><span>OUR COMMITMENT</span><strong>기술에 신뢰를 더해,<br />공간에 가치를 더합니다.</strong></figcaption>
        </figure>
        <div className="company-greeting-copy">
          <span className="company-red-rule" aria-hidden="true" />
          <h3>연솔루션을 찾아주신 여러분,<br />진심으로 환영합니다.</h3>
          <div className="company-greeting-text">
            <p>좋은 공간은 그 안에 머무는 사람으로부터 시작됩니다. 연솔루션은 고객의 공간과 환경을 깊이 이해하고, 현장에 적합한 냉난방·공조 솔루션을 제안합니다.</p>
            <p>LG전자 시스템에어컨부터 중앙공조, B2B 가전까지. 공간의 용도와 사용 환경을 고려한 설계와 시공으로 더 편안하고 쾌적한 일상을 만들어갑니다.</p>
            <p>설계부터 설치, 유지보수에 이르기까지 작은 약속도 소중히 여기겠습니다. 전문성을 바탕으로 성실하게 소통하고, 책임 있는 시공으로 고객의 신뢰에 보답하겠습니다.</p>
            <p>고객과 함께 더 나은 공간을 만들어가는 파트너,<br />연솔루션이 되겠습니다. 감사합니다.</p>
          </div>
          <p className="company-signature">{company.name} 대표이사 <strong>{company.representative}</strong></p>
        </div>
      </div>
      <div className="company-principles">
        {[
          ["01", "고객 중심", "공간의 쓰임과 고객의 요구를 먼저 살핍니다."],
          ["02", "전문 기술", "현장에 맞는 설계와 시공을 고민합니다."],
          ["03", "책임 있는 약속", "설치 이후의 관리까지 성실하게 함께합니다."],
        ].map(([number, title, text]) => (
          <div key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>
        ))}
      </div>
    </>
  );
}

function Overview() {
  const details = [
    ["회사명", company.name], ["대표이사", company.representative],
    ["개업일", company.openingDate], ["사업자등록번호", company.businessNumber],
    ["사업분야", "냉난방·공조 설계 및 시공, LG전자 B2B 가전"],
    ["소재지", company.address],
  ];
  return (
    <>
      <SectionHeading eyebrow="ABOUT YEON SOLUTION" description="공간에 대한 이해와 전문 기술로 고객에게 필요한 솔루션을 제안합니다.">
        더 쾌적한 일상,<br /><em>더 나은 비즈니스의 시작.</em>
      </SectionHeading>
      <div className="company-overview">
        <div className="company-overview-intro"><span>YEON<br />SOLUTION</span><h3>공간의 가능성을<br />함께 만들어갑니다.</h3><p>냉난방과 공조, 그리고 생활의 편리함까지.<br />연솔루션이 고객의 공간과 함께합니다.</p></div>
        <dl className="company-overview-list">
          {details.map(([term, description]) => <div key={term}><dt>{term}</dt><dd>{description}</dd></div>)}
          <div><dt>대표전화</dt><dd><a href={`tel:${company.phone}`}>{company.phone}</a></dd></div>
          <div><dt>이메일</dt><dd><a href={`mailto:${company.email}`}>{company.email}</a></dd></div>
        </dl>
      </div>
    </>
  );
}

function CiGuide() {
  return (
    <>
      <SectionHeading eyebrow="CORPORATE IDENTITY" description="연솔루션의 이름과 가치를 전하는 기업 아이덴티티를 소개합니다.">
        기술과 신뢰를 잇는 이름,<br /><em>YEON SOLUTION.</em>
      </SectionHeading>
      <div className="company-ci-grid">
        <div className="company-ci-panel"><div className="company-ci-panel-heading"><h3>심볼마크</h3><span>SYMBOL MARK</span></div><div className="company-ci-artwork"><img src={logo} alt="연솔루션 YS 심볼마크" /></div><a className="company-download" href={logo} download="YEON-SOLUTION-SYMBOL.png">심볼 다운로드 <Icon name="download" /></a></div>
        <div className="company-ci-panel"><div className="company-ci-panel-heading"><h3>로고타입</h3><span>LOGOTYPE</span></div><div className="company-ci-artwork company-ci-artwork--logotype"><img src={logoType} alt="YEON SOLUTION 로고타입" /></div><a className="company-download" href={logoType} download="YEON-SOLUTION-LOGO.png">로고 다운로드 <Icon name="download" /></a></div>
      </div>
      <div className="company-ci-note"><h3>로고 사용 안내</h3><p>기업 아이덴티티가 일관되게 전달되도록 로고 원본의 형태와 비율을 유지해 주세요. 로고 사용에 관한 문의는 <a href={`mailto:${company.email}`}>{company.email}</a>로 보내주시기 바랍니다.</p></div>
    </>
  );
}

function History() {
  const history = [
    { year: "2026", achievement: "매출 45억 원 돌파", outlook: "연매출 60억 원 돌파 예정" },
    { year: "2025", achievement: "연매출 약 25억 원 달성" },
    {
      year: "2024", achievement: "연매출 15억 원 돌파",
      milestone: {
        date: "02.15", title: "건설업 등록",
        description: <>기계설비·가스공사업 등록<br />주력분야: 기계설비공사</>,
        certificate: constructionCertificate, certificateLabel: "건설업등록증 보기",
      },
    },
    {
      year: "2023",
      milestone: {
        date: "05.17", title: "연솔루션의 시작",
        description: <>연솔루션 주식회사 개업<br />냉난방·공조 및 가전 사업의 첫걸음</>,
        certificate: businessCertificate, certificateLabel: "사업자등록증 보기",
      },
    },
  ];

  return (
    <>
      <SectionHeading eyebrow="OUR JOURNEY" description="하나의 약속에서 시작해, 기술과 신뢰를 차곡차곡 쌓아갑니다.">
        더 나은 공간을 향한<br /><em>연솔루션의 발자취.</em>
      </SectionHeading>
      <div className="company-history">
        <div className="company-history-visual"><img src={historyImage} alt="정돈된 건축 구조와 이어지는 보행 공간을 표현한 이미지" loading="lazy" /><div><span>BUILDING TRUST</span><strong>처음의 마음으로,<br />함께 나아가겠습니다.</strong></div></div>
        <ol className="company-history-list">
          {history.map((period) => (
            <li className="company-history-row" key={period.year}>
              <strong>{period.year}</strong>
              <div>
                {period.achievement && (
                  <div className="company-history-achievement">
                    <h3>{period.achievement}</h3>
                    {period.outlook && <p>{period.outlook}</p>}
                  </div>
                )}
                {period.milestone && (
                  <div className="company-history-milestone">
                    <span>{period.milestone.date}</span>
                    <h3>{period.milestone.title}</h3>
                    <p>{period.milestone.description}</p>
                    <a href={period.milestone.certificate} target="_blank" rel="noreferrer">
                      {period.milestone.certificateLabel} <Icon name="arrow" />
                    </a>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <p className="company-history-source">매출 이력은 회사 제공 정보 기준입니다. 2026년 매출 이력은 10월 기준이며, 연매출 60억 원은 예상치입니다.</p>
    </>
  );
}

function Location() {
  const [copyStatus, setCopyStatus] = useState("");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("경기도 수원시 권선구 효원로 230 중앙빌딩")}`;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(company.address);
      setCopyStatus("주소를 복사했습니다.");
    } catch {
      setCopyStatus("주소를 길게 누르거나 선택해 복사해 주세요.");
    }
  }

  return (
    <>
      <SectionHeading eyebrow="FIND US" description="공간에 대한 고민이 있다면, 연솔루션과 이야기를 나눠보세요.">
        더 나은 공간을 위한 만남,<br /><em>이곳에서 시작됩니다.</em>
      </SectionHeading>
      <div className="company-map">
        <iframe src="https://www.google.com/maps/embed?pb=!1m5!3m3!1m2!1s0x357b43428780d19f%3A0x284d93fe91f21f5!2z6rK96riw64-EIOyImOybkOyLnCDqtozshKDqtawg7Zqo7JuQ66GcIDIzMA!5e0!3m2!1sko!2skr!4v1790314677255!5m2!1sko!2skr" title="연솔루션 위치 · 경기도 수원시 권선구 효원로 230" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>
      <div className="company-location-details">
        <div className="company-location-address"><p className="company-kicker">YEON SOLUTION</p><h3>{company.name}</h3><p><Icon name="pin" />{company.address}</p><div className="company-location-actions"><a className="company-button company-button--red" href={mapsUrl} target="_blank" rel="noreferrer">지도에서 보기 <Icon name="arrow" /></a><button className="company-button" type="button" onClick={copyAddress}>주소 복사 <Icon name="copy" /></button></div><p className="company-copy-status" role="status">{copyStatus}</p></div>
        <dl className="company-location-info">
          <div><dt><Icon name="phone" />대표전화</dt><dd><a href={`tel:${company.phone}`}>{company.phone}</a></dd></div>
          <div><dt><Icon name="mail" />이메일</dt><dd><a href={`mailto:${company.email}`}>{company.email}</a></dd></div>
          <div><dt>상담시간</dt><dd>평일 09:00–18:00<small>점심 12:00–13:00 · 토·일·공휴일 휴무</small></dd></div>
        </dl>
      </div>
    </>
  );
}

const pageContents: Record<CompanyPageKey, ReactNode> = {
  greeting: <Greeting />, overview: <Overview />, ci: <CiGuide />, history: <History />, location: <Location />,
};

export default function CompanyPage() {
  const { page } = useParams();
  const selectedMenu = companyMenus.find((menu) => menu.key === page);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!selectedMenu) return;
    const previousTitle = document.title;
    document.title = `${selectedMenu.name} · 회사 소개 | 연솔루션`;
    return () => { document.title = previousTitle; };
  }, [selectedMenu]);

  if (!isCompanyPageKey(page) || !selectedMenu) return <Navigate to="/company/greeting" replace />;

  return (
    <div className={`company-page company-page--${page}`}>
      <section className="company-hero" aria-labelledby="company-title">
        <img className="company-hero-image" src={companyHeroImages[page]} alt="" fetchPriority="high" />
        <div className="company-hero-overlay" aria-hidden="true" />
        <div className="company-hero-inner"><p>ABOUT YEON SOLUTION</p><h1 id="company-title">회사 소개</h1><span>더 나은 공간을 만드는 기술과 신뢰</span></div>
      </section>
      <nav className="company-tabs" aria-label="회사 소개 메뉴"><div className="company-tabs-inner">
        {companyMenus.map((menu) => <Link aria-current={page === menu.key ? "page" : undefined} key={menu.key} to={`/company/${menu.key}`}>{menu.name}</Link>)}
      </div></nav>
      <section className="company-content" aria-labelledby="company-page-title">
        <div className="company-page-heading"><h2 id="company-page-title">{selectedMenu.name}</h2><nav className="company-breadcrumb" aria-label="현재 위치"><Link to="/" aria-label="홈"><Icon name="home" /></Link><span aria-hidden="true">›</span><Link to="/company">회사 소개</Link><span aria-hidden="true">›</span><span aria-current="page">{selectedMenu.name}</span></nav></div>
        <div key={page} className="company-page-body">{pageContents[page]}</div>
      </section>
      <aside className="company-contact"><div><p>LET’S CREATE A BETTER SPACE</p><h2>고객의 공간에, 가장 알맞은 솔루션.</h2><span>연솔루션과 함께 시작해 보세요.</span></div><a href={`tel:${company.phone}`} className="company-button">상담 문의 <Icon name="arrow" /></a></aside>
    </div>
  );
}
