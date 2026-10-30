# 연솔루션 홈페이지

## 로컬 실행 및 관리자

Node.js 24 이상이 필요합니다. `npm install` 후 `npm run dev`를 실행하면 홈페이지(127.0.0.1:5173)와 저장 API(127.0.0.1:3001)가 함께 실행됩니다. 첫 실행 시 임의 비밀번호를 가진 `admin` 계정을 `.env.local`에 생성합니다. 계정은 브라우저용 코드에 포함되지 않습니다.

- 홈페이지: http://127.0.0.1:5173/yeon-solution/
- 관리자: http://127.0.0.1:5173/yeon-solution/admin
- 관리자에서 `새 글 작성` → 제목·분류·본문·사진 입력 → `등록하기`
- 등록·수정·삭제 결과는 같은 DB를 사용하는 메인과 시공사례 목록에 함께 반영됩니다. 다른 열린 탭도 자동 갱신하며, 다른 브라우저는 다시 열거나 최대 30초 내에 갱신됩니다.
- 본문은 문단·소제목·인용문·사진으로 구성합니다. 굵게·가운데 정렬, 사진 설명, 대표 사진 선택, 순서 변경, 미리보기를 지원합니다. 작성 중인 내용은 해당 브라우저 탭에 임시 저장되며 로그아웃 시 삭제됩니다.
- 시공사례 목록은 페이지당 30개이며, 비어 있어도 1페이지를 표시합니다.

## 저장과 계정 관리

`.local-data/projects.sqlite`에 게시글·관리자 비밀번호 해시·서버 세션을, `.local-data/uploads/`에 사진을 저장합니다. 최초에만 기존 시공사례 6건을 DB에 넣으며 서버를 다시 켜도 작성·삭제한 내용이 유지됩니다. 서버를 종료한 뒤 `.local-data/` 전체를 백업하면 사진과 게시글을 함께 보관할 수 있습니다.

실제 환경 파일(`.env`, `.env.*`)과 `.local-data/`는 Git에서 제외되며, 비밀값이 없는 `.env.example`만 포함합니다. 비밀번호를 변경하려면 `.env.local`의 `PROJECTS_ADMIN_PASSWORD`를 12자 이상의 새로운 비밀번호로 바꾸고 서버를 재시작합니다. 기존 로그인 세션은 무효화됩니다. 파일을 외부에 공개하지 마세요.

보호 조치: scrypt 비밀번호 해시, 서버 세션(8시간/30분 비활동 만료), HttpOnly·SameSite 쿠키, CSRF 토큰·Origin 검사, 로그인 실패 제한, SQL 매개변수 바인딩, 사진 용량·시그니처 검증, 실행 가능한 HTML을 사용하지 않는 본문 렌더링. 일반 사진은 업로드 전에 다시 인코딩해 카메라 메타데이터를 제거합니다.

## 고객지원 · 견적 메일 설정

헤더의 고객지원에서 `견적 문의`(`/support/estimate`)와 `자주 묻는 질문`(`/support/faq`)을 이용합니다. 기존 `/support` 주소는 견적 문의로 이동합니다. 견적은 제품·고객·설치 현장 정보와 필수 동의를 입력한 뒤 서버의 SMTP로 담당자 이메일에 전달하며, 고객 이메일을 Reply-To로 지정합니다. 문의 내용을 별도 DB에 저장하지 않습니다.

`.env.example`의 `QUOTE_TO_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, 필요 시 `SMTP_FROM`을 **`.env.local`**에 설정하고 서버를 재시작합니다. `QUOTE_TO_EMAIL`만 변경하면 받는 주소를 바꿀 수 있습니다. 네이버 SMTP 예시는 `smtp.naver.com`, 포트 `465`, `SMTP_SECURE=true`이며 발신 계정에서 SMTP 사용을 허용하고 **2단계 인증 후 발급한 애플리케이션 비밀번호**를 사용해야 합니다. 발신 주소는 해당 SMTP 계정에서 발송을 허용하는 주소여야 합니다. 비밀번호는 브라우저 코드나 `VITE_` 환경변수에 넣지 않습니다.

네이버 설정 순서:

1. 메일 → 환경설정 → POP3/IMAP 설정 → POP3/SMTP 설정에서 사용함을 선택합니다. [공식 SMTP 설정 안내](https://help.naver.com/service/30029/contents/21341?lang=ko&osType=PC)
2. 네이버ID → 보안설정 → 기본보안설정 → 2단계 인증 → 관리에서 애플리케이션 종류를 직접 입력하고 `연솔루션 견적 발송` 등의 이름으로 비밀번호를 생성합니다. [공식 애플리케이션 비밀번호 안내](https://help.naver.com/service/5640/contents/8584?lang=ko&osType=COMMONOS)
3. `.env.local`의 `SMTP_USER`에 발신 계정의 전체 이메일 주소를, `SMTP_PASSWORD`에 생성한 애플리케이션 비밀번호를 입력합니다. `SMTP_FROM`은 비워 두면 발신 계정과 같은 주소를 사용합니다.
4. 실행 중인 개발 서버를 종료한 뒤 `npm run dev`로 다시 실행합니다. 운영 서버는 환경변수를 갱신하고 다시 시작합니다.

메일 설정이 없거나 SMTP 서버가 메일을 수락하지 않으면 전송 성공으로 표시하지 않고, 입력 내용을 유지한 채 오류를 안내합니다. 서명된 문의 토큰, 출처 검사, 허니팟, IP별 10분당 5회 발송 시도 제한과 중복 전송 방지를 적용합니다. SMTP의 수락 여부까지 확인하며 실제 받은편지함 도착이나 스팸 분류는 메일 서비스에서 확인해야 합니다. 전송 제한 상태는 서버 메모리에서 관리합니다. 실제 운영 서버는 외부 남용 차단과 HTTPS를 함께 구성해야 합니다.

실제 발송에는 기존 관리자 API와 같은 Node.js 서버가 필요합니다. GitHub Pages만으로는 견적 이메일을 발송할 수 없습니다. 운영에서는 `PROJECTS_ALLOWED_ORIGINS`를 실제 홈페이지 출처로 지정하고 SMTP 설정을 서버 환경변수에 제공합니다.

`npm run test:server`는 테스트용 메일 전송기를 사용해 발송 성공·실패·수신자 고정·중복 전송·잘못된 요청을 검사합니다. 실제 수신자에게 테스트 이메일을 발송하지 않습니다.

## 빌드와 배포 환경

`npm run test:server`는 별도 임시 DB에서 인증·CSRF·잘못된 업로드·등록·수정·삭제·재시작 후 보존을 검사합니다. `npm run build`는 프런트엔드를 빌드합니다. 빌드 후 `npm start`로 API와 빌드된 홈페이지를 한 서버에서 제공할 수 있습니다.

현재 GitHub Pages 워크플로는 `main` 푸시 시 정적 프런트엔드만 자동 배포합니다. 관리자 기능은 아직 로컬 전용이며 GitHub Pages만으로는 저장 서버를 실행할 수 없습니다. 실제 호스팅 시에는 Node.js 24 서버와 영구 저장 디스크를 사용하고, HTTPS 역방향 프록시 뒤에서 `NODE_ENV=production`, 강한 관리자 비밀번호, 실제 도메인의 `PROJECTS_ALLOWED_ORIGINS`를 설정해야 합니다. 운영 환경에서는 Secure 쿠키를 사용합니다. DB·업로드·환경 파일을 정적 웹 경로 안에 두지 마세요.

---

## 기본 개발 환경

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
