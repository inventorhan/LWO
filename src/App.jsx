import { useState, useRef, useEffect } from 'react'
import { useAppState, initialState, migrateAppState, resolveLengthUnit } from './store'
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
import { LANGUAGE_KEY, getLanguage, setLanguage, syncLanguage, lwoText } from './i18n'

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
    state, setState, storageWarning, storageBlocked, setStorageBlocked, rawStoredData,
    storageReadError, numericBackup, setNumericBackup,
    updateWorker, updateArea, updateInventory, updateAmr,
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
  const [unitPromptDismissed, setUnitPromptDismissed] = useState(false)
  const [language, setLanguageState] = useState(getLanguage)
  const toastTimer = useRef(null)
  const bottomNavRef = useRef(null)

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === LANGUAGE_KEY || event.key === null) {
        setLanguageState(syncLanguage(event.newValue))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    document.documentElement.lang = { Korean: 'ko', English: 'en', Chinese: 'zh-CN' }[language]
  }, [language])

  useEffect(() => {
    if (!bottomNavRef.current) return
    const activeBtn = bottomNavRef.current.querySelector('.nav-item.active')
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeTab])

  const showToast = (msg) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }

  const handleLanguageChange = (event) => {
    try {
      setLanguage(event.target.value)
      setLanguageState(event.target.value)
    } catch (error) {
      console.error('Could not save the language preference:', error)
      showToast(lwoText('언어 설정을 저장하지 못했습니다.'))
    }
  }

  const pendingUnitSections = ['area', 'elevator'].filter(section => state[section]?._unit === 'unknown')
  const unitSection = pendingUnitSections[0]

  const handleSave = async () => {
    try {
      const filename = `LWO_분석_${new Date().toISOString().slice(0, 10)}.json`
      const json = JSON.stringify(state, null, 2)
      await saveJson(filename, json)
      showToast(lwoText('💾 저장 완료 (Documents/LWO/{filename})', { filename }))
    } catch (err) {
      console.error(err)
      showToast(lwoText('⚠️ 저장 중 오류가 발생했습니다.'))
    }
  }

  const handleLoad = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target.result)
        if (storageBlocked && rawStoredData && !window.confirm(lwoText('읽을 수 없는 기존 저장본을 새 파일로 교체합니다. 원본 백업을 먼저 내려받았습니까?'))) return
        setState(migrateAppState(loaded))
        setNumericBackup(null)
        setStorageBlocked(false)
        setUnitPromptDismissed(false)
        showToast(lwoText('📂 데이터를 불러왔습니다.'))
      } catch {
        showToast(lwoText('⚠️ 파일 형식이 잘못되었습니다.'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExportExcel = async () => {
    if (pendingUnitSections.length) {
      setUnitPromptDismissed(false)
      showToast(lwoText('⚠️ 면적/E/V 길이 단위를 먼저 확인해 주세요.'))
      return
    }
    try {
      await exportToExcel(state)
      showToast(lwoText('📊 엑셀 저장 완료 (Documents/LWO/)'))
    } catch (err) {
      console.error(err)
      showToast(lwoText('⚠️ 엑셀 저장 중 오류가 발생했습니다.'))
    }
  }

  const handleReset = () => {
    if (window.confirm(lwoText('모든 입력 데이터를 초기화합니다. 진행하시겠습니까?'))) {
      try {
        localStorage.removeItem('lwo_app_persistent_data')
        localStorage.removeItem('lwo_app_persistent_data_measurements_backup')
      } catch (err) {
        console.error('저장 데이터 초기화 실패:', err)
        showToast(lwoText('⚠️ 저장 데이터 초기화에 실패했습니다.'))
        return
      }
      setState(initialState)
      setNumericBackup(null)
      setStorageBlocked(false)
      showToast(lwoText('🔄 초기화되었습니다.'))
    }
  }

  const handleSaveOriginal = async () => {
    if (!rawStoredData) {
      showToast(lwoText('⚠️ 내려받을 기존 저장본을 읽을 수 없습니다.'))
      return
    }
    try {
      await saveJson('LWO_기존_저장원본.txt', rawStoredData)
      showToast(lwoText('💾 기존 저장 원본을 내려받았습니다.'))
    } catch (err) {
      console.error(err)
      showToast(lwoText('⚠️ 원본 백업 저장에 실패했습니다.'))
    }
  }

  const handleNumericBackup = async (restore) => {
    try {
      if (!numericBackup) throw new Error('수치 임시 백업이 없습니다.')
      if (!restore) {
        await saveJson('LWO_수치_임시백업.json', numericBackup)
        showToast(lwoText('💾 수치 임시 백업을 내려받았습니다.'))
        return
      }
      if (!window.confirm(lwoText('수치 임시 백업에는 사진이 없습니다. 기존 저장본을 백업하고 이 수치로 복구하시겠습니까?'))) return
      setState(migrateAppState(JSON.parse(numericBackup)))
      setNumericBackup(null)
      setStorageBlocked(false)
      setUnitPromptDismissed(false)
    } catch (err) {
      console.error('수치 임시 백업 처리 실패:', err)
      showToast(lwoText('⚠️ 수치 임시 백업을 처리하지 못했습니다.'))
    }
  }

  const handleKeepOriginal = () => {
    if (!window.confirm(lwoText('수치 임시 백업을 사용하지 않고 기존 저장본을 유지합니다. 필요한 경우 먼저 수치 백업을 내려받으세요.'))) return
    setNumericBackup(null)
    setStorageBlocked(false)
  }

  /* 사진 추가/삭제 wrap — 에러 시 사용자 알림 */
  const safeAddPhoto = async (module, category, file) => {
    try {
      await addPhoto(module, category, file)
    } catch (err) {
      console.error(err)
      showToast(lwoText('⚠️ 사진을 처리할 수 없습니다. 다시 시도해 주세요.'))
    }
  }

  const renderModule = () => {
    if (['area', 'elevator'].includes(activeTab) && state[activeTab]?._unit === 'unknown') {
      return <div className="section-card">
        <p>{lwoText('기존 길이 단위를 확인하기 전에는 이 항목의 계산을 표시하지 않습니다.')}</p>
        <button className="header-btn" onClick={() => setUnitPromptDismissed(false)}>{lwoText('단위 확인')}</button>
      </div>
    }
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
                onClick={() => setInventoryMode('uph')}>{lwoText('UPH 기준 재고')}</button>
              <button className={`segmented-btn ${inventoryMode === 'stats' ? 'active' : ''}`}
                onClick={() => setInventoryMode('stats')}>{lwoText('실적 기준 재고')}</button>
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
              <span className="nav-text">{lwoText(tab.label)}</span>
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
          <select className="language-select" value={language} onChange={handleLanguageChange} aria-label={lwoText('언어 선택')}>
            <option value="Korean">한국어</option>
            <option value="English">English</option>
            <option value="Chinese">中文</option>
          </select>
          <label className="header-btn" title={lwoText('JSON 데이터 불러오기')}>
            <span>📂</span><span className="hide-sm">{lwoText('열기')}</span>
            <input type="file" accept=".json,application/json" onChange={handleLoad} style={{ display: 'none' }} />
          </label>
          <button className="header-btn" onClick={handleSave} title={lwoText('JSON 저장')}>
            <span>💾</span><span className="hide-sm">{lwoText('저장')}</span>
          </button>
          <button className="header-btn btn-excel" onClick={handleExportExcel} title={lwoText('Excel 내보내기')}>
            <span>📊</span><span className="hide-sm">{lwoText('엑셀')}</span>
          </button>
          <button className="header-btn" onClick={() => setHelpOpen(true)} title={lwoText('사용 설명서 열기')}>
            <span>📖</span><span className="hide-sm">{lwoText('설명서')}</span>
          </button>
          <button className="header-btn btn-reset" onClick={handleReset} title={lwoText('모든 입력 초기화')}>
            <span>🔄</span>
          </button>
        </div>
      </header>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <main className="app-content">
        {storageWarning && <div role="alert" className="storage-warning">
          <span>{lwoText(storageWarning)}</span>
          {storageBlocked
            ? <>
                {rawStoredData && <button onClick={handleSaveOriginal}>{lwoText('기존 원본 백업')}</button>}
                {numericBackup && <>
                  <button onClick={() => handleNumericBackup(false)}>{lwoText('수치 백업 내려받기')}</button>
                  <button onClick={() => handleNumericBackup(true)}>{lwoText('수치 백업 복구')}</button>
                  {!storageReadError && <button onClick={handleKeepOriginal}>{lwoText('기존 저장본 유지')}</button>}
                </>}
              </>
            : <button onClick={handleSave}>{lwoText('현재 데이터 JSON 저장')}</button>}
        </div>}
        {pendingUnitSections.length > 0 && unitPromptDismissed && <div role="status" className="storage-warning">
          <span>{lwoText('기존 면적/E/V 데이터의 길이 단위를 확인해야 계산할 수 있습니다.')}</span>
          <button onClick={() => setUnitPromptDismissed(false)}>{lwoText('단위 확인')}</button>
        </div>}
        <div className="module-wrap">
          {renderModule()}
        </div>
      </main>

      {/* Bottom nav (Mobile/Tablet only) */}
      <nav className="bottom-nav" ref={bottomNavRef}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{lwoText(tab.short)}</span>
          </button>
        ))}
      </nav>

      {unitSection && !unitPromptDismissed && <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="unit-choice-title">
        <div className="unit-choice-modal">
          <h2 id="unit-choice-title">{lwoText('기존 길이 단위 확인')}</h2>
          <p>
            {lwoText('{section} 데이터에 단위 정보가 없습니다. 값만으로 m와 mm를 구별할 수 없어 자동 변환하지 않았습니다.', {
              section: lwoText(unitSection === 'area' ? '면적 효율' : 'E/V 부하율')
            })}
          </p>
          <p>{lwoText('이 항목의 기존 값이 모두 어떤 단위로 입력됐는지 확인해 주세요. 단위가 섞였다면 m로 유지한 뒤 각 값을 직접 확인하세요.')}</p>
          <div className="unit-choice-actions">
            <button onClick={() => setState(current => resolveLengthUnit(current, unitSection, 'm'))}>{lwoText('m로 입력함 (값 유지)')}</button>
            <button onClick={() => setState(current => resolveLengthUnit(current, unitSection, 'mm'))}>{lwoText('mm로 입력함 (m로 변환)')}</button>
            <button onClick={handleSave}>{lwoText('변환 전 JSON 저장')}</button>
            <button onClick={() => setUnitPromptDismissed(true)}>{lwoText('나중에 확인')}</button>
          </div>
        </div>
      </div>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
