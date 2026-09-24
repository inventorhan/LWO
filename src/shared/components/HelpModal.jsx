import { useState, useEffect } from 'react'

const TABS = [
  { id: 'intro',     icon: '🏠', title: '시작하기' },
  { id: 'worker',    icon: '👷', title: '작업자 부하율' },
  { id: 'elevator',  icon: '🛗', title: 'E/V 부하율' },
  { id: 'area',      icon: '📐', title: '면적 효율' },
  { id: 'inventory', icon: '📦', title: 'UPH 기준 재고' },
  { id: 'invStats',  icon: '📈', title: '실적 기준 재고' },
  { id: 'amr',       icon: '🤖', title: 'AMR 대수' },
  { id: 'personnelPlan', icon: '👥', title: '물류 적정 인원' },
  { id: 'warehouseArea', icon: '🏭', title: '물류 창고 면적' },
  { id: 'automationRate', icon: '⚙️', title: '물류 자동화율' }
]

const C = {
  primary: '#C40030',
  primaryDark: '#8F0022',
  primarySoft: '#FFF1F2',
  primarySofter: '#F8FAFC',
  warn: '#D97706',
  warnBg: '#FFFBEB',
  ok: '#059669',
  okBg: '#ECFDF5',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSec: '#334155',
  textMuted: '#64748B'
}

/* 재사용 박스 */
const Tip = ({ children, type = 'info' }) => {
  const styles = {
    info: { bg: C.primarySofter, border: C.primary, icon: '💡' },
    warn: { bg: C.warnBg, border: C.warn, icon: '⚠️' },
    ok:   { bg: C.okBg, border: C.ok, icon: '✅' }
  }[type]
  return (
    <div style={{
      background: styles.bg,
      borderLeft: `4px solid ${styles.border}`,
      padding: '10px 14px',
      borderRadius: 6,
      margin: '12px 0',
      fontSize: '0.88rem',
      lineHeight: 1.6,
      color: C.text
    }}>
      <span style={{ marginRight: 8 }}>{styles.icon}</span>{children}
    </div>
  )
}

const Section = ({ title, children }) => (
  <div style={{ marginTop: 22 }}>
    <h3 style={{
      fontSize: '1.05rem', fontWeight: 800, color: C.primaryDark,
      paddingBottom: 6, borderBottom: `2px solid ${C.primary}`, marginBottom: 12
    }}>{title}</h3>
    <div style={{ fontSize: '0.92rem', lineHeight: 1.75, color: C.text }}>{children}</div>
  </div>
)

const Step = ({ n, title, children }) => (
  <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
    <div style={{
      flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
      background: C.primary, color: 'white', fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.92rem'
    }}>{n}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '0.88rem', color: C.textSec, lineHeight: 1.65 }}>{children}</div>
    </div>
  </div>
)

const Formula = ({ children }) => (
  <div style={{
    background: '#2A1F24', color: 'white', padding: '10px 14px',
    borderRadius: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.85rem', margin: '8px 0', lineHeight: 1.7,
    overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
  }}>{children}</div>
)

