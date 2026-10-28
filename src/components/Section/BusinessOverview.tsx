import { Link } from "react-router-dom";
import centralAir from "../../assets/business-hvac.png";
import systemAir from "../../assets/business-air.png";
import appliances from "../../assets/business-appliance.png";
import "./BusinessOverview.css";

const areas = [
  {
    name: "중앙공조 시스템",
    description: "대형 건물과 산업시설에 맞춘 고효율 공조 솔루션",
    image: centralAir,
    alt: "칠러와 배관 설비를 갖춘 중앙공조 기계실",
    path: "/business/hvac",
  },
  {
    name: "시스템에어컨",
    description: "주거·상업 공간에 맞춘 LG전자 냉난방 솔루션",
    image: systemAir,
    alt: "천장형 시스템에어컨이 설치된 업무 공간",
    path: "/business/air-conditioner",
  },
  {
    name: "B2B 가전",
    description: "비즈니스 공간의 편리함을 높이는 LG전자 가전",
    image: appliances,
    alt: "냉장고와 빌트인 가전을 갖춘 기업용 주방 공간",
    path: "/business/builtin",
  },
];

export default function BusinessOverview() {
  return (
    <section className="business-overview" id="home-content" aria-labelledby="business-overview-title">
      <div className="business-overview-inner">
        <div className="business-overview-heading">
          <p>BUSINESS AREA</p>
          <h2 id="business-overview-title">사업 분야</h2>
        </div>
        <div className="business-overview-grid">
          {areas.map((area) => (
            <Link className="business-photo" key={area.name} to={area.path}>
              <img src={area.image} alt={area.alt} loading="lazy" width="768" height="1024" />
              <div className="business-photo-caption">
                <div>
                  <h3>{area.name}</h3>
                  <p>{area.description}</p>
                </div>
                <svg className="business-photo-arrow" viewBox="0 0 32 24" fill="none" aria-hidden="true">
                  <path d="M2 12h26M20 4l8 8-8 8" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
