import hongdae from "../assets/construction location/홍대입구역.jpg";
import seocheonSchool from "../assets/construction location/용인 서천초등학교.jpeg";
import saebitSchool from "../assets/construction location/용신 새빛초등학교.png";
import yongsanStation from "../assets/construction location/용산역.jpg";
import seoulStation from "../assets/construction location/서울역.jpg";
import dongA from "../assets/construction location/동원오츠카 청주.png";

export type Project = { name: string; image: string; category: string };

export const projects: Project[] = [
  { name: "서울역", image: seoulStation, category: "냉난방기" },
  { name: "용산역", image: yongsanStation, category: "칠러" },
  { name: "홍대입구역", image: hongdae, category: "온수시스템" },
  { name: "용인 서천초등학교", image: seocheonSchool, category: "냉난방기" },
  { name: "용신 새빛초등학교", image: saebitSchool, category: "냉난방기" },
  { name: "동원오츠카 청주", image: dongA, category: "칠러" },
];
