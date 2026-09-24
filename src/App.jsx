import { useState, useRef, useEffect } from 'react'
import { useAppState, initialState, migrateAppState } from './store'
import WorkerWorkload from './modules/WorkerWorkload'
import ElevatorWorkload from './modules/ElevatorWorkload'
import AreaEfficiency from './modules/AreaEfficiency'
import InventoryStorage from './modules/InventoryStorage'
import InventoryStatistics from './modules/InventoryStatistics'
import AmrCalculation from './modules/AmrCalculation'
import LogisticsPersonnel from './modules/LogisticsPersonnel'
import WarehouseArea from './modules/WarehouseArea'
import AutomationRate from './modules/AutomationRate'
import { exportToExcel } from './shared/utils/excelExport'
import { saveJson } from './shared/utils/saveAndShare'
import SplashScreen from './shared/components/SplashScreen'
import HelpModal from './shared/components/HelpModal'

const TABS = [
  { id: 'worker',    label: '작업자 부하율', short: '작업자', icon: '👷' },
  { id: 'elevator',  label: 'E/V 부하율',    short: 'E/V',    icon: '🛗' },
  { id: 'area',      label: '면적 효율',     short: '면적',   icon: '📐' },
  { id: 'inventory', label: '적정 재고량',   short: '재고',   icon: '📦' },
  { id: 'amr',       label: 'AMR 대수',      short: 'AMR',    icon: '🤖' },
  { id: 'personnelPlan', label: '물류 적정 인원', short: '물류인원', icon: '👥' },
  { id: 'warehouseArea', label: '물류 창고 면적', short: '창고면적', icon: '🏭' },
  { id: 'automationRate', label: '물류 자동화율', short: '자동화율', icon: '⚙️' },
]

