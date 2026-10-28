import { useRef, useState } from "react";
import BusinessOverview from "./BusinessOverview";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import MainHero from "./MainHero";
import hongdae from "../../assets/construction location/홍대입구역.jpg";
import seocheonSchool from "../../assets/construction location/용인 서천초등학교.jpeg";
import saebitSchool from "../../assets/construction location/용신 새빛초등학교.png";
import yongsanStation from "../../assets/construction location/용산역.jpg";
import seoulStation from "../../assets/construction location/서울역.jpg";
import dongA from "../../assets/construction location/동원오츠카 청주.png";
import mechanicalCertificate from "../../assets/기계설비.png";
import businessLicense from "../../assets/사업자등록증.png";
import constructionLicense from "../../assets/연솔루션 건설업 등록증.png";
import img_video_13 from "../../assets/img_video_13.jpg";
import img_video_14 from "../../assets/img_video_14.jpg";
import img_video_15 from "../../assets/img_video_15.jpg"; 

const projects = [
  { name: "서울역", image: seoulStation, category: "냉난방기" },
  { name: "용산역", image: yongsanStation, category: "칠러" },
  { name: "홍대입구역", image: hongdae, category: "온수시스템" },
  { name: "용인 서천초등학교", image: seocheonSchool, category: "냉난방기" },
  { name: "용신 새빛초등학교", image: saebitSchool, category: "냉난방기" },
  { name: "동원오츠카 청주", image: dongA, category: "칠러" },
];

const categories = ["전체", "냉난방기", "칠러", "온수시스템"];

const productVideos = [
  {
    title: "LG휘센 시스템에어컨 - 소상공인 CSR 캠페인",
    image: img_video_15,
    href: "https://www.youtube.com/embed/o4dx4Egq5i4?rel=0",
  },
  {
    title:
      "LG WHISEN 시스템에어컨 - 주거용 시스템에어컨 (공기청정, 쾌적절전 편)",
    image: img_video_14,
    href: "https://www.youtube.com/embed/xGnX3QogIy8?rel=0",
  },
  {
    title: "주거용 시스템에어컨 (공기청정, 쾌적절편 편)",
    image: img_video_13,
    href: "https://www.youtube.com/embed/_BBXmipD1kI?rel=0",
  },
];

type Certification = {
  title: string;
  description: string;
  image?: string;
  pdf?: string;
};

const documentPdfs = import.meta.glob<string>("../../assets/*.pdf", {
  eager: true,
  query: "?url",
  import: "default",
});

const findDocumentPdf = (keyword: string) =>
  Object.entries(documentPdfs).find(([path]) => path.includes(keyword))?.[1];

const certifications: Certification[] = [
  {
    title: "기계설비 자격증",
    description: "전문 기술 인력 보유",
    image: mechanicalCertificate,
    pdf: findDocumentPdf("기계설비 자격증"),
  },
  {
    title: "건설업 등록증",
    description: "전문건설업 등록 업체",
    image: constructionLicense,
    pdf: findDocumentPdf("건설업 등록증"),
  },
  {
    title: "SH 안전보건 평가",
    description: "안전보건 관리 역량 평가",
  },
  {
    title: "신용등급평가서",
    description: "기업 신용평가 자료",
  },
  {
    title: "사업자등록증",
    description: "정식 등록 사업자",
    image: businessLicense,
    pdf: findDocumentPdf("사업자등록증"),
  },
];

