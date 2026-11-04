# 연솔루션 홈페이지

연솔루션에서 어떤 설비를 취급하고 어디에 시공했는지 볼 수 있도록 만든 홈페이지입니다. 사업분야는 중앙공조, 시스템에어컨, B2B 가전으로 나눴습니다. 제품 목록에서는 제품명이나 모델명으로 검색하고, 상세 페이지에서 사양과 기술자료를 확인할 수 있습니다.

현장 사진은 관리자 화면에서 설명과 함께 올릴 수 있게 했습니다. 시공사례를 한 번 등록하면 메인 화면과 시공사례 목록에 같이 표시됩니다. 견적 문의는 담당자 메일로 받아서 고객에게 바로 답장할 수 있습니다.

[홈페이지 보기](https://chosportfolio.github.io/yeon-solution/)

## 로컬에서 실행하기

Node.js 24 이상에서 아래 명령을 실행하면 홈페이지와 API 서버가 함께 켜집니다. 화면은 React, TypeScript, Vite로 만들었고 시공사례는 SQLite에 저장합니다.

```sh
npm ci
npm run dev
```

- [로컬 홈페이지](http://127.0.0.1:5173/yeon-solution/)
- [관리자 화면](http://127.0.0.1:5173/yeon-solution/admin)

처음 실행하면 `.env.local`에 관리자 계정(`admin`)과 임의 비밀번호가 생성됩니다. 로그인한 뒤 **새 글 작성**에서 현장 사진과 설명을 올리면 됩니다. 게시글과 사진을 백업할 때는 서버를 끄고 `.local-data/` 폴더 전체를 복사해 두면 됩니다.

## 견적 메일 설정

`.env.local`에 받는 주소(`QUOTE_TO_EMAIL`)와 발송 계정의 SMTP 설정을 입력한 뒤 서버를 다시 시작합니다. 네이버 메일을 쓴다면 `SMTP_PASSWORD`에는 2단계 인증 후 발급한 애플리케이션 비밀번호를 넣습니다. 필요한 항목은 [환경설정 예시](./.env.example)에 모아 뒀습니다.

## 배포

`main`에 푸시하면 GitHub Pages에 회사 소개와 제품 카탈로그가 배포됩니다. 시공사례를 불러오거나 수정할 때, 견적 메일을 보낼 때는 Node.js 서버가 필요합니다.

서버에서 `npm run build` 후 `npm start`를 실행하면 홈페이지와 API를 함께 운영할 수 있습니다. 운영 서버에는 `NODE_ENV=production`과 12자 이상의 `PROJECTS_ADMIN_PASSWORD`를 설정합니다. `PROJECTS_ALLOWED_ORIGINS`에는 사이트의 HTTPS 주소를, `PROJECTS_DATA_DIR`에는 재배포 후에도 게시글과 사진을 보관할 폴더 경로를 넣습니다.

시공사례 등록·수정·삭제와 견적 메일 처리 테스트는 `npm run test:server`로 실행합니다.
