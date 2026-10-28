import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import companyBg2 from "../../assets/companybg2.jpg";
import logo from "../../assets/logo.png";
import "./CompanyPage.css";

const companyMenus = [
  { key: "greeting", name: "인사말" },
  { key: "overview", name: "개요" },
  { key: "ci", name: "CI" },
  { key: "history", name: "연혁" },
  { key: "location", name: "오시는 길" },
] as const;

type CompanyPageKey = (typeof companyMenus)[number]["key"];

const isCompanyPageKey = (value: string | undefined): value is CompanyPageKey =>
  companyMenus.some((menu) => menu.key === value);

function Greeting() {
  return (
    <div className="company-greeting">
      <div className="company-greeting-visual" aria-hidden="true">
        <span>YEON SOLUTION</span>
        <strong>공간을 이해하는<br />공조 솔루션</strong>
      </div>

      <div className="company-greeting-copy">
        <p className="company-kicker">CEO MESSAGE</p>
        <h2>
          기술과 신뢰를 바탕으로<br />
          더 나은 공간을 만들겠습니다.
        </h2>
        <div className="company-greeting-text">
          <p>
            연솔루션은 고객의 공간과 환경을 깊이 이해하고, 현장에 가장
            적합한 냉난방 및 공조 솔루션을 제안합니다.
          </p>
          <p>
            설계부터 시공, 유지보수까지 모든 과정에서 책임감을 가지고
            신뢰할 수 있는 서비스를 제공하겠습니다. 이 영역에는 추후 실제
            대표 인사말을 입력해 주세요.
          </p>
        </div>
        <p className="company-signature">
          주식회사 연솔루션 대표이사 <strong>대표자명</strong>
        </p>
      </div>
    </div>
  );
}

function Overview() {
  const details = [
    ["회사명", "주식회사 연솔루션"],
    ["대표이사", "대표자명 입력"],
    ["설립일", "설립일 입력"],
    ["사업분야", "냉난방·공조 설계 및 시공, LG전자 B2B 가전"],
    ["대표전화", "0000-0000"],
    ["소재지", "회사 주소 입력"],
  ];

  return (
    <div className="company-overview">
      <div className="company-section-heading">
        <p className="company-kicker">COMPANY OVERVIEW</p>
        <h2>고객의 공간에 최적화된<br />전문 솔루션을 제공합니다.</h2>
      </div>
      <dl className="company-overview-list">
        {details.map(([term, description]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CiGuide() {
  return (
    <div className="company-ci">
      <div className="company-section-heading">
        <p className="company-kicker">CORPORATE IDENTITY</p>
        <h2>연솔루션의 가치를 담은<br />기업 아이덴티티입니다.</h2>
      </div>
      <div className="company-ci-board">
        <div className="company-ci-logo">
          <img src={logo} alt="연솔루션 심볼" />
          <strong>연솔루션</strong>
        </div>
        <p>정확한 로고 사용 규정과 원본 파일은 추후 등록해 주세요.</p>
      </div>
      <div className="company-colors">
        <div><span className="company-color company-color--red" /><b>YEON RED</b><small>#A50034</small></div>
        <div><span className="company-color company-color--blue" /><b>YEON BLUE</b><small>#0D1B34</small></div>
      </div>
    </div>
  );
}

function History() {
  const history = [
    { year: "20XX", items: ["주요 연혁 내용을 입력해 주세요.", "프로젝트 및 인증 취득 내용을 입력해 주세요."] },
    { year: "20XX", items: ["회사 성장 과정과 주요 실적을 입력해 주세요."] },
    { year: "20XX", items: ["주식회사 연솔루션 설립"] },
  ];

  return (
    <div className="company-history">
      <div className="company-section-heading">
        <p className="company-kicker">OUR HISTORY</p>
        <h2>기술과 신뢰로 쌓아온<br />연솔루션의 발자취입니다.</h2>
      </div>
      <div className="company-history-list">
        {history.map((period, index) => (
          <div className="company-history-row" key={`${period.year}-${index}`}>
            <strong>{period.year}</strong>
            <ul>{period.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Location() {
  return (
    <div className="company-location">
      <div className="company-section-heading">
        <p className="company-kicker">LOCATION</p>
        <h2>연솔루션으로<br />찾아오시는 길입니다.</h2>
      </div>
      <div className="company-map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m5!3m3!1m2!1s0x357b43428780d19f%3A0x284d93fe91f21f5!2z6rK96riw64-EIOyImOybkOyLnCDqtozshKDqtawg7Zqo7JuQ66GcIDIzMA!5e0!3m2!1sko!2skr!4v1790314677255!5m2!1sko!2skr"
          title="연솔루션 오시는 길"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <dl className="company-location-info">
        <div><dt>주소</dt><dd>회사 주소 입력</dd></div>
        <div><dt>대표전화</dt><dd>0000-0000</dd></div>
        <div><dt>이메일</dt><dd>example@email.com</dd></div>
      </dl>
    </div>
  );
}

const pageContents: Record<CompanyPageKey, React.ReactNode> = {
  greeting: <Greeting />,
  overview: <Overview />,
  ci: <CiGuide />,
  history: <History />,
  location: <Location />,
};

export default function CompanyPage() {
  const { page } = useParams();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  if (!isCompanyPageKey(page)) {
    return <Navigate to="/company/greeting" replace />;
  }

  return (
    <div className="company-page">
      <section className="company-hero">
        <img className="company-hero-image" src={companyBg2} alt="" />
        <div className="company-hero-overlay" aria-hidden="true" />
        <div className="company-hero-inner">
          <p>YEON SOLUTION</p>
          <h1>회사 소개</h1>
          <span>신뢰할 수 있는 기술과 책임 있는 시공으로 함께합니다.</span>
        </div>
      </section>

      <nav className="company-tabs" aria-label="회사 소개 메뉴">
        <div className="company-tabs-inner">
          {companyMenus.map((menu) => (
            <Link
              className={page === menu.key ? "is-active" : ""}
              key={menu.key}
              to={`/company/${menu.key}`}
            >
              {menu.name}
            </Link>
          ))}
        </div>
      </nav>

      <section className="company-content">{pageContents[page]}</section>
    </div>
  );
}