export default function MainSection() {
  const projectSwiper = useRef<SwiperInstance | null>(null);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [currentProject, setCurrentProject] = useState(0);

  const filteredProjects =
    activeCategory === "전체"
      ? projects
      : projects.filter((project) => project.category === activeCategory);

  const changeCategory = (category: string) => {
    setActiveCategory(category);
    setCurrentProject(0);
  };

  return (
    <>
      <MainHero />

      <BusinessOverview />

      <section className="video-section section-container" aria-labelledby="video-title">
        <div className="video-inner">
          <div className="video-heading">
            <h2 id="video-title">LG전자 B2B의 다양한 제품 영상을 만나보세요</h2>
            <a
              href="https://www.lge.co.kr/kr/business/contents/video/video-list.do"
              target="_blank"
              rel="noreferrer"
            >
              더보기 <span aria-hidden="true">›</span>
            </a>
          </div>

          <div className="video-list">
            {productVideos.map((video) => (
              <article className="video-card" key={video.title}>
                <a
                  className="video-thumbnail"
                  href={video.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${video.title} 영상 새 창에서 보기`}
                >
                  {video.image ? (
                    <img src={video.image} alt="" loading="lazy" />
                  ) : (
                    <span className="video-image-placeholder" aria-hidden="true" />
                  )}
                  <span className="video-play" aria-hidden="true">
                    <svg viewBox="0 0 48 48">
                      <circle cx="24" cy="24"   r="21" />
                      <path d="m20 16 13 8-13 8z" />
                    </svg>
                  </span>
                </a>
                <strong>{video.title}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="project-showcase section-container">
        <div className="project-showcase-heading">
          <div>
            <p>OUR PROJECTS</p>
            <h2>시공 사례</h2>
          </div>
        </div>

        <div className="project-filters" aria-label="시공사례 분류">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={activeCategory === category ? "is-active" : ""}
              aria-pressed={activeCategory === category}
              onClick={() => changeCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredProjects.length > 0 ? (
          <Swiper
            key={`${activeCategory}-${filteredProjects.length}`}
            className="project-slider"
            modules={[A11y]}
            loop={filteredProjects.length >= 5}
            slidesPerView={1.15}
            spaceBetween={16}
            speed={550}
            grabCursor
            watchOverflow
            breakpoints={{
              481: { slidesPerView: 2, spaceBetween: 20 },
              901: { slidesPerView: 4, spaceBetween: 24 },
            }}
            onSwiper={(swiper) => {
              projectSwiper.current = swiper;
              setCurrentProject(swiper.realIndex);
            }}
            onRealIndexChange={(swiper) => setCurrentProject(swiper.realIndex)}
          >
            {filteredProjects.map((project) => (
              <SwiperSlide key={project.name}>
                <article className="project-card">
                  <div className="project-image">
                    <img src={project.image} alt={`${project.name} 시공 현장`} />
                  </div>
                  <div className="project-card-text">
                    <p>{project.category}</p>
                    <h3>{project.name}</h3>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <p className="project-empty">등록된 시공사례가 없습니다.</p>
        )}

        {filteredProjects.length > 0 && (
          <div className="project-navigation">
            <input
              className="project-progress"
              type="range"
              min="0"
              max={filteredProjects.length - 1}
              value={currentProject}
              aria-label="시공사례 슬라이드 이동"
              style={{
                "--project-progress": `${
                  ((currentProject + 1) / filteredProjects.length) * 100
                }%`,
              } as React.CSSProperties}
              onChange={(event) =>
                projectSwiper.current?.slideToLoop(Number(event.target.value))
              }
            />

            <div className="project-counter">
              <strong>{String(currentProject + 1).padStart(2, "0")}</strong>
              <span>/</span>
              <span>{String(filteredProjects.length).padStart(2, "0")}</span>
            </div>

            <div className="project-controls">
              <button
                type="button"
                aria-label="이전 시공사례 보기"
                onClick={() => projectSwiper.current?.slidePrev()}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="다음 시공사례 보기"
                onClick={() => projectSwiper.current?.slideNext()}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="certification-section section-container" id="certification">
        <div className="certification-inner">
          <div className="certification-heading">
            <p>CERTIFICATION</p>
            <h2>인증 및 면허</h2>
            <span>
              검증된 기술력과 안전 기준을 바탕으로 신뢰할 수 있는 설비
              서비스를 제공합니다.
            </span>
          </div>

          <div className="certification-list">
            {certifications.map((certification) => (
              <a
                className={`certification-card${
                  certification.pdf ? " has-pdf" : ""
                }`}
                key={certification.title}
                href={certification.pdf}
                target={certification.pdf ? "_blank" : undefined}
                rel={certification.pdf ? "noreferrer" : undefined}
                aria-label={
                  certification.pdf
                    ? `${certification.title} PDF 새 창에서 보기`
                    : undefined
                }
              >
                <div className="certification-document">
                  {certification.image ? (
                    <img
                      src={certification.image}
                      alt={`${certification.title} 서류`}
                    />
                  ) : (
                    <div className="certification-empty" aria-hidden="true" />
                  )}
                  {certification.pdf && (
                    <span className="certification-pdf">PDF 보기 ↗</span>
                  )}
                </div>
                <div className="certification-info">
                  <p>{certification.description}</p>
                  <h3>{certification.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
