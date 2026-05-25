# 📦 LWO 물류 분석 Tool

> **Logistics Work Optimize** — 휴대폰 하나로 물류 현장의 9가지 핵심 KPI를 측정·분석·시각화하는 도구

[![Web App](https://img.shields.io/badge/▶_웹앱_바로_실행-A50034?style=for-the-badge)](https://inventorhan.github.io/LWO-debug/)
[![Manual](https://img.shields.io/badge/📖_사용_설명서-6F0023?style=for-the-badge)](https://inventorhan.github.io/LWO-debug/manual.html)
[![Docs](https://img.shields.io/badge/📚_프로젝트_구조-424242?style=for-the-badge)](./docs/PROJECT_STRUCTURE.md)

---

## ✨ 무엇을 할 수 있나요?

물류 현장에서 스톱워치 · 줄자 · 메모지로 하던 작업을 **앱 화면 한 곳**에서 처리합니다.
모든 데이터는 휴대폰 내부에 저장되며 서버로 전송되지 않습니다.

### 8개 메뉴와 9가지 분석

| 모듈 | 무엇을 측정? | 결과 |
|------|--------------|------|
| 👷 **작업자 부하율** | 운반 사이클 시간 (피킹·이동·로딩·회수) | 부하율 %, 총 운반 시간 |
| 🛗 **E/V 부하율** | 엘리베이터 호기별 운반 시간 + 공통 적재 단수 기준 카(케이지) 적재율 | 부하율 %, 적재율 % |
| 📐 **면적 효율** | 공장·구역별 면적 + 최고 높이 점유율 기반 체적 효율 | 면적 효율 %, 평균 체적 사용율 % |
| 📦 **적정 재고량** | UPH 기준 재고 + 실적 기준 재고를 탭으로 선택 | Total 적정 재고, 99.9%/99.5% 적정재고 |
| 🤖 **AMR 대수** | 생산 Tact + AMR 왕복 시간 + AMR 여유율 | 필요 도입 대수 (대) |
| 👥 **물류 적정 인원** | Item별 피킹·언로딩·이동 시간 + 표준작업 여유율 | 최종 적정 인원 (명) |
| 🏭 **물류 창고 면적** | UPH 기준 또는 용기 사이즈 기준 필요 면적 | 물류 필요 면적 합계 (m²) |
| ⚙️ **물류 자동화율** | 자동화 적용 Item + Re-Handling Item | 자동화율 %, Re-Handling율 % |

> `실적 기준 재고`는 별도 하단 메뉴가 아니라 **적정 재고량** 메뉴 안의 탭으로 제공됩니다.

### 부가 기능

- ⏱ **스톱워치 측정** — 회차별로 ▶ 시작 → ⏹ 종료
- 📊 **작업자 상세 시간 그래프** — 회차별/작업자별 시간 비교, 전체 인원 평균 기준 대시보드, 라인형/박스형 전환
- 📸 **사진 첨부** — 운반 수단·적재 상태·공장 도면 사진 임베드
- 📊 **통계 분석 + 차트** — 일별 실적 데이터 → 평균/표편 + Z 기반 적정재고 + 추이 라인 차트
- 📥 **참조 Excel 일괄 입력** — 실적 기준 재고, 물류 적정 인원, 물류 창고 면적은 참조 양식 기반 업로드/다운로드 지원
- ⚙ **제품/모델 관리** — 드롭다운 + 추가/이름변경/삭제 모달 (조합별 데이터 독립 저장)
- 💾 **JSON 저장/불러오기** — 측정 데이터 영구 보관
- 📑 **Excel 내보내기** — 9가지 분석 결과를 한 파일로 (사진 포함)
- 📖 **인라인 도움말** — 각 섹션 옆 `?` 버튼 + 풀스크린 종합 설명서, 최신 계산식/용어 반영
- 🌐 **4가지 배포 형태** — Android 앱(APK/AAB) + Windows EXE(설치형/포터블) + 단일 HTML 파일 + GitHub Pages 호스팅

---

## 🚀 사용 방법

### 일반 사용자
1. **웹**: https://inventorhan.github.io/LWO-debug/ 접속
2. **Android 앱**: `LWO_V*-release.apk` 다운로드 후 폰에 설치
3. **Windows 앱**: `LWO_V*-Setup-windows.exe` (설치형) 또는 `LWO_V*-portable-windows.exe` (USB 실행)
4. **오프라인 단일 HTML**: `LWO_V*-web.html` 파일을 폰/PC에 저장 후 더블클릭

### 처음이라면
📖 **[사용 설명서](https://inventorhan.github.io/LWO-debug/manual.html)** 를 먼저 보세요. 모듈별 절차 + 공식 + 계산 예시까지 정리되어 있습니다.

---

## 🛠 기술 스택

```
React 19 + Vite 8 (단일 파일 빌드)
├─ Capacitor 8       → Android APK / AAB
├─ Electron 33       → Windows EXE (설치형 / 포터블)
├─ exceljs           → 클라이언트 Excel 내보내기
└─ GitHub Actions    → GitHub Pages 자동 배포
```

서버 / 백엔드 / 데이터베이스 없음. 완전한 **클라이언트 사이드 앱**.

---

## 📁 프로젝트 구조 (요약)

```
lwo-app/
├─ src/
│  ├─ App.jsx              ← 루트 컴포넌트 (헤더·탭·라우팅)
│  ├─ store.js             ← 전역 상태 (useAppState 훅)
│  ├─ modules/             ← 분석 화면 모듈
│  │  ├─ WorkerWorkload.jsx
│  │  ├─ ElevatorWorkload.jsx
│  │  ├─ AreaEfficiency.jsx
│  │  ├─ InventoryStorage.jsx      ← UPH 기준 적정 재고
│  │  ├─ InventoryStatistics.jsx   ← 실적 기준 적정 재고 (적정 재고량 탭)
│  │  ├─ AmrCalculation.jsx
│  │  ├─ LogisticsPersonnel.jsx     ← 물류 적정 인원
│  │  ├─ WarehouseArea.jsx          ← 물류 창고 면적
│  │  └─ AutomationRate.jsx         ← 물류 자동화율
│  └─ shared/              ← 재사용 컴포넌트 + 유틸
├─ android/                ← Capacitor 네이티브 프로젝트
├─ public/                 ← 정적 자산 (manual.html 포함)
└─ docs/                   ← 문서 (PROJECT_STRUCTURE.md, CHANGELOG.md, ...)
```

자세한 구조와 빌드 흐름은 **[PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)** 참고.

---

## ⚙ 개발 / 빌드

```bash
# 의존성 설치
npm install

# 개발 서버 (localhost:5173)
npm run dev

# 프로덕션 빌드 (dist/index.html — 단일 파일)
npm run build

# 버전 증가
npm run bump:patch   # 1.2.7 → 1.2.8
npm run bump:minor   # 1.1.x → 1.2.0

# Android 빌드
npx cap copy android
cd android && ./gradlew assembleRelease    # APK
cd android && ./gradlew bundleRelease      # AAB (Play Console)

# Windows EXE 빌드
npm run electron:build                     # Setup.exe + portable.exe (dist-electron/)
npm run electron:dev                       # 개발 중 로컬 일렉트론 미리보기
```

`main` 브랜치에 푸시하면 **GitHub Actions가 자동으로 GitHub Pages에 배포**합니다 (1~2분 소요).

---

## 📝 문서

| 문서 | 내용 |
|------|------|
| [`docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md) | 종합 기술 문서 (구조·빌드·확장 가이드) |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | 버전별 변경 이력 |
| [`docs/manual.html`](https://inventorhan.github.io/LWO-debug/manual.html) | 일반 사용자 / 교육생용 사용 설명서 |
| [`docs/privacy.html`](https://inventorhan.github.io/LWO-debug/privacy.html) | 개인정보처리방침 |

---

## 📄 라이선스 / 제작

© 2026 LWO Project · Designed by **Haneol Lee** · Advised by **JS Kim**
