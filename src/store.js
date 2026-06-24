import { useState, useCallback, useEffect } from 'react'
import { fileToBase64 } from './shared/utils/common'

const STORAGE_KEY = 'lwo_app_persistent_data'

/* ───── 초기 운반 종류 정의 (PPT 스펙 기준) ───── */
const initialTransportTypes = {
  worker:   { label: '작업자', speed: 2.3 },
  cart:     { label: '대차', speed: 1.8 },
  handcart: { label: '손수레', speed: 1.6 },
  pallet:   { label: '파렛트', speed: 2.0 },
  agv:      { label: 'AGV', speed: 1.5 },
  other:    { label: '기타', speed: 0 }
}

export function migrateLogisticsPersonnel(data = {}) {
  const next = { ...data }
  const hasAvailability = next.availability !== undefined && next.availability !== null && next.availability !== ''
  const availability = parseFloat(next.availability)
  if (hasAvailability && availability > 0 && availability <= 1) {
    next.availability = String((parseFloat(next.weight) || 1.3) * 100)
  }
  return next
}

/* ───── 초기 데이터 템플릿 ───── */
const createInitialWorkerData = (name) => {
  const t = Date.now()
  return {
    basicInfo: { personnel: name, transportType: 'worker', transportQty: 1, speed: 2.3, weight: 0.8, measureCount: 1, supplyPerHour: 1 },
    measurements: [
      {
        id: `cycle-${t}`,
        name: '1',
        cards: [
          { id: `1-pick-${t}`,     type: 'pick',     start: null, end: null, materialCount: 1 },
          { id: `1-move-${t}`,     type: 'move',     start: null, end: null, processNo: 1 },
          { id: `1-load-${t}`,     type: 'load',     start: null, end: null, processNo: 1 },
          { id: `1-recovery-${t}`, type: 'recovery', start: null, end: null }
        ]
      }
    ],
    photos: { transport: [], part: [] }
  }
}

/* ───── E/V 측정 1회차 템플릿 ───── */
const createInitialElevatorMeasurement = (idx = 1) => {
  const t = Date.now()
  return {
    id: `ev-cycle-${t}-${Math.random().toString(36).slice(2, 6)}`,
    name: `${idx}`,
    cards: [
      { id: `ev-${idx}-load-${t}`,   type: 'load',   start: null, end: null, materialCount: '' },
      { id: `ev-${idx}-move-${t}`,   type: 'move',   start: null, end: null, floorNo: 1 },
      { id: `ev-${idx}-unload-${t}`, type: 'unload', start: null, end: null, processNo: 1 }
    ]
  }
}

/* ── Global state ── */
export const initialState = {
  worker: { 
    activePersonnel: '홍길동',
    personnelList: ['홍길동', '김철수', '이영희', '박지민', '최유진'],
    dataByPersonnel: {
      '홍길동': createInitialWorkerData('홍길동')
    },
    transportTypes: initialTransportTypes
  },
  elevator: {
    /* 호기별 데이터: 1~9호기 각각 독립 측정 + 가중치 + 사진 */
    activeHogi: 1,
    /* 호기별 결과 비교를 위해 dataByHogi 저장 (key는 string '1'~'9') */
    dataByHogi: {
      '1': {
        basicInfo: { weight: 0.8, evWidth: '', evDepth: '', stackLevel: 4, supplyPerHour: 1 },
        measurements: [createInitialElevatorMeasurement(1)],
        loadItems: [],   // E/V 적재율 계산용 박스/대차 항목
        photos: []
      }
    }
  },
  area: {
    factory: { width: '', height: '', photo: null },
    /* zones[i].items[j]: 박스/파렛트/대차 + 높이(최저/최고) + 최고 높이 점유율 */
    zones: [
      { no: 1, width: '', height: '', photo: null, items: [] }
    ]
  },
  inventory: {
    /* 자사 기초 재고 */
    customerDayUph: '', customerDayTime: '', customerNightUph: '', customerNightTime: '',
    selfDayUph: '', selfDayTime: '', selfNightUph: '', selfNightTime: '',
    /* 운반 리드타임 */
    ageingTime: '', safetyStockTime: '', depotLoadTime: '', selfToCustomerTime: '',
    /* 고객사 운영 재고 */
    customerDockTime: '', waitTime: '', customerSafetyTime: '',
    /* 적정 Space 산출 */
    spaceWidth: '', spaceDepth: '', spaceHeight: 3, spaceMargin: 1.2
  },
  inventoryStats: {
    /* 실적 기준 적정 재고 (통계 분석) — 제품/모델별로 데이터 분리 */
    productList: ['세탁기'],
    modelsByProduct: { '세탁기': ['Top Loader'] },
    activeProduct: '세탁기',
    activeModel: 'Top Loader',
    /* '제품::모델' → { records: [{ id, date, production, shipment, stock }, ...] } */
    dataByKey: {
      '세탁기::Top Loader': { records: [] }
    }
  },
  amr: { items: [], tactTime: '', recycleRate: '', loadQty: '', amrtSpeed: '', distance: '', loadCount: '', loadTime: '', unloadCount: '', unloadTime: '', operationRate: 1.2, spare: 1 },
  logisticsPersonnel: {
    pickTime: '', loadTime: '', distance: '', speed: 1.2,
    tripsPerHour: '', hoursPerDay: 8, availability: 130, weight: 1.3
  },
  warehouseArea: {
    mode: 'uph',
    uphItems: [],
    containerItems: [],
    items: []
  },
  automationRate: {
    companyName: '', inspector: '', automationPhoto: null, rehandlingPhoto: null,
    totalItems: '', automatedItems: '', rehandlingTotalItems: '', rehandlingItems: ''
  },
  savedAt: null,
}