export default function App() {
  const {
    state, setState, updateWorker, updateArea, updateInventory, updateAmr,
    updateLogisticsPersonnel, updateWarehouseArea, updateAutomationRate,
    addPhoto, removePhoto, addPersonnel, removePersonnel, updatePersonnel,
    addCycle, removeCycle, updateCycleCard, addCardInCycle, removeCardInCycle,
    switchPersonnel, addTransportType, updateTransportType, removeTransportType,
    switchHogi, removeHogi, updateElevatorBasic,
    addElevatorCycle, removeElevatorCycle, updateElevatorCycleCard,
    addElevatorCard, removeElevatorCard,
    addElevatorLoadItem, updateElevatorLoadItem, removeElevatorLoadItem,
    updateInventoryStats,
    addInvProduct, removeInvProduct, renameInvProduct,
    addInvModel, removeInvModel, renameInvModel,
    setActiveInvProduct, setActiveInvModel,
    addInvStatsRecord, updateInvStatsRecord, removeInvStatsRecord, clearInvStatsRecords
  } = useAppState()

  const [activeTab, setActiveTab] = useState('worker')
  const [inventoryMode, setInventoryMode] = useState('uph')
  const [toast, setToast] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }

  useEffect(() => {
    const handleStorageWarn = (e) => {
      showToast(`⚠️ ${e.detail || '저장 공간이 부족합니다.'}`)
    }
    window.addEventListener('lwo-storage-warning', handleStorageWarn)
    return () => window.removeEventListener('lwo-storage-warning', handleStorageWarn)
  }, [])

  const handleSave = async () => {
    try {
      const filename = `LWO_분석_${new Date().toISOString().slice(0, 10)}.json`
      const json = JSON.stringify(state, null, 2)
      await saveJson(filename, json)
      showToast(`💾 저장 완료 (Documents/LWO/${filename})`)
    } catch (err) {
      console.error(err)
      showToast('⚠️ 저장 중 오류가 발생했습니다.')
    }
  }

  const handleLoad = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target.result)
        setState(migrateAppState(loaded))
        showToast('📂 데이터를 불러왔습니다.')
      } catch {
        showToast('⚠️ 파일 형식이 잘못되었습니다.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExportExcel = async () => {
    try {
      await exportToExcel(state)
      showToast('📊 엑셀 저장 완료 (Documents/LWO/)')
    } catch (err) {
      console.error(err)
      showToast('⚠️ 엑셀 저장 중 오류가 발생했습니다.')
    }
  }

  const handleReset = () => {
    if (window.confirm('모든 입력 데이터를 초기화합니다. 진행하시겠습니까?')) {
      setState(initialState)
      try { localStorage.removeItem('lwo_app_persistent_data') } catch { /* ignore local reset failures */ }
      showToast('🔄 초기화되었습니다.')
    }
  }

  /* 사진 추가/삭제 wrap — 에러 시 사용자 알림 */
  const safeAddPhoto = async (module, category, file) => {
    try {
      await addPhoto(module, category, file)
    } catch (err) {
      console.error(err)
      showToast('⚠️ 사진을 처리할 수 없습니다. 다시 시도해 주세요.')
    }
  }

  const renderModule = () => {
    switch (activeTab) {
      case 'worker':
        return <WorkerWorkload
          key={state.worker.activePersonnel}
          data={state.worker}
          updateData={updateWorker}
          addPhoto={(cat, file) => safeAddPhoto('worker', cat, file)}
          removePhoto={(cat, idx) => removePhoto('worker', cat, idx)}
          addPersonnel={addPersonnel}
          removePersonnel={removePersonnel}
          updatePersonnel={updatePersonnel}
          addCycle={addCycle}
          removeCycle={removeCycle}
          updateCycleCard={updateCycleCard}
          addCardInCycle={addCardInCycle}
          removeCardInCycle={removeCardInCycle}
          switchPersonnel={switchPersonnel}
          addTransportType={addTransportType}
          updateTransportType={updateTransportType}
          removeTransportType={removeTransportType}
        />
      case 'elevator':
        return <ElevatorWorkload
          data={state.elevator}
          switchHogi={switchHogi}
          removeHogi={removeHogi}
          updateElevatorBasic={updateElevatorBasic}
          addElevatorCycle={addElevatorCycle}
          removeElevatorCycle={removeElevatorCycle}
          updateElevatorCycleCard={updateElevatorCycleCard}
          addElevatorCard={addElevatorCard}
          removeElevatorCard={removeElevatorCard}
          addElevatorLoadItem={addElevatorLoadItem}
          updateElevatorLoadItem={updateElevatorLoadItem}
          removeElevatorLoadItem={removeElevatorLoadItem}
          addPhoto={(file) => safeAddPhoto('elevator', null, file)}
          removePhoto={(idx) => removePhoto('elevator', null, idx)}
        />
      case 'area':
        return <AreaEfficiency data={state.area} updateData={updateArea} />
      case 'inventory':
        return <>
          <div className="section-card compact-mode-card">
            <div className="segmented-control">
              <button className={`segmented-btn ${inventoryMode === 'uph' ? 'active' : ''}`}
                onClick={() => setInventoryMode('uph')}>UPH 기준 재고</button>
              <button className={`segmented-btn ${inventoryMode === 'stats' ? 'active' : ''}`}
                onClick={() => setInventoryMode('stats')}>실적 기준 재고</button>
            </div>
          </div>
          {inventoryMode === 'uph'
            ? <InventoryStorage data={state.inventory} updateData={updateInventory} />
            : <InventoryStatistics
                key={`${state.inventoryStats.activeProduct}::${state.inventoryStats.activeModel}`}
                data={state.inventoryStats}
                updateData={updateInventoryStats}
                addProduct={addInvProduct}
                removeProduct={removeInvProduct}
                renameProduct={renameInvProduct}
                addModel={addInvModel}
                removeModel={removeInvModel}
                renameModel={renameInvModel}
                setActiveProduct={setActiveInvProduct}
                setActiveModel={setActiveInvModel}
                addRecord={addInvStatsRecord}
                updateRecord={updateInvStatsRecord}
                removeRecord={removeInvStatsRecord}
                clearRecords={clearInvStatsRecords}
              />}
        </>
      case 'amr':
        return <AmrCalculation data={state.amr} updateData={updateAmr} />
      case 'personnelPlan':
        return <LogisticsPersonnel data={state.logisticsPersonnel} updateData={updateLogisticsPersonnel} />
      case 'warehouseArea':
        return <WarehouseArea data={state.warehouseArea} updateData={updateWarehouseArea} />
      case 'automationRate':
        return <AutomationRate data={state.automationRate} updateData={updateAutomationRate} />
      default: return null
    }
  }

  return (
    <div className="app-container">
      <SplashScreen fadeMs={400} />
      {/* Sidebar (Desktop only) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-top">
            <span className="brand-badge">NOL-IS</span>
            <span className="sidebar-suite-tag">Smart Suite</span>
          </div>
          <h1 className="sidebar-title">
            <span className="sidebar-logo-icon">📦</span>
            <span className="sidebar-logo-text">LWO</span>
          </h1>
          <p className="sidebar-desc">Logistics Work Optimizer</p>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-text">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-title">NOL-IS Operations Suite</div>
          <div className="sidebar-footer-sub">v1.3.0 · Web &amp; Mobile</div>
        </div>
      </aside>

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="brand-badge">NOL-IS</span>
          <span className="header-title">LWO</span>
          <span className="header-divider hide-sm">/</span>
          <span className="header-subtitle hide-sm">Logistics Work Optimizer</span>
        </div>
        <div className="header-right">
          <label className="header-btn" title="JSON 데이터 불러오기">
            <span>📂</span><span className="hide-sm">열기</span>
            <input type="file" accept=".json,application/json" onChange={handleLoad} style={{ display: 'none' }} />
          </label>
          <button className="header-btn" onClick={handleSave} title="JSON 저장">
            <span>💾</span><span className="hide-sm">저장</span>
          </button>
          <button className="header-btn btn-excel" onClick={handleExportExcel} title="Excel 내보내기">
            <span>📊</span><span className="hide-sm">엑셀</span>
          </button>
          <button className="header-btn" onClick={() => setHelpOpen(true)} title="사용 설명서 열기">
            <span>📖</span><span className="hide-sm">설명서</span>
          </button>
          <button className="header-btn btn-reset" onClick={handleReset} title="모든 입력 초기화">
            <span>🔄</span>
          </button>
        </div>
      </header>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <main className="app-content">
        <div className="module-wrap">
          {renderModule()}
        </div>
      </main>

      {/* Bottom nav (Mobile/Tablet only) */}
      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.short}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
