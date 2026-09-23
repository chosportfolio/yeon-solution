import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./Footer.css";

const companyInfo = {
  name: "주식회사 연솔루션",
  representative: "조창연",
  businessNumber: "199-81-03077",
  address: "경기도 수원시 권선구 효원로 230, 201호 중앙빌딩(권선동)",
  phone: "031-233-5559",
  email: "cy6907@naver.com",
  mailOrderNumber: "제0000-지역-0000호",
  weekdayHours: "09:00 - 18:00",
  lunchHours: "12:00 - 13:00",
  holidays: "토, 일, 공휴일",
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <nav className="footer-policy" aria-label="정책 안내">
          <Link to="/terms">이용약관</Link>
          <Link to="/email-policy">이메일무단수집거부</Link>
          <Link to="/privacy" className="is-emphasis">
            개인정보처리방침
          </Link>
        </nav>

        <div className="footer-brand">
          <img src={logo} alt="" />
          <strong>연솔루션</strong>
        </div>

        <div className="footer-service">
          <p className="footer-contact-line">
            <span>대표전화</span>
            <strong>{companyInfo.phone}</strong>
            <span className="footer-divider" aria-hidden="true" />
            <span>이메일 문의</span>
            <a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a>
          </p>
          <p>LG전자 시스템에어컨 설계 · 설치 · 유지보수 전문</p>
          <p>
            상담시간 평일 {companyInfo.weekdayHours} · 점심시간{" "}
            {companyInfo.lunchHours} · 휴일 {companyInfo.holidays}
          </p>
        </div>

        <div className="footer-legal">
          <dl className="footer-company-info">
            <div>
              <dt>회사명</dt>
              <dd>{companyInfo.name}</dd>
            </div>
            <div>
              <dt>대표이사</dt>
              <dd>{companyInfo.representative}</dd>
            </div>
            <div>
              <dt>사업자등록번호</dt>
              <dd>{companyInfo.businessNumber}</dd>
            </div>
            <div>
              <dt>통신판매업신고번호</dt>
              <dd>{companyInfo.mailOrderNumber}</dd>
            </div>
            <div>
              <dt>주소</dt>
              <dd>{companyInfo.address}</dd>
            </div>
          </dl>

          <p className="footer-notice">
            본 사이트의 모든 콘텐츠는 저작권법의 보호를 받으며, 무단 전재,
            복사, 배포 등을 금합니다.
          </p>
          <p className="footer-copyright">
            Copyright © {new Date().getFullYear()} YEON SOLUTION. All Rights
            Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
