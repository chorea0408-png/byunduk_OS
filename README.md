# 변덕쟁이들 OS

프리랜서/에이전시 업무 관리 대시보드 (단일 페이지 웹앱, 빌드 도구 없이 브라우저에서 바로 실행).

## 파일 구조

```
byunduk_OS/
├── index.html                     # 메인 HTML (구조 + CSS/JS 연결)
├── css/
│   ├── base.css                   # 공통 스타일 (색상 변수, 리셋, 레이아웃 기본)
│   ├── home.css                   # 홈 대시보드
│   ├── detail-billing.css         # 클라이언트 상세 패널 + 청구서
│   ├── letter.css                 # 변덕레터
│   ├── growth-analytics.css       # 채널 성장
│   ├── action-board.css           # 액션 보드
│   ├── crm-search-expenses.css    # CRM 검색/필터 + 지출
│   ├── crm-relationship.css       # 관계 티어(CRM)
│   ├── quote.css                  # 견적 자동화
│   ├── forecast-analytics.css     # 수익 예측 · 수익성 분석 등 리포트
│   ├── responsive-deadline.css    # 모바일 반응형 + 마감/필터 UI
│   ├── crm-extras.css             # CRM 상세 확장 기능(타임로그, 제안서, 종료 체크 등)
│   └── reports-partners.css       # LTV 비교, SOP 트래커, 파이프라인 속도, 외주 파트너 탭
├── js/
│   ├── core.js                    # 공용 데이터 (전역 상태, 상수)
│   ├── shared.js                  # 공통 유틸 함수 (저장, 탭 전환, 테마, 토스트, 검색 등)
│   ├── home.js                    # 홈 탭
│   ├── crm.js                     # 파이프라인(CRM) 탭
│   ├── capacity.js                # Capacity 탭
│   ├── forecast.js                # 수익 예측 탭
│   ├── profitability.js           # 수익성 분석 탭
│   ├── ideas-retro.js             # 콘텐츠 보관함 + 월간 회고 탭
│   ├── billing.js                 # 청구서 탭
│   ├── letter.js                  # 변덕레터 탭
│   ├── channel.js                 # 채널 성장 탭
│   ├── source.js                  # 유입경로 탭
│   ├── goals-actionboard.js       # 연간 목표 + 액션 보드 탭
│   ├── expenses-tiers.js          # 지출 + 관계 티어 탭
│   ├── quote.js                   # 견적 자동화 탭
│   ├── memos.js                   # 메모장 탭
│   ├── partners.js                # 외주 파트너 탭
│   ├── analytics.js               # Google Sheets 연동 + 리포트 분석(서비스 믹스, 정확도, 마감 소요시간)
│   └── init.js                    # 초기화/부트스트랩 (앱 시작 시 실행)
├── README.md                      # 이 문서
└── 변덕쟁이들_OS_v34c.html         # 원본 백업 (분리 전 통짜 파일, 참고용 보존)
```

## 실행 방법

그냥 `index.html`을 브라우저로 열면 됩니다. (더블클릭 또는 브라우저 창에 드래그)

- 별도 설치나 빌드가 필요 없습니다.
- 입력한 데이터는 브라우저의 localStorage에 저장됩니다.

## 외부 의존성

- **Tabler Icons** — 아이콘 웹폰트
- **Chart.js** — 차트

두 가지 모두 CDN으로 불러오므로 인터넷 연결이 필요합니다. 인터넷이 없으면 아이콘과 차트만 표시되지 않고, 나머지 기능은 정상적으로 동작합니다.

## 리팩토링 히스토리

이 프로젝트는 지금까지 두 차례 리팩토링을 거쳤습니다.

1. **1차**: 최초 통짜 HTML 파일(약 7,674줄)을 `index.html` / `css/` / `js/` 3개로 분리.
2. **2차 (현재 구조)**: 이후 CSS와 JS를 각각 기능별 파일로 세분화. 각 탭/기능이 자신만의 css·js 파일을 갖도록 정리했습니다.

앞으로 새 기능을 추가할 때는 해당 기능의 css/js 파일에 추가하면 됩니다. `index.html`의 스크립트 로드 순서(`core.js` → `shared.js` → 기능별 파일들 → `init.js`)는 반드시 유지해야 합니다 — 순서를 바꾸면 오류가 날 수 있습니다.

## 알려진 이슈

- **외주 파트너 탭이 비어 보이는 현상**: 원본 파일에서도 동일하게 발생하던 문제로, 이번 리팩토링으로 새로 생긴 것이 아닙니다.