const Table = ({ headers, rows }) => (
  <div style={{ overflowX: 'auto', margin: '10px 0' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 320 }}>
      <thead>
        <tr style={{ background: C.primarySoft }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: '8px 10px', textAlign: 'left', color: C.primaryDark, borderBottom: `2px solid ${C.primary}` }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
            {r.map((c, j) => <td key={j} style={{ padding: '8px 10px', color: C.textSec }}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

/* ── 콘텐츠 ── */
const IntroContent = () => (
  <>
    <Section title="LWO 물류 분석 Tool이란?">
      <p>LWO(Logistics Work Optimizer)는 <b>물류 현장의 핵심 KPI 9가지</b>를 휴대폰으로 측정·계산할 수 있는 도구입니다. 측정 데이터는 모두 자동 저장되며, 결과를 엑셀로 내보낼 수 있습니다.</p>
      <Tip type="ok">현장에서 스톱워치 + 줄자 + 메모지로 하던 작업을 한 화면에서 해결합니다.</Tip>
    </Section>

    <Section title="8개 메뉴와 9가지 분석 한눈에 보기">
      <Table
        headers={['모듈', '무엇을 측정?', '결과']}
        rows={[
          ['👷 작업자 부하율', '운반 사이클 시간 (피킹·이동·로딩/언로딩·회수)', '부하율 %, 총 운반 시간'],
          ['🛗 E/V 부하율', '엘리베이터 호기별 운반 시간 + 적재율', '부하율 %, 적재율 %'],
          ['📐 면적 효율', '공장·구역 면적 + 적재물 체적', '면적 효율 %, 체적 사용율 %'],
          ['📦 적정 재고량', 'UPH 기준 재고와 실적 기준 재고를 탭으로 선택', 'Total 적정 재고 / 99.9%·99.5% 적정재고'],
          ['🤖 AMR 대수', '생산 Tact + AMR 왕복 시간', '필요 대수 (대)'],
          ['👥 물류 적정 인원', 'Item별 피킹·언로딩·이동 시간과 운반 횟수', '최종 적정 인원 (명)'],
          ['🏭 물류 창고 면적', 'UPH 기준 또는 용기 사이즈 기준 필요 면적', '물류 필요 면적 합계 (m²)'],
          ['⚙️ 물류 자동화율', '자동화 적용 Item + Re-Handling Item', '자동화율 %, Re-Handling율 %']
        ]}
      />
      <Tip>실적 기준 재고는 앱의 <b>적정 재고량</b> 메뉴 안에서 <b>실적 기준 재고</b> 탭으로 전환해 사용합니다.</Tip>
    </Section>

    <Section title="공통 사용 흐름">
      <Step n="1" title="모듈 선택">하단 탭 (휴대폰) 또는 좌측 사이드바 (PC)에서 분석하려는 모듈을 선택합니다.</Step>
      <Step n="2" title="기초 정보 입력">각 모듈의 기초 정보(치수, UPH, 시간 등)를 입력합니다. 빈 칸은 0으로 계산됩니다.</Step>
      <Step n="3" title="측정 / 자동 산출">스톱워치 버튼이 있는 모듈은 ▶ 시작 → ⏹ 종료를 눌러 시간을 잽니다. 나머지는 입력 즉시 자동 계산됩니다.</Step>
      <Step n="4" title="저장 / 내보내기">상단의 💾 저장(JSON), 📊 엑셀 버튼으로 결과를 보관합니다.</Step>
    </Section>

    <Section title="상단 버튼 안내">
      <Table
        headers={['버튼', '용도']}
        rows={[
          ['📂 열기',  '이전에 저장한 JSON 파일을 불러옵니다'],
          ['💾 저장',  '현재 입력을 Documents/LWO/ 폴더에 JSON으로 저장'],
          ['📊 엑셀',  '9개 모듈 전체를 엑셀 파일로 한 번에 내보내기'],
          ['🔄 초기화', '모든 입력 데이터 삭제 (복구 불가)'],
          ['📖 설명서', '바로 이 도움말 — 언제든 다시 열 수 있습니다']
        ]}
      />
      <Tip>입력값은 휴대폰/브라우저에 자동 저장되므로 앱을 껐다 켜도 유지됩니다. 단 🔄 초기화를 누르면 모두 삭제됩니다.</Tip>
    </Section>
  </>
)

const WorkerContent = () => (
  <>
    <Section title="이 모듈은 언제 쓰나요?">
      <p>한 명의 작업자(또는 운반 수단)가 한 사이클(피킹 → 이동 → 로딩/언로딩 → 회수)을 도는 데 걸리는 시간을 실측해 <b>부하율(%)</b>을 산출합니다. 인원·운반 수단별 효율 비교에 사용합니다.</p>
    </Section>

    <Section title="입력 절차">
      <Step n="1" title="작업자 추가/선택">
        상단 작업자 탭에서 측정할 사람을 선택합니다. 이름 추가는 <b>명단 관리</b> 버튼.
      </Step>
      <Step n="2" title="운반 종류 / 속도 / 가중치 / 공급횟수 설정">
        도보(2.3 m/s) / 대차(1.8) / 파렛트(2.0) / AGV(1.5) 중 선택하면 표준 속도가 자동 입력되며, <b>운반 속도는 모든 종류에서 직접 수정</b>할 수 있습니다. <b>부하 가중치</b>는 0.5~1.0 (통상 0.8 = 80% 가동). 측정 결과 영역의 <b>시간당 공급횟수(회/h)</b>가 부하율 환산의 핵심값입니다 (기본 1).
      </Step>
      <Step n="3" title="측정 회차마다 4단계 시간 기록">
        ▶ 시작 / ⏹ 종료 버튼으로 각 단계의 시간을 잽니다. 4단계 모두 측정 완료해야 한 사이클입니다.
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li><b>피킹</b>: 자재를 집어 운반구에 싣는 시간 (자재 종수도 함께 입력)</li>
          <li><b>이동</b>: 운반 경로 이동 시간 (공정 번호 1~10)</li>
          <li><b>로딩/언로딩</b>: 목적지에서 내리는 시간 (공정 번호)</li>
          <li><b>회수</b>: 빈 운반구로 복귀하는 시간</li>
        </ul>
      </Step>
      <Step n="4" title="회차 추가">
        평균값의 신뢰도를 위해 같은 사이클을 3~5회 반복 측정. <b>+ 회차</b> 버튼으로 추가합니다.
      </Step>
    </Section>

    <Section title="자동 산출 공식">
      <Formula>{`평균 1회 운반 시간 = Σ (피킹+이동+로딩/언로딩+회수) ÷ 측정 횟수
시간당 점유 시간 = 평균 1회 운반 시간 × 시간당 공급횟수
부하 가중 시간 = 3600초 × 부하 가중치
부하율(%) = 시간당 점유 시간 ÷ 부하 가중 시간 × 100`}</Formula>
      <Tip>1시간 내내 측정하기 어려우므로, 몇 회 측정한 <b>평균 1회 시간</b>에 <b>시간당 공급횟수</b>를 곱해 환산합니다. 예: 평균 400초 × 6회 = 2400초, 가중 시간 2880초 → 약 83%. 공급횟수 미입력 시 기본 1회/h로 계산됩니다.</Tip>
    </Section>

    <Section title="상세 시간 그래프">
      <p>측정 데이터가 1회 이상 있으면 <b>상세 시간 그래프</b>에서 회차별 또는 작업자별 시간을 확인할 수 있습니다.</p>
      <ul style={{ paddingLeft: 18, marginTop: 6 }}>
        <li><b>회차별</b>: 선택 작업자의 피킹·이동·로딩/언로딩·회수 시간을 회차별로 비교</li>
        <li><b>작업자별</b>: 여러 작업자의 총 운반 시간과 평균 부하율 비교</li>
        <li><b>라인형 / 박스형</b>: 추세 확인 또는 항목별 구성 비교에 맞춰 선택</li>
      </ul>
    </Section>

    <Section title="결과 해석">
      <Table
        headers={['부하율', '판정', '대응']}
        rows={[
          ['~ 70%',  '여유 있음', '인원 재배치 검토'],
          ['70~90%', '적정 부하', '현행 유지'],
          ['90% 이상', '과부하',   '인원 추가 / 동선 단축 / 운반 수단 변경']
        ]}
      />
    </Section>

    <Section title="자주 묻는 질문">
      <Tip type="info">
        <b>Q. 운반 종류에 없는 수단이 있어요.</b><br/>
        A. <b>운반 관리</b> 버튼으로 직접 추가 가능합니다 (이름·속도 입력).
      </Tip>
      <Tip type="warn">측정 도중 다른 탭으로 이동해도 타이머는 계속 돌아갑니다. 단 종료 버튼은 직접 눌러야 합니다.</Tip>
    </Section>
  </>
)

const ElevatorContent = () => (
  <>
    <Section title="이 모듈은 언제 쓰나요?">
      <p>공장 내 여러 엘리베이터(1~9호기)의 운반 효율을 비교하고, 카(케이지) 면적 대비 실제 적재율을 확인합니다.</p>
    </Section>

    <Section title="입력 절차">
      <Step n="1" title="호기 선택">상단 1~9호기 탭에서 측정 대상 호기를 선택합니다.</Step>
      <Step n="2" title="E/V 가로 / 세로 입력 (단위: m)">예: 가로 2.2 m, 세로 1.5 m → 면적 자동 3.3 m².</Step>
      <Step n="3" title="실 적재 항목 추가">박스/대차/파렛트 등 실제로 싣는 물건의 종류·개수·치수(m)를 입력합니다. 적재 단수는 호기 전체 공통값으로 입력합니다.</Step>
      <Step n="4" title="측정 회차 시작">
        4단계 카드의 시간을 잽니다.
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li><b>로딩</b>: E/V 안에 짐을 실는 시간 + 자재 종수</li>
          <li><b>이동</b>: 층간 이동 시간 (1~10층)</li>
          <li><b>언로딩</b>: 도착 층에서 내리는 시간 (공정 번호)</li>
          <li><b>회수</b>: 빈 차로 복귀</li>
        </ul>
      </Step>
      <Step n="5" title="부하 가중치 / 시간당 공급횟수 입력">측정 결과 카드에서 가중치(0.5~1.0)와 <b>시간당 공급횟수(회/h, 기본 1)</b>를 입력합니다. 부하율은 평균 1회 시간 × 공급횟수로 환산됩니다.</Step>
    </Section>

    <Section title="자동 산출 공식">
      <Formula>{`E/V 면적       = 가로 × 세로                         [m²]
실 적재 면적   = Σ (가로 × 세로 × 개수) ÷ 적재 단수   [m²]
E/V 적재율(%) = 실 적재 면적 ÷ E/V 면적 × 100

평균 1회 운반 시간 = Σ (로딩+이동+언로딩+회수) ÷ 측정 횟수
E/V 부하율(%) = (평균 1회 × 시간당 공급횟수) ÷ (3600 × 가중치) × 100`}</Formula>
    </Section>

    <Section title="호기별 비교 대시보드">
      <p>2개 이상 호기를 측정하면 화면 하단에 <b>호기별 부하 분석 대시보드</b>가 자동으로 표시됩니다:</p>
      <ul style={{ paddingLeft: 18, marginTop: 6 }}>
        <li>호기별 작업 시간 막대그래프 (로딩/이동/언로딩/회수 색상 구분)</li>
        <li>호기별 부하율 % 가로 막대 (90% 초과 시 빨간색)</li>
      </ul>
      <Tip type="ok">호기별 격차가 크다면 운영 정책 재검토 시그널입니다.</Tip>
    </Section>
  </>
)

const AreaContent = () => (
  <>
    <Section title="이 모듈은 언제 쓰나요?">
      <p>공장을 여러 구역으로 나눠 <b>면적 사용 효율</b>과 <b>적재 체적(높이) 효율</b>을 동시에 분석합니다. 공간 재배치 검토 시 활용.</p>
    </Section>

    <Section title="입력 절차">
      <Step n="1" title="공장 전체 치수">공장 가로·세로(m), 공장 사진(선택).</Step>
      <Step n="2" title="구역 추가">+ 구역 버튼으로 1구역, 2구역, …을 추가. 각 구역의 가로·세로·사진 입력.</Step>
      <Step n="3" title="적재 항목 입력">
        각 구역의 실제 적재물(박스/파렛트/대차/Rack/기타)을:
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li>종류, 개수, 가로(m), 세로(m)</li>
          <li><b>최저 높이</b> (전체 적재 중 가장 낮은 적재 높이, m)</li>
          <li><b>최고 높이</b> (가장 높은 적재 높이, m)</li>
          <li><b>최고 높이 점유율</b> (0.5~1.0, 최고 적재 높이 대비 점유 수준 — 통상 0.8)</li>
          <li>실 적재 사진 (선택)</li>
        </ul>
      </Step>
    </Section>

    <Section title="자동 산출 공식">
      <Formula>{`구역 면적       = 가로 × 세로                       [m²]
합계 면적       = 가로 × 세로 × 개수                [m²]
면적 효율(%)    = 합계 면적 ÷ 구역 면적 × 100

체적 손실율(%) = ((최고 − 최저) ÷ 최고) × 최고 높이 점유율
평균 체적 사용율 = ((최고 − 손실량) ÷ 최고) 항목 평균`}</Formula>
      <Tip>예: 최고 5.0 m, 최저 0.5 m, 최고 높이 점유율 0.5 → 체적 손실율 45%. 사용율 55%.</Tip>
    </Section>

    <Section title="결과 시각화">
      <p>모듈 하단에 <b>구역별 면적 효율 분석</b> 막대그래프가 자동으로 표시됩니다:</p>
      <ul style={{ paddingLeft: 18, marginTop: 6 }}>
        <li>각 구역의 효율(%)을 막대로 비교</li>
        <li>실제 사용 면적 / 구역 전체 면적 동시 표시</li>
        <li>공장 전체 면적도 함께 표기</li>
      </ul>
      <Tip type="warn">효율 90% 초과 = 포화 상태(통로 확보 필요). 50% 미만 = 활용도 낮음 → 재배치 검토.</Tip>
    </Section>
  </>
)

const InventoryContent = () => (
  <>
    <Section title="이 모듈은 언제 쓰나요?">
      <p><b>UPH 기준 재고</b> 탭에서 고객사로 공급하는 물량이 부족하지 않도록 적정 재고 보관량을 계산합니다. 부족/잉여 차이의 절대값 + 운반 리드타임 + 고객사 운영 재고를 합산합니다.</p>
    </Section>

    <Section title="4단계 입력">
      <Step n="1" title="① 자사 기초 재고 — 고객/자사 라인">
        고객 주간/야간 UPH 및 작업 시간, 자사 주간/야간 UPH 및 작업 시간 입력.<br/>
        → <b>일일 부족/잉여 차이 = 고객 일일 − 자사 일일</b>. 최종 재고 계산에는 절대값을 적용합니다.
      </Step>
      <Step n="2" title="② 운반 리드타임 → 수량 환산">
        4가지 시간(초)을 입력하면 자동으로 수량(대)으로 환산됩니다:
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li><b>숙성 시간</b>: 자사에서 출하 전 보관 시간</li>
          <li><b>안심 재고 시간 (정책성)</b>: 운반 사고/설비 고장/차량 수배 등 대비</li>
          <li><b>Depot ~ 상차 시간</b>: 출하 대기 + 상차 시간</li>
          <li><b>자사 ~ 고객 이동 시간</b>: 물류 운반 시간</li>
        </ul>
      </Step>
      <Step n="3" title="③ 고객사 운영 재고">
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li><b>Dock ~ Depot 하차 시간</b>: 고객 측 하역 시간</li>
          <li><b>대기 시간</b>: 고객 조립 라인 투입 전 보관 시간</li>
          <li><b>고객 안전 재고 시간</b>: 7대 로스 감안</li>
        </ul>
      </Step>
      <Step n="4" title="④ Total 적정 재고 = ① 절대값 + ② + ③">
        자동 합산되어 최하단에 표시됩니다.
      </Step>
    </Section>

    <Section title="자동 산출 공식">
      <Formula>{`고객 일일 생산   = 주간(UPH × 시간) + 야간(UPH × 시간)
자사 일일 생산   = 주간(UPH × 시간) + 야간(UPH × 시간)
일일 부족/잉여 차이 = 고객 일일 − 자사 일일
                  ※ 양수 → 부족 / 음수 → 자사 잉여(녹색 표시)
적용 수량        = |일일 부족/잉여 차이|

각 시간 → 수량 = (시간 ÷ 3600) × 고객 주간 UPH
리드타임 재고   = 숙성 + 안심 + 상차 + 이동 수량
운영 재고      = 하차 + 대기 + 안전 재고 수량
Total 적정 재고 = 적용 수량 + 리드타임 재고 + 운영 재고`}</Formula>
    </Section>

    <Section title="용어 정리">
      <Table
        headers={['용어', '설명']}
        rows={[
          ['UPH', 'Units Per Hour — 시간당 생산 수량'],
          ['숙성 보관', '품질 안정화를 위한 출하 전 보관'],
          ['안심 재고', '돌발 상황(사고/고장) 대비 추가 재고'],
          ['Depot', '물류 거점 / 출하 대기 장소'],
          ['7대 로스', '7가지 운영 손실 (불량/대기/이동 등) 감안'],
          ['리드타임', '주문~납품까지 걸리는 총 시간']
        ]}
      />
      <Tip>모든 시간 입력은 <b>초(sec)</b> 단위입니다. 1시간 = 3600초.</Tip>
    </Section>

    <Section title="적정 Space 산출 (보너스)">
      <p>Total 적정 재고 수량을 <b>실제 창고 바닥 면적(m²)</b>으로 환산합니다.</p>
      <Formula>{`1단 면적     = 가로 × 세로                       [m²]
필요 바닥 면적 = 1단 × 적정 재고 ÷ 높이(단)         [m²]
최종 적정 면적 = 필요 바닥 면적 × 여유율            [m²]`}</Formula>
      <Tip>가로/세로(m), 높이(단), 여유율(1.2 = 20% 여유) 입력 시 자동 산출.</Tip>
    </Section>
  </>
)

const InvStatsContent = () => (
  <>
    <Section title="이 모듈은 언제 쓰나요?">
      <p>이론적 산식 대신 <b>실제 운영 데이터(생산·출하·재고)</b>를 통계적으로 분석해 적정 재고를 산출합니다. 일별 실적이 누적될수록 정확도가 높아집니다.</p>
    </Section>

    <Section title="통계적 방법">
      <Formula>{`적정 재고 = 평균 소요량 + (안전계수 × 소요량 편차)
         = 평균 출하량 + Z × 출하량 표준편차`}</Formula>
      <p>안전계수 <b>Z</b>는 목표 서비스율(품절 없이 충족할 확률)에 따라 결정됩니다.</p>
      <Table
        headers={['서비스율', 'Z값', '비고']}
        rows={[
          ['90%',   '1.28',  ''],
          ['95%',   '1.65',  '실무 표준'],
          ['98%',   '2.05',  ''],
          ['99%',   '2.33',  ''],
          ['99.5%', '2.575', '본 모듈 자동 산출'],
          ['99.9%', '3.09',  '본 모듈 자동 산출']
        ]}
      />
    </Section>

    <Section title="사용 절차">
      <Step n="1" title="제품 / 모델 선택">상단 드롭다운에서 분석 대상 선택. ⚙ <b>관리</b> 버튼으로 추가/이름변경/삭제. 제품·모델 조합별로 데이터가 <b>독립 저장</b>됩니다.</Step>
      <Step n="2" title="일자별 실적 입력">+ 일자 추가 또는 <b>엑셀 일괄 입력</b>으로 날짜·생산량·출하량·재고량을 입력합니다. 최소 7일, 권장 30일 이상.</Step>
      <Step n="3" title="자동 산출 확인">통계(평균·표편·Min·Max) + 99.9%/99.5% 적정재고 + 재고 일수 자동 계산.</Step>
      <Step n="4" title="추이 차트 확인">2일 이상 입력 시 생산/출하/재고의 라인 차트 자동 표시.</Step>
    </Section>

    <Section title="결과 해석">
      <Formula>{`99.9% 적정재고 = 평균 출하량 + 출하량 표편 × 3.09
99.5% 적정재고 = 평균 출하량 + 출하량 표편 × 2.575
재고 일수      = 적정재고 ÷ 평균 출하량           [일]`}</Formula>
      <p><b>재고 일수</b>는 현 재고로 몇 일 동안 출하 가능한지를 의미합니다.</p>
      <Tip type="ok">출하량 변동이 클수록 (표준편차 ↑) 안전 재고가 커집니다 — 자연스러운 결과.</Tip>
      <Tip type="warn">데이터가 1~2일뿐이면 표준편차가 의미가 없어 산출 신뢰도가 낮습니다.</Tip>
    </Section>

    <Section title="기존 적정 재고 모듈과 차이">
      <Table
        headers={['항목', '📦 UPH 기준 재고', '📈 실적 기준 재고']}
        rows={[
          ['데이터 종류', '계획/이론 (UPH·시간 등)', '실제 운영 실적'],
          ['적합 시점', '신규 라인 설계 시', '기존 라인 최적화'],
          ['핵심 변수', '고객·자사 UPH, 리드타임', '일별 출하량'],
          ['결과',     '4단계 누적 합산', '평균 + Z × 표편']
        ]}
      />
    </Section>
  </>
)

const AmrContent = () => (
  <>
    <Section title="이 모듈은 언제 쓰나요?">
      <p>공장 운영에 필요한 <b>AMR(자율주행 로봇) 대수</b>를 산출합니다. 생산 Tact와 AMR 왕복 시간을 비교해 최소 필요 대수 + 예비를 계산. <b>여러 아이템을 여러 구역에서 공급</b>하는 경우, 아이템(구역)별로 입력하면 원단위를 합산해 총 대수를 산출합니다.</p>
    </Section>

    <Section title="입력 절차">
      <Step n="1" title="아이템(구역) 추가 / 선택">
        상단 <b>아이템 탭</b>에서 분석할 아이템(구역)을 선택하거나 <b>+ 아이템 추가</b>로 늘립니다. 아이템별 생산·운행 조건이 독립 저장되고, 각 원단위가 합산됩니다.
      </Step>
      <Step n="2" title="생산 수량 정보">
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li><b>Tact Time (초)</b>: 1개 생산에 걸리는 표준 시간</li>
          <li><b>회수율 (%)</b>: 양품 비율 (예: 90%)</li>
          <li><b>장입 수량 (개/회)</b>: AMR 1회당 운반 가능한 제품 수</li>
        </ul>
      </Step>
      <Step n="3" title="AMR 운행 정보">
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li>AMR Speed (m/s) — 기종 사양 (통상 1.0~2.0)</li>
          <li>이동 거리 (m, 편도) — 출발점에서 도착점까지</li>
          <li>로딩 횟수 / 시간 (초/회) — 1 사이클에서 짐 싣기</li>
          <li>언로딩 횟수 / 시간 — 1 사이클에서 짐 내리기</li>
        </ul>
      </Step>
      <Step n="4" title="AMR 여유율 / 예비 대수 (전체 합산에 1회 적용)">
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li><b>AMR 여유율</b>: 충전/수리·동선 여유를 반영하는 계수 (예: 1.2)</li>
          <li><b>Spare (예비)</b>: 갑작스러운 고장 대비 추가 대수 (통상 1)</li>
        </ul>
      </Step>
    </Section>

    <Section title="자동 산출 공식">
      <Formula>{`[아이템(구역)별]
UPH               = (3600 ÷ Tact) × 회수율
AMR 운행 횟수     = UPH ÷ 장입 수량
AMR 1회 Cycle Time = 3600 ÷ 운행 횟수
왕복 이동 거리    = 거리 × 2
총 왕복 시간      = (왕복 거리 ÷ Speed) + 로딩 + 언로딩
AMR 원단위        = 총 왕복시간 ÷ Cycle

[전체 합산]
총 원단위        = Σ 아이템별 원단위
여유율 적용 대수 = ⌈ 총 원단위 × AMR 여유율 ⌉
필요 대수        = 여유율 적용 대수 + Spare`}</Formula>
      <Tip>여러 아이템을 합산: 예) 0.2 + 0.4 + 0.2 = 0.8대 → 여유율·올림·Spare는 합산 원단위에 한 번만 적용. ⌈ ⌉ 는 올림(ceiling).</Tip>
    </Section>

    <Section title="계산 예시">
      <Table
        headers={['항목', '입력값']}
        rows={[
          ['Tact Time', '60초'],
          ['회수율', '90%'],
          ['장입 수량', '5개/회'],
          ['AMR Speed', '1.5 m/s'],
          ['편도 거리', '60 m'],
          ['로딩 횟수 × 시간', '1회 × 15초'],
          ['언로딩 횟수 × 시간', '1회 × 15초'],
          ['AMR 여유율', '1.2'],
          ['Spare', '1대']
        ]}
      />
      <Formula>{`UPH = 3600 / 60 × 0.9 = 54
운행 횟수 = 54 / 5 = 10.8회/h
Cycle = 3600 / 10.8 ≈ 333초

왕복 거리 = 120 m
왕복 시간 = 120/1.5 + 15 + 15 = 110초

아이템 원단위 = 110 / 333 = 0.33대
총 원단위 = 0.33대  (아이템 1개 기준, 여러 개면 합산)
필요 대수 = ⌈ 0.33 × 1.2 ⌉ + 1 = ⌈0.40⌉ + 1 = 2대`}</Formula>
    </Section>
  </>
)

const PersonnelPlanContent = () => (
  <>
    <Section title="이 모듈은 언제 쓰나요?">
      <p>적재 Item별 피킹·언로딩·이동 시간과 일 작업 시간을 기준으로 <b>물류 운반에 필요한 적정 인원</b>을 산출합니다. 참조 엑셀과 같은 컬럼 구조로 일괄 입력할 수 있습니다.</p>
    </Section>

    <Section title="입력 절차">
      <Step n="1" title="Item 추가/선택">상단 Item 탭에서 분석할 적재 Item을 선택합니다. <b>+ Item 추가</b>로 여러 항목을 분리해 계산합니다.</Step>
      <Step n="2" title="1회 운반 시간 입력">피킹 시간, 언로딩 시간, 1회 이동거리, 1회 이동 속도를 입력하면 1회 이동 시간과 1회 운반 시간이 자동 계산됩니다.</Step>
      <Step n="3" title="일 운반 시간 입력">시간당 운반 횟수와 일 작업 시간을 입력하면 일 운반 횟수와 일 운반 시간이 자동 계산됩니다.</Step>
      <Step n="4" title="표준 작업 시간 적용">표준작업 여유율을 입력하면 표준 운반 작업 시간과 최종 적정 인원이 산출됩니다.</Step>
    </Section>

    <Section title="자동 산출 공식">
      <Formula>{`이동 시간       = 왕복 이동 거리 ÷ 이동 속도
물류 운반 시간   = 피킹 시간 + 언로딩 시간 + 이동 시간
일 운반 횟수     = 시간당 운반 횟수 × 일 작업 시간
일 운반 시간     = 물류 운반 시간 × 일 운반 횟수
표준 운반 작업 시간 = 일 작업 시간 × 3600초 × 표준작업 여유율
최종 적정 인원     = 일 운반 시간 ÷ 표준 운반 작업 시간`}</Formula>
      <Tip>휴대폰 하단 탭에서는 공간을 줄이기 위해 <b>물류인원</b>으로 표시됩니다.</Tip>
    </Section>
  </>
)

const WarehouseAreaContent = () => (
  <>
    <Section title="이 모듈은 언제 쓰나요?">
      <p><b>UPH 기준</b> 또는 <b>용기 사이즈 기준</b>을 선택해 Item별 물류 필요 면적을 산출합니다. 참조 엑셀 양식과 동일한 구조로 일괄 입력할 수 있습니다.</p>
    </Section>

    <Section title="입력 절차">
      <Step n="1" title="기준 선택">상단에서 <b>필요면적(UPH 기준)</b> 또는 <b>필요면적(용기 사이즈 기준)</b>을 선택합니다.</Step>
      <Step n="2" title="Item별 입력">Item 탭에서 적재 Item과 적재 종류를 입력하고, UPH 기준은 UPH·작업 시간·수용수·<b>용기 Size 가로/세로</b>·<b>면적 여유율</b>을, 용기 기준은 용기 개수·치수를 입력합니다.</Step>
      <Step n="3" title="합계 확인">항목별 최종 면적과 <b>물류 필요 면적 합계</b>를 확인합니다.</Step>
    </Section>

    <Section title="자동 산출 공식">
      <Formula>{`[UPH 기준]
일 생산수량 = UPH × 작업 시간
일 적재 수량 = 일 생산수량 ÷ 수용수
공급 포함 적재수량 = 일 적재 수량 × 1.3 (공급버퍼 30%)
단위 면적 = 용기 Size 가로 × 용기 Size 세로
최종 적정 면적 = 공급 포함 적재수량 × (단위 면적 × 면적 여유율)

[용기 사이즈 기준]
바닥 적재 수량 = 가로 개수 × 세로 개수
필요 면적 = 바닥 적재 수량 × 단위 면적 × 여유율`}</Formula>
      <Tip>면적 여유율은 <b>수동 대차 220% / AMR 대차 280% / Rack 3단 박스 84%</b> 프리셋 또는 직접 입력. 휴대폰 하단 탭에서는 <b>창고면적</b>으로 표시됩니다.</Tip>
    </Section>
  </>
)

const AutomationRateContent = () => (
  <>
    <Section title="이 모듈은 언제 쓰나요?">
      <p>자동화 적용 Item 수와 Re-Handling Item 수를 기준으로 <b>물류 자동화율</b>과 <b>Re-Handling율</b>을 함께 확인합니다.</p>
    </Section>

    <Section title="입력 절차">
      <Step n="1" title="자동화 Item 입력">전체 Item 수와 자동화 적용 Item 수를 입력합니다.</Step>
      <Step n="2" title="Re-Handling 입력">총 입고 Item 수와 Re-Handling Item 수를 입력합니다.</Step>
      <Step n="3" title="현장 사진 첨부">필요하면 자동화 구간 또는 Re-Handling 구간 사진을 첨부해 근거를 남깁니다.</Step>
    </Section>

    <Section title="자동 산출 공식">
      <Formula>{`물류 자동화율(%)  = 자동화 적용 Item 수 ÷ 총 입고 Item 수 × 100
Re-Handling율(%) = Re-Handling Item 수 ÷ 총 입고 Item 수 × 100`}</Formula>
      <Tip>휴대폰 하단 탭에서는 <b>자동화율</b>로 표시됩니다.</Tip>
    </Section>
  </>
)

const CONTENTS = {
  intro: <IntroContent />,
  worker: <WorkerContent />,
  elevator: <ElevatorContent />,
  area: <AreaContent />,
  inventory: <InventoryContent />,
  invStats: <InvStatsContent />,
  amr: <AmrContent />,
  personnelPlan: <PersonnelPlanContent />,
  warehouseArea: <WarehouseAreaContent />,
  automationRate: <AutomationRateContent />
}

export default function HelpModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('intro')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: 12 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          width: '100%',
          maxWidth: 920,
          maxHeight: 'calc(100vh - 24px)',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        {/* 헤더 */}
        <div style={{
          padding: '14px 18px',
          background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="brand-badge">NOL-IS</span>
              <span>LWO 사용 설명서</span>
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: 2 }}>Logistics Work Optimizer 상세 가이드 + 공식 + 예시</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            width: 34, height: 34,
            borderRadius: 8,
            fontSize: '1.1rem',
            cursor: 'pointer',
            fontWeight: 800
          }}>✕</button>
        </div>

        {/* 탭 */}
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '8px 8px 0',
          background: C.primarySofter,
          borderBottom: `1px solid ${C.border}`,
          overflowX: 'auto',
          flexShrink: 0
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: '0 0 auto',
                padding: '8px 14px',
                background: activeTab === t.id ? 'white' : 'transparent',
                color: activeTab === t.id ? C.primaryDark : C.textMuted,
                fontWeight: activeTab === t.id ? 800 : 600,
                border: 'none',
                borderRadius: '8px 8px 0 0',
                borderTop: activeTab === t.id ? `3px solid ${C.primary}` : '3px solid transparent',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: 4 }}>{t.icon}</span>{t.title}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 22px 28px', background: 'white' }}>
          {CONTENTS[activeTab]}
        </div>
      </div>
    </div>
  )
}