export function useAppState() {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // 구버전 area(mm 단위)를 m 단위로 마이그레이션 — 1000 이상 값은 mm로 간주하고 ÷1000
        const migrateAreaUnit = (parsedArea) => {
          if (!parsedArea || parsedArea._unit === 'm') return parsedArea
          const conv = (v) => {
            const num = parseFloat(v)
            if (!num) return v
            return num >= 100 ? +(num / 1000).toFixed(2) : v   /* 100m 이상이면 mm 단위라 판단 */
          }
          return {
            ...parsedArea,
            _unit: 'm',
            factory: parsedArea.factory ? {
              ...parsedArea.factory,
              width: conv(parsedArea.factory.width),
              height: conv(parsedArea.factory.height)
            } : parsedArea.factory,
            zones: (parsedArea.zones || []).map(z => ({
              ...z,
              width: conv(z.width),
              height: conv(z.height),
              items: (z.items || []).map(it => ({
                ...it,
                width: conv(it.width),
                depth: conv(it.depth),
                minHeight: conv(it.minHeight),
                maxHeight: conv(it.maxHeight ?? it.height)
              }))
            }))
          }
        }
        // 구버전 elevator(단일 cards)를 호기별 구조로 마이그레이션
        let migratedElevator = parsed.elevator
        if (migratedElevator && Array.isArray(migratedElevator.cards) && !migratedElevator.dataByHogi) {
          const oldHogi = migratedElevator.basicInfo?.hogiNo || 1
          migratedElevator = {
            activeHogi: oldHogi,
            dataByHogi: {
              [String(oldHogi)]: {
                basicInfo: { ...migratedElevator.basicInfo },
                measurements: [{
                  id: `ev-cycle-migrated-${Date.now()}`,
                  name: '1',
                  cards: migratedElevator.cards
                }],
                loadItems: [],
                photos: migratedElevator.photos || []
              }
            }
          }
        }
        // E/V 단위 mm → m 마이그레이션 (100 이상이면 mm로 간주)
        if (migratedElevator && migratedElevator.dataByHogi && migratedElevator._unit !== 'm') {
          const convM = (v) => {
            const num = parseFloat(v)
            if (!num) return v
            return num >= 100 ? +(num / 1000).toFixed(2) : v
          }
          const next = {}
          Object.entries(migratedElevator.dataByHogi).forEach(([k, h]) => {
            next[k] = {
              ...h,
              basicInfo: h.basicInfo
                ? { ...h.basicInfo, evWidth: convM(h.basicInfo.evWidth), evDepth: convM(h.basicInfo.evDepth), stackLevel: h.basicInfo.stackLevel ?? h.loadItems?.[0]?.stackLevel ?? 4 }
                : h.basicInfo,
              loadItems: (h.loadItems || []).map(it => ({
                ...it, width: convM(it.width), depth: convM(it.depth)
              }))
            }
          })
          migratedElevator = { ...migratedElevator, _unit: 'm', dataByHogi: next }
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration.
        setState({
          ...initialState,
          ...parsed,
          worker: {
            ...initialState.worker,
            ...(parsed.worker || {}),
            transportTypes: { ...initialState.worker.transportTypes, ...((parsed.worker || {}).transportTypes || {}) },
            dataByPersonnel: (parsed.worker && parsed.worker.dataByPersonnel) || initialState.worker.dataByPersonnel
          },
          elevator:  { ...initialState.elevator, ...(migratedElevator || {}) },
          area:      { ...initialState.area, ...(migrateAreaUnit(parsed.area) || {}) },
          inventory:      { ...initialState.inventory, ...(parsed.inventory || {}) },
          inventoryStats: (() => {
            const base = { ...initialState.inventoryStats, ...(parsed.inventoryStats || {}) }
            /* v1.2.0 → v1.2.2 마이그레이션: 단일 records → dataByKey 구조 */
            if (parsed.inventoryStats && Array.isArray(parsed.inventoryStats.records)) {
              const p = parsed.inventoryStats.product || '세탁기'
              const m = parsed.inventoryStats.model   || 'Top Loader'
              const key = `${p}::${m}`
              base.productList = base.productList?.includes(p) ? base.productList : [...(base.productList || []), p]
              base.modelsByProduct = {
                ...(base.modelsByProduct || {}),
                [p]: [...new Set([...(base.modelsByProduct?.[p] || []), m])]
              }
              base.activeProduct = p
              base.activeModel = m
              base.dataByKey = { ...(base.dataByKey || {}), [key]: { records: parsed.inventoryStats.records } }
              delete base.records
              delete base.product
              delete base.model
            }
            return base
          })(),
          amr:            { ...initialState.amr, ...(parsed.amr || {}) },
          logisticsPersonnel: { ...initialState.logisticsPersonnel, ...migrateLogisticsPersonnel(parsed.logisticsPersonnel || {}) },
          warehouseArea: { ...initialState.warehouseArea, ...(parsed.warehouseArea || {}) },
          automationRate: { ...initialState.automationRate, ...(parsed.automationRate || {}) }
        })
      } catch {
        // 잘못된 저장 데이터는 무시하고 기본 상태로 시작
      }
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 사진이 너무 많아 quota 초과 등 — 무시
    }
  }, [state])

  const updateWorker = useCallback(u => setState(s => {
    const active = s.worker.activePersonnel
    return { 
      ...s, 
      worker: { 
        ...s.worker, 
        dataByPersonnel: {
          ...s.worker.dataByPersonnel,
          [active]: { ...s.worker.dataByPersonnel[active], ...u }
        }
      } 
    }
  }), [])

  const switchPersonnel = useCallback((newName) => {
    setState(s => {
      const newData = s.worker.dataByPersonnel[newName] ? {} : { [newName]: createInitialWorkerData(newName) }
      return {
        ...s,
        worker: {
          ...s.worker,
          activePersonnel: newName,
          dataByPersonnel: { ...s.worker.dataByPersonnel, ...newData }
        }
      }
    })
  }, [])

  /* ── E/V (호기별) ── */
  const ensureHogiData = (s, hogiKey) => {
    if (!s.elevator.dataByHogi[hogiKey]) {
      return {
        ...s,
        elevator: {
          ...s.elevator,
          dataByHogi: {
            ...s.elevator.dataByHogi,
            [hogiKey]: {
              basicInfo: { weight: 0.8, evWidth: '', evDepth: '', stackLevel: 4, supplyPerHour: 1 },
              measurements: [createInitialElevatorMeasurement(1)],
              loadItems: [],
              photos: []
            }
          }
        }
      }
    }
    return s
  }

  const switchHogi = useCallback((no) => {
    setState(s => {
      const key = String(no)
      const next = ensureHogiData(s, key)
      return { ...next, elevator: { ...next.elevator, activeHogi: no } }
    })
  }, [])

  const removeHogi = useCallback((no) => {
    setState(s => {
      const key = String(no)
      const keys = Object.keys(s.elevator.dataByHogi || {})
      if (keys.length <= 1) return s
      const nextMap = { ...s.elevator.dataByHogi }
      delete nextMap[key]
      const remaining = Object.keys(nextMap).map(k => parseInt(k)).sort((a, b) => a - b)
      const nextActive = (s.elevator.activeHogi === no)
        ? (remaining[0] || 1)
        : s.elevator.activeHogi
      return {
        ...s,
        elevator: {
          ...s.elevator,
          activeHogi: nextActive,
          dataByHogi: nextMap
        }
      }
    })
  }, [])

  const updateElevatorHogi = useCallback((upd) => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: { ...safe.elevator.dataByHogi, [key]: { ...cur, ...upd } }
        }
      }
    })
  }, [])

  const updateElevatorBasic = useCallback((upd) => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: {
            ...safe.elevator.dataByHogi,
            [key]: { ...cur, basicInfo: { ...cur.basicInfo, ...upd } }
          }
        }
      }
    })
  }, [])

  const addElevatorCycle = useCallback(() => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      const next = createInitialElevatorMeasurement((cur.measurements?.length || 0) + 1)
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: {
            ...safe.elevator.dataByHogi,
            [key]: { ...cur, measurements: [...(cur.measurements || []), next] }
          }
        }
      }
    })
  }, [])

  const removeElevatorCycle = useCallback((cycleId) => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      if ((cur.measurements?.length || 0) <= 1) return s
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: {
            ...safe.elevator.dataByHogi,
            [key]: { ...cur, measurements: cur.measurements.filter(m => m.id !== cycleId) }
          }
        }
      }
    })
  }, [])

  const updateElevatorCycleCard = useCallback((cycleId, cardId, upd) => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: {
            ...safe.elevator.dataByHogi,
            [key]: {
              ...cur,
              measurements: cur.measurements.map(m =>
                m.id === cycleId
                  ? { ...m, cards: m.cards.map(c => c.id === cardId ? { ...c, ...upd } : c) }
                  : m
              )
            }
          }
        }
      }
    })
  }, [])

  const addElevatorCard = useCallback((cycleId, cardType) => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      const newCard = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: cardType, start: null, end: null,
        ...(cardType === 'load'   ? { materialCount: '' }
           : cardType === 'unload' ? { processNo: 1 }
           : cardType === 'move'   ? { floorNo: 1 } : {})
      }
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: {
            ...safe.elevator.dataByHogi,
            [key]: {
              ...cur,
              measurements: cur.measurements.map(m =>
                m.id === cycleId ? { ...m, cards: [...m.cards, newCard] } : m
              )
            }
          }
        }
      }
    })
  }, [])

  const removeElevatorCard = useCallback((cycleId, cardId) => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: {
            ...safe.elevator.dataByHogi,
            [key]: {
              ...cur,
              measurements: cur.measurements.map(m =>
                m.id === cycleId ? { ...m, cards: m.cards.filter(c => c.id !== cardId) } : m
              )
            }
          }
        }
      }
    })
  }, [])

  /* ── E/V 적재 항목 (적재율 계산용) ── */
  const addElevatorLoadItem = useCallback(() => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      const item = { id: `el-${Date.now()}`, type: '박스', qty: 1, width: '', depth: '' }
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: {
            ...safe.elevator.dataByHogi,
            [key]: { ...cur, loadItems: [...(cur.loadItems || []), item] }
          }
        }
      }
    })
  }, [])

  const updateElevatorLoadItem = useCallback((id, upd) => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: {
            ...safe.elevator.dataByHogi,
            [key]: { ...cur, loadItems: (cur.loadItems || []).map(it => it.id === id ? { ...it, ...upd } : it) }
          }
        }
      }
    })
  }, [])

  const removeElevatorLoadItem = useCallback((id) => {
    setState(s => {
      const key = String(s.elevator.activeHogi)
      const safe = ensureHogiData(s, key)
      const cur = safe.elevator.dataByHogi[key]
      return {
        ...safe,
        elevator: {
          ...safe.elevator,
          dataByHogi: {
            ...safe.elevator.dataByHogi,
            [key]: { ...cur, loadItems: (cur.loadItems || []).filter(it => it.id !== id) }
          }
        }
      }
    })
  }, [])

  /* 호환성 유지용: 옛 updateElevator 호출 잔존 시 fallback */
  const updateElevator  = useCallback(u => setState(s => ({ ...s, elevator: { ...s.elevator, ...u } })), [])
  const updateArea      = useCallback(u => setState(s => ({ ...s, area: { ...s.area, ...u } })), [])
  const updateInventory = useCallback(u => setState(s => ({ ...s, inventory: { ...s.inventory, ...u } })), [])

  /* ── 재고 통계 (실적 기반) — 제품/모델별 분리 ── */
  const invKey = (product, model) => `${product}::${model}`

  const updateInventoryStats = useCallback(u => setState(s => ({
    ...s, inventoryStats: { ...s.inventoryStats, ...u }
  })), [])

  /* 제품 관리 */
  const addInvProduct = useCallback((name) => setState(s => {
    const cur = s.inventoryStats
    if (!name || cur.productList.includes(name)) return s
    return {
      ...s,
      inventoryStats: {
        ...cur,
        productList: [...cur.productList, name],
        modelsByProduct: { ...cur.modelsByProduct, [name]: cur.modelsByProduct[name] || [] }
      }
    }
  }), [])

  const removeInvProduct = useCallback((name) => setState(s => {
    const cur = s.inventoryStats
    const nextList = cur.productList.filter(p => p !== name)
    const nextModels = { ...cur.modelsByProduct }
    const nextData = { ...cur.dataByKey }
    /* 해당 제품의 모든 모델 데이터 삭제 */
    ;(nextModels[name] || []).forEach(m => { delete nextData[invKey(name, m)] })
    delete nextModels[name]
    /* 활성 제품 보정 */
    let nextActiveProduct = cur.activeProduct
    let nextActiveModel = cur.activeModel
    if (cur.activeProduct === name) {
      nextActiveProduct = nextList[0] || ''
      nextActiveModel = (nextModels[nextActiveProduct] || [])[0] || ''
    }
    return {
      ...s,
      inventoryStats: {
        ...cur,
        productList: nextList,
        modelsByProduct: nextModels,
        dataByKey: nextData,
        activeProduct: nextActiveProduct,
        activeModel: nextActiveModel
      }
    }
  }), [])

  const renameInvProduct = useCallback((oldName, newName) => setState(s => {
    const cur = s.inventoryStats
    if (!newName || cur.productList.includes(newName) || oldName === newName) return s
    const nextList = cur.productList.map(p => p === oldName ? newName : p)
    const nextModels = { ...cur.modelsByProduct }
    nextModels[newName] = nextModels[oldName] || []
    delete nextModels[oldName]
    const nextData = { ...cur.dataByKey }
    ;(nextModels[newName] || []).forEach(m => {
      const oldKey = invKey(oldName, m)
      if (nextData[oldKey]) {
        nextData[invKey(newName, m)] = nextData[oldKey]
        delete nextData[oldKey]
      }
    })
    return {
      ...s,
      inventoryStats: {
        ...cur,
        productList: nextList,
        modelsByProduct: nextModels,
        dataByKey: nextData,
        activeProduct: cur.activeProduct === oldName ? newName : cur.activeProduct
      }
    }
  }), [])

  /* 모델 관리 (현재 활성 제품 기준) */
  const addInvModel = useCallback((modelName) => setState(s => {
    const cur = s.inventoryStats
    const p = cur.activeProduct
    if (!p || !modelName) return s
    const models = cur.modelsByProduct[p] || []
    if (models.includes(modelName)) return s
    return {
      ...s,
      inventoryStats: {
        ...cur,
        modelsByProduct: { ...cur.modelsByProduct, [p]: [...models, modelName] }
      }
    }
  }), [])

  const removeInvModel = useCallback((modelName) => setState(s => {
    const cur = s.inventoryStats
    const p = cur.activeProduct
    if (!p) return s
    const models = (cur.modelsByProduct[p] || []).filter(m => m !== modelName)
    const nextData = { ...cur.dataByKey }
    delete nextData[invKey(p, modelName)]
    let nextActiveModel = cur.activeModel
    if (cur.activeModel === modelName) nextActiveModel = models[0] || ''
    return {
      ...s,
      inventoryStats: {
        ...cur,
        modelsByProduct: { ...cur.modelsByProduct, [p]: models },
        dataByKey: nextData,
        activeModel: nextActiveModel
      }
    }
  }), [])

  const renameInvModel = useCallback((oldName, newName) => setState(s => {
    const cur = s.inventoryStats
    const p = cur.activeProduct
    if (!p || !newName || oldName === newName) return s
    const models = cur.modelsByProduct[p] || []
    if (models.includes(newName)) return s
    const nextModels = { ...cur.modelsByProduct, [p]: models.map(m => m === oldName ? newName : m) }
    const nextData = { ...cur.dataByKey }
    const oldKey = invKey(p, oldName)
    if (nextData[oldKey]) {
      nextData[invKey(p, newName)] = nextData[oldKey]
      delete nextData[oldKey]
    }
    return {
      ...s,
      inventoryStats: {
        ...cur,
        modelsByProduct: nextModels,
        dataByKey: nextData,
        activeModel: cur.activeModel === oldName ? newName : cur.activeModel
      }
    }
  }), [])

  /* 활성 제품/모델 전환 (모델이 없으면 첫 번째로 자동 보정) */
  const setActiveInvProduct = useCallback((p) => setState(s => {
    const cur = s.inventoryStats
    const models = cur.modelsByProduct[p] || []
    return {
      ...s,
      inventoryStats: {
        ...cur,
        activeProduct: p,
        activeModel: models.includes(cur.activeModel) ? cur.activeModel : (models[0] || '')
      }
    }
  }), [])

  const setActiveInvModel = useCallback((m) => setState(s => ({
    ...s, inventoryStats: { ...s.inventoryStats, activeModel: m }
  })), [])

  /* 일자별 레코드 — 현재 활성 (제품, 모델) 키에 작용 */
  const _ensureKey = useCallback((s) => {
    const cur = s.inventoryStats
    const key = invKey(cur.activeProduct, cur.activeModel)
    if (!cur.dataByKey[key]) {
      return {
        ...s,
        inventoryStats: {
          ...cur,
          dataByKey: { ...cur.dataByKey, [key]: { records: [] } }
        }
      }
    }
    return s
  }, [])

  const addInvStatsRecord = useCallback(() => setState(s => {
    const safe = _ensureKey(s)
    const cur = safe.inventoryStats
    const key = invKey(cur.activeProduct, cur.activeModel)
    const records = cur.dataByKey[key].records || []
    /* 이전 행에 일자가 있으면 다음 날을 자동 채움 (YYYY-MM-DD) */
    let nextDate = ''
    const lastDate = records.length > 0 ? records[records.length - 1].date : ''
    if (lastDate && /^\d{4}-\d{2}-\d{2}$/.test(lastDate)) {
      const [y, m, d] = lastDate.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      if (!isNaN(dt.getTime())) {
        dt.setDate(dt.getDate() + 1)
        const yy = dt.getFullYear()
        const mm = String(dt.getMonth() + 1).padStart(2, '0')
        const dd = String(dt.getDate()).padStart(2, '0')
        nextDate = `${yy}-${mm}-${dd}`
      }
    }
    const record = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: nextDate, production: '', shipment: '', stock: ''
    }
    return {
      ...safe,
      inventoryStats: {
        ...cur,
        dataByKey: { ...cur.dataByKey, [key]: { ...cur.dataByKey[key], records: [...records, record] } }
      }
    }
  }), [_ensureKey])

  const updateInvStatsRecord = useCallback((id, upd) => setState(s => {
    const cur = s.inventoryStats
    const key = invKey(cur.activeProduct, cur.activeModel)
    const records = cur.dataByKey[key]?.records || []
    return {
      ...s,
      inventoryStats: {
        ...cur,
        dataByKey: {
          ...cur.dataByKey,
          [key]: { ...(cur.dataByKey[key] || {}), records: records.map(r => r.id === id ? { ...r, ...upd } : r) }
        }
      }
    }
  }), [])

  const removeInvStatsRecord = useCallback((id) => setState(s => {
    const cur = s.inventoryStats
    const key = invKey(cur.activeProduct, cur.activeModel)
    const records = cur.dataByKey[key]?.records || []
    return {
      ...s,
      inventoryStats: {
        ...cur,
        dataByKey: {
          ...cur.dataByKey,
          [key]: { ...(cur.dataByKey[key] || {}), records: records.filter(r => r.id !== id) }
        }
      }
    }
  }), [])

  const clearInvStatsRecords = useCallback(() => setState(s => {
    const cur = s.inventoryStats
    const key = invKey(cur.activeProduct, cur.activeModel)
    return {
      ...s,
      inventoryStats: {
        ...cur,
        dataByKey: { ...cur.dataByKey, [key]: { ...(cur.dataByKey[key] || {}), records: [] } }
      }
    }
  }), [])
  const updateAmr       = useCallback(u => setState(s => ({ ...s, amr: { ...s.amr, ...u } })), [])
  const updateLogisticsPersonnel = useCallback(u => setState(s => ({
    ...s, logisticsPersonnel: { ...s.logisticsPersonnel, ...u }
  })), [])
  const updateWarehouseArea = useCallback(u => setState(s => ({
    ...s, warehouseArea: { ...s.warehouseArea, ...u }
  })), [])
  const updateAutomationRate = useCallback(u => setState(s => ({
    ...s, automationRate: { ...s.automationRate, ...u }
  })), [])

  const addCycle = useCallback(() => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements || workerData.measurements.length === 0) return s
      const prev = workerData.measurements[workerData.measurements.length - 1]
      const newIndex = workerData.measurements.length + 1
      const newCycle = {
        id: `cycle-${Date.now()}`,
        name: `${newIndex}`,
        cards: prev.cards.map(c => ({
          ...c,
          id: `${newIndex}-${c.type}-${Math.random().toString(36).substr(2, 5)}`,
          start: null,
          end: null
        }))
      }
      return {
        ...s,
        worker: { 
          ...s.worker, 
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: [...workerData.measurements, newCycle],
              basicInfo: { ...workerData.basicInfo, measureCount: newIndex }
            }
          }
        }
      }
    })
  }, [])

  const removeCycle = useCallback((id) => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements || workerData.measurements.length <= 1) return s
      const next = workerData.measurements.filter(m => m.id !== id)
      return {
        ...s,
        worker: { 
          ...s.worker, 
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: next,
              basicInfo: { ...workerData.basicInfo, measureCount: next.length }
            }
          }
        }
      }
    })
  }, [])

  const updateCycleCard = useCallback((cycleId, cardId, upd) => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements) return s
      return {
        ...s,
        worker: {
          ...s.worker,
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: workerData.measurements.map(m => 
                m.id === cycleId 
                ? { ...m, cards: m.cards.map(c => c.id === cardId ? { ...c, ...upd } : c) } 
                : m
              )
            }
          }
        }
      }
    })
  }, [])

  const addCardInCycle = useCallback((cycleId, cardType) => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements) return s
      return {
        ...s,
        worker: {
          ...s.worker,
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: workerData.measurements.map(m => 
                m.id === cycleId 
                ? { 
                    ...m, 
                    cards: [
                      ...m.cards, 
                      { 
                        id: `${Date.now()}`, 
                        type: cardType, 
                        start: null, 
                        end: null,
                        ...(cardType === 'pick' ? { materialCount: 1 } : cardType === 'recovery' ? {} : { processNo: 1 })
                      }
                    ] 
                  } 
                : m
              )
            }
          }
        }
      }
    })
  }, [])

  const removeCardInCycle = useCallback((cycleId, cardId) => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements) return s
      return {
        ...s,
        worker: {
          ...s.worker,
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: workerData.measurements.map(m => 
                m.id === cycleId 
                ? { ...m, cards: m.cards.filter(c => c.id !== cardId) } 
                : m
              )
            }
          }
        }
      }
    })
  }, [])

  const addPersonnel = useCallback((name) => {
    setState(s => {
      if (s.worker.personnelList.includes(name)) return s
      const isFirst = s.worker.personnelList.length === 0
      const nextActive = isFirst ? name : s.worker.activePersonnel
      const newData = isFirst ? { [name]: createInitialWorkerData(name) } : {}
      return { 
        ...s, 
        worker: { 
          ...s.worker, 
          personnelList: [...s.worker.personnelList, name],
          activePersonnel: nextActive,
          dataByPersonnel: { ...s.worker.dataByPersonnel, ...newData }
        } 
      }
    })
  }, [])

  const removePersonnel = useCallback((name) => {
    setState(s => {
      const nextData = { ...s.worker.dataByPersonnel }
      delete nextData[name]
      const nextList = s.worker.personnelList.filter(n => n !== name)
      const nextActive = s.worker.activePersonnel === name ? nextList[0] || '' : s.worker.activePersonnel
      const newData = (nextActive && !nextData[nextActive]) ? { [nextActive]: createInitialWorkerData(nextActive) } : {}
      return { 
        ...s, 
        worker: { 
          ...s.worker, 
          personnelList: nextList,
          activePersonnel: nextActive,
          dataByPersonnel: { ...nextData, ...newData }
        } 
      }
    })
  }, [])

  const updatePersonnel = useCallback((oldName, newName) => {
    setState(s => {
      const workerData = s.worker.dataByPersonnel[oldName]
      const nextData = { ...s.worker.dataByPersonnel }
      if (workerData) {
        nextData[newName] = { ...workerData, basicInfo: { ...workerData.basicInfo, personnel: newName } }
        delete nextData[oldName]
      }
      return { 
        ...s, 
        worker: { 
          ...s.worker, 
          personnelList: s.worker.personnelList.map(n => n === oldName ? newName : n),
          activePersonnel: s.worker.activePersonnel === oldName ? newName : s.worker.activePersonnel,
          dataByPersonnel: nextData
        } 
      }
    })
  }, [])

  /* ───── 운반 종류 관리 ───── */
  const addTransportType = useCallback((id, label, speed) => {
    setState(s => ({
      ...s,
      worker: {
        ...s.worker,
        transportTypes: { ...s.worker.transportTypes, [id]: { label, speed: parseFloat(speed) || 0 } }
      }
    }))
  }, [])

  const updateTransportType = useCallback((id, upd) => {
    setState(s => ({
      ...s,
      worker: {
        ...s.worker,
        transportTypes: { 
          ...s.worker.transportTypes, 
          [id]: { ...s.worker.transportTypes[id], ...upd, speed: upd.speed !== undefined ? parseFloat(upd.speed) : s.worker.transportTypes[id].speed } 
        }
      }
    }))
  }, [])

  const removeTransportType = useCallback((id) => {
    setState(s => {
      // 1. 해당 항목을 제외한 새로운 객체 생성 (Rest properties 방식)
      const newTypes = { ...s.worker.transportTypes }
      delete newTypes[id]
      
      // 2. 만약 현재 선택된 작업자의 운반 종류가 삭제된 것이라면 'worker'로 초기화
      const active = s.worker.activePersonnel
      const currentWorkerData = s.worker.dataByPersonnel[active]
      let nextDataByPersonnel = { ...s.worker.dataByPersonnel }
      
      if (currentWorkerData?.basicInfo?.transportType === id) {
        nextDataByPersonnel[active] = {
          ...currentWorkerData,
          basicInfo: { ...currentWorkerData.basicInfo, transportType: 'worker' }
        }
      }

      return { 
        ...s, 
        worker: { 
          ...s.worker, 
          transportTypes: newTypes,
          dataByPersonnel: nextDataByPersonnel
        } 
      }
    })
  }, [])

  /* 사진 업로드 (이미지 자동 압축됨) */
  const addPhoto = useCallback(async (module, category, file) => {
    let base64
    try {
      base64 = await fileToBase64(file)
    } catch (err) {
      console.error('사진 처리 실패:', err)
      return
    }
    setState(s => {
      const next = { ...s }
      if (module === 'worker') {
        const active = s.worker.activePersonnel
        const workerData = s.worker.dataByPersonnel[active]
        if (!workerData) return s
        next.worker = {
          ...next.worker,
          dataByPersonnel: {
            ...next.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              photos: { ...workerData.photos, [category]: [...(workerData.photos?.[category] || []), base64] }
            }
          }
        }
      } else if (module === 'elevator') {
        const key = String(s.elevator.activeHogi)
        const cur = s.elevator.dataByHogi[key]
        if (!cur) return s
        next.elevator = {
          ...next.elevator,
          dataByHogi: {
            ...next.elevator.dataByHogi,
            [key]: { ...cur, photos: [...(cur.photos || []), base64] }
          }
        }
      }
      return next
    })
  }, [])

  const removePhoto = useCallback((module, category, index) => {
    setState(s => {
      const next = { ...s }
      if (module === 'worker') {
        const active = s.worker.activePersonnel
        const workerData = s.worker.dataByPersonnel[active]
        if (!workerData) return s
        const list = [...(workerData.photos?.[category] || [])]
        list.splice(index, 1)
        next.worker = {
          ...next.worker,
          dataByPersonnel: {
            ...next.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              photos: { ...workerData.photos, [category]: list }
            }
          }
        }
      } else if (module === 'elevator') {
        const key = String(s.elevator.activeHogi)
        const cur = s.elevator.dataByHogi[key]
        if (!cur) return s
        const list = [...(cur.photos || [])]
        list.splice(index, 1)
        next.elevator = {
          ...next.elevator,
          dataByHogi: {
            ...next.elevator.dataByHogi,
            [key]: { ...cur, photos: list }
          }
        }
      }
      return next
    })
  }, [])

  return {
    state, setState,
    updateWorker, updateElevator, updateArea, updateInventory, updateAmr,
    updateLogisticsPersonnel, updateWarehouseArea, updateAutomationRate,
    addPhoto, removePhoto,
    addPersonnel, removePersonnel, updatePersonnel,
    addCycle, removeCycle, updateCycleCard, addCardInCycle, removeCardInCycle,
    switchPersonnel,
    addTransportType, updateTransportType, removeTransportType,
    /* 재고 통계 */
    updateInventoryStats,
    addInvProduct, removeInvProduct, renameInvProduct,
    addInvModel, removeInvModel, renameInvModel,
    setActiveInvProduct, setActiveInvModel,
    addInvStatsRecord, updateInvStatsRecord, removeInvStatsRecord, clearInvStatsRecords,
    /* E/V */
    switchHogi, removeHogi, updateElevatorHogi, updateElevatorBasic,
    addElevatorCycle, removeElevatorCycle, updateElevatorCycleCard,
    addElevatorCard, removeElevatorCard,
    addElevatorLoadItem, updateElevatorLoadItem, removeElevatorLoadItem
  }
}
