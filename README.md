# 추석맞이 Potluck 초대장

게임(산적 꼬치 만들기) → 선물상자 오픈 → 초대장 → 참석 여부 제출 → 구글 캘린더 등록
흐름으로 만든 초대장입니다. 빌드 도구 없이 순수 HTML/CSS/JS라 아무 정적 호스팅에나
바로 올릴 수 있습니다.

## 1. Supabase 설정 (5분)

1. https://supabase.com 에서 프로젝트를 하나 만듭니다 (이미 있다면 그거 사용).
2. 왼쪽 메뉴 **SQL Editor** 에서 `supabase/schema.sql` 내용을 붙여넣고 실행합니다.
   → `chuseok` 테이블이 생성됩니다.
3. **Settings → API** 에서 아래 두 값을 복사합니다.
   - `Project URL`
   - `anon public` 키
4. `js/config.js` 를 열어 채워 넣습니다.

```js
supabase: {
  url: "https://xxxxxxxx.supabase.co",
  anonKey: "eyJhbGciOi...",
  table: "chuseok",
},
```

## 2. 행사 정보 채우기

`js/config.js` 의 `event` 항목을 실제 정보로 수정하세요.

- `dateLabel` : 초대장에 표시되는 날짜/시간 텍스트 (예: "2026년 9월 26일 (토) 오후 5시")
- `location` : 초대장에 표시되는 주소
- `startUTC` / `endUTC` : 구글 캘린더 버튼이 사용하는 시간 (**UTC 기준**, `YYYYMMDDTHHMMSSZ` 형식)

> 밴쿠버는 UTC-7 이므로, 예를 들어 밴쿠버 시간 9/26(토) 오후 5시는
> `20260927T000000Z` 가 됩니다. 온라인 "타임존 변환기"로 확인하면 편합니다.

## 3. 로컬에서 미리보기

빌드 과정이 없으므로 정적 서버만 띄우면 됩니다.

```bash
cd chuseok-invite
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

## 4. 배포

빌드 단계가 없는 순수 정적 사이트이므로 아래 중 편한 방법으로 배포하세요.

**Vercel (CLI)**
```bash
npm i -g vercel
cd chuseok-invite
vercel --prod
```

**Netlify (CLI)**
```bash
npm i -g netlify-cli
cd chuseok-invite
netlify deploy --prod --dir .
```

**Netlify Drop / Vercel 웹 UI**
`chuseok-invite` 폴더를 그대로 드래그 앤 드롭해도 배포됩니다.

배포 후 발급되는 URL이 기본 초대장 링크입니다.
예: `https://your-invite.vercel.app`

## 5. 사람별 개인화 링크 보내기

URL에 `?to=이름` 을 붙이면 그 사람 이름으로 인사말/이름 입력칸이 자동으로
채워집니다. 한글은 URL 인코딩해서 보내는 걸 권장합니다.

```
https://your-invite.vercel.app/?to=%EC%B2%A0%EC%88%98   (철수)
https://your-invite.vercel.app/?to=%EC%98%81%ED%9D%AC   (영희)
```

인코딩은 브라우저 주소창에 아래 자바스크립트를 실행하거나(콘솔),
아무 "URL encode" 도구를 써도 됩니다.

```js
encodeURIComponent("철수") // -> "%EC%B2%A0%EC%88%98"
```

제출된 응답은 `chuseok` 테이블의 `invited_as` 컬럼에 원래 초대 대상 이름으로
같이 저장되므로, 나중에 "누가 아직 응답을 안 했는지" 대조할 수 있습니다.

## 6. Supabase에서 응답 확인하기

Supabase 대시보드 → **Table Editor → chuseok** 에서 실시간으로 확인할 수
있습니다. (별도 관리자 화면은 만들지 않았습니다 — 인원이 적은 소규모
모임에는 Table Editor로 충분합니다.)

## 파일 구조

```
chuseok-invite/
├── index.html              # 전체 화면 구조 (시작/게임/선물상자/초대장)
├── css/style.css           # 스타일 (추석/한가위 테마)
├── js/
│   ├── config.js           # ← 여기만 고치면 됨 (Supabase 키, 행사 정보, 게임 난이도)
│   ├── game.js              # 산적 꼬치 게임 로직 (Canvas)
│   ├── calendar.js         # 구글 캘린더 링크 생성
│   ├── supabase-client.js  # RSVP 저장
│   └── app.js               # 화면 전환 / 개인화 링크 / 폼 제출
└── supabase/schema.sql     # chuseok 테이블 생성 SQL
```

## 커스터마이즈 팁

- **재료/게임 난이도**: `js/config.js` 의 `game.ingredients`, `game.stages`,
  `game.startHearts` 값을 조절하세요. 재료는 이모지라 이미지 없이 바로
  추가/변경할 수 있습니다.
- **색/테마**: `css/style.css` 상단 `:root` 변수만 바꾸면 전체 톤이 바뀝니다.
- **문구**: `index.html` 의 `.invite-body`, `.greeting` 텍스트를 원하는 문구로
  바꾸세요.
