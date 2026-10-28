import { useRef, useState } from "react";
import { A11y, Autoplay, EffectFade, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import HeroScrollCue from "./HeroScrollCue";
import campus from "../../assets/hero-campus.png";
import interior from "../../assets/이미지슬라이드.jpg";
import station from "../../assets/construction location/서울역.jpg";
import "swiper/css/effect-fade";
import "./MainHero.css";

const slides = [
  { image: campus, alt: "따뜻한 조명이 켜진 유리 건물과 수공간의 저녁 전경", title: "공간에 맞는 LG 공조 솔루션", description: "설계부터 시공, 유지관리까지 연솔루션이 함께합니다.", position: "center" },
  { image: interior, alt: "천장형 시스템에어컨이 설치된 실내 공간", title: "쾌적한 공간을 완성하는 기술", description: "공간의 용도와 환경에 맞는 냉난방 시스템을 제안합니다.", position: "center" },
  { image: station, alt: "연솔루션 냉난방기 시공 현장, 서울역", title: "현장에서 쌓아온 신뢰와 경험", description: "다양한 시공 경험으로 안정적인 공조 환경을 만듭니다.", position: "center 60%" },
];

export default function MainHero() {
  const slider = useRef<SwiperInstance | null>(null);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const togglePlayback = () => {
    if (!slider.current) return;
    if (isPaused) slider.current.autoplay.start();
    else slider.current.autoplay.stop();
    setIsPaused(!isPaused);
  };

  return (
    <section className="home-hero" id="home-hero" aria-label="연솔루션 주요 소식">
      <Swiper
        className="home-hero-slider"
        modules={[A11y, Autoplay, EffectFade, Keyboard]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={isPaused ? 0 : 900}
        loop
        keyboard={{ enabled: true, onlyInViewport: true }}
        autoplay={isPaused ? false : { delay: 6500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        a11y={{ prevSlideMessage: "이전 슬라이드", nextSlideMessage: "다음 슬라이드", slideLabelMessage: "{{index}} / {{slidesLength}} 슬라이드" }}
        onSwiper={(swiper) => { slider.current = swiper; }}
        onSlideChange={(swiper) => setCurrent(swiper.realIndex)}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.title}>
            <div className="home-hero-scene">
              <img src={slide.image} alt={slide.alt} style={{ objectPosition: slide.position }} fetchPriority={index === 0 ? "high" : "auto"} loading={index === 0 ? "eager" : "lazy"} />
              <div className="home-hero-shade" />
              <div className="home-hero-copy">
                {index === 0 ? <h1>{slide.title}</h1> : <h2>{slide.title}</h2>}
                <p>{slide.description}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="home-hero-controls" role="group" aria-label="메인 슬라이드 조작">
        <button type="button" aria-label="이전 슬라이드" onClick={() => slider.current?.slidePrev()}>←</button>
        <span className="home-hero-counter" aria-live="off"><strong>{String(current + 1).padStart(2, "0")}</strong><span>/</span><span>03</span></span>
        <button type="button" aria-label="다음 슬라이드" onClick={() => slider.current?.slideNext()}>→</button>
        <button type="button" className="home-hero-playback" aria-label={isPaused ? "슬라이드 자동 재생" : "슬라이드 자동 재생 정지"} onClick={togglePlayback}>{isPaused ? "▷" : "Ⅱ"}</button>
      </div>
      <HeroScrollCue />
    </section>
  );
}
