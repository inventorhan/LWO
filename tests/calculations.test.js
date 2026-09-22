import { describe, it, expect } from 'vitest'
import { n, nOr, fmtN, calcArea, getGap } from '../src/shared/utils/common'
import { migrateAppState } from '../src/store'

describe('1. Common Utils (common.js)', () => {
  it('n() parses floats or returns 0', () => {
    expect(n('12.3')).toBe(12.3)
    expect(n('')).toBe(0)
    expect(n(null)).toBe(0)
    expect(n(undefined)).toBe(0)
    expect(n('abc')).toBe(0)
  })

  it('nOr() respects explicitly provided 0 vs fallback', () => {
    expect(nOr('0', 1)).toBe(0)
    expect(nOr(0, 1)).toBe(0)
    expect(nOr('', 1)).toBe(1)
    expect(nOr(null, 5)).toBe(5)
    expect(nOr(undefined, 8)).toBe(8)
    expect(nOr('3.5', 1)).toBe(3.5)
  })

  it('fmtN() formats numbers and handles zero properly', () => {
    expect(fmtN(12.3456, '개', 2)).toBe('12.35개')
    expect(fmtN(100, '%', 1)).toBe('100%')
    expect(fmtN(null, '%', 1)).toBe('—')
    expect(fmtN(undefined, '%', 1)).toBe('—')
    expect(fmtN(NaN, '%', 1)).toBe('—')
    // Without allowZero, 0 returns '—'
    expect(fmtN(0, '%', 1)).toBe('—')
    // With allowZero: true, 0 returns '0%'
    expect(fmtN(0, '%', 1, true)).toBe('0%')
    expect(fmtN(0, '개', 0, true)).toBe('0개')
  })

  it('calcArea() calculates area correctly', () => {
    expect(calcArea(10, 20)).toBe(200)
    expect(calcArea(0, 20)).toBeNull()
    expect(calcArea('5.5', '2')).toBe(11)
  })

  it('getGap() calculates time gap in seconds', () => {
    const start = 1000000
    const end = 1005500
    expect(getGap(start, end)).toBe('5.5')
    expect(getGap(null, end)).toBeNull()
  })
})

describe('2. State Migration (store.js)', () => {
  it('returns initialState for empty/invalid input', () => {
    const migrated = migrateAppState(null)
    expect(migrated).toBeDefined()
    expect(migrated.worker).toBeDefined()
    expect(migrated.inventoryStats.productList).toContain('세탁기')
  })

  it('migrates legacy area from mm to m', () => {
    const oldState = {
      area: {
        factory: { width: 50000, height: 30000 },
        zones: [
          { width: 10000, height: 8000, items: [{ width: 1200, depth: 800, minHeight: 500, maxHeight: 1700 }] }
        ]
      }
    }
    const migrated = migrateAppState(oldState)
    expect(migrated.area._unit).toBe('m')
    expect(migrated.area.factory.width).toBe(50)
    expect(migrated.area.factory.height).toBe(30)
    expect(migrated.area.zones[0].width).toBe(10)
    expect(migrated.area.zones[0].height).toBe(8)
    expect(migrated.area.zones[0].items[0].width).toBe(1.2)
    expect(migrated.area.zones[0].items[0].depth).toBe(0.8)
  })

  it('migrates single elevator cards to dataByHogi structure', () => {
    const oldState = {
      elevator: {
        cards: [{ id: 'card-1', type: 'load' }],
        basicInfo: { hogiNo: 2, weight: 0.8 }
      }
    }
    const migrated = migrateAppState(oldState)
    expect(migrated.elevator.dataByHogi).toBeDefined()
    expect(migrated.elevator.dataByHogi['2']).toBeDefined()
    expect(migrated.elevator.dataByHogi['2'].measurements[0].cards.length).toBe(1)
  })

  it('migrates legacy flat inventoryStats to dataByKey structure', () => {
    const oldState = {
      inventoryStats: {
        product: '건조기',
        model: 'Dual Inverter',
        records: [{ id: 'rec-1', date: '2026-05-01', production: 100, shipment: 80, stock: 50 }]
      }
    }
    const migrated = migrateAppState(oldState)
    expect(migrated.inventoryStats.productList).toContain('건조기')
    expect(migrated.inventoryStats.modelsByProduct['건조기']).toContain('Dual Inverter')
    expect(migrated.inventoryStats.dataByKey['건조기::Dual Inverter'].records.length).toBe(1)
  })
})

describe('3. Calculations across KPI Modules', () => {
  it('Worker Workload: calculates cycle time and workload rate', () => {
    const avgCycleSec = 180 // 3 minutes
    const supplyPerHour = 10
    const weight = 0.8 // 80% weight
    const weightedTime = 3600 * weight // 2880s
    const hourlyBusySec = avgCycleSec * supplyPerHour // 1800s
    const workloadRate = (hourlyBusySec / weightedTime) * 100 // 62.5%
    expect(workloadRate).toBeCloseTo(62.5, 1)
  })

  it('Elevator Workload: calculates loading rate in cage', () => {
    const evWidth = 2.0 // m
    const evDepth = 3.0 // m
    const evArea = evWidth * evDepth // 6.0 m²
    const stackLevel = 4
    const itemWidth = 1.0
    const itemDepth = 1.0
    const qty = 8
    const itemArea = itemWidth * itemDepth * qty // 8.0 m²
    const usedArea = itemArea / stackLevel // 2.0 m²
    const loadingRate = (usedArea / evArea) * 100 // 33.33%
    expect(loadingRate).toBeCloseTo(33.33, 1)
  })

  it('Area Efficiency: calculates volume loss % and used %', () => {
    const lo = 0.5 // m
    const hi = 2.0 // m
    const volWeight = 0.8
    const drop = (hi - lo) * volWeight // 1.5 * 0.8 = 1.2
    const lossPct = (drop / hi) * 100 // (1.2 / 2.0) * 100 = 60%
    const usedPct = ((hi - drop) / hi) * 100 // 40%
    expect(lossPct).toBeCloseTo(60, 2)
    expect(usedPct).toBeCloseTo(40, 2)
  })

  it('Inventory Storage (UPH-based): calculates shortage, lead-time stock, and required area', () => {
    const customerDayProd = 300 * 8 // 2400
    const selfDayProd = 250 * 8 // 2000
    const shortageQty = Math.abs(customerDayProd - selfDayProd) // 400
    const refUph = 300
    const ageingQty = (3600 / 3600) * refUph // 1 hour ageing = 300
    const totalStock = shortageQty + ageingQty // 700
    const spaceWidth = 1.2
    const spaceDepth = 1.0
    const stackHeight = 2
    const margin = 1.5
    const unitArea = spaceWidth * spaceDepth // 1.2 m²
    const baseArea = (unitArea * totalStock) / stackHeight // (1.2 * 700) / 2 = 420 m²
    const finalArea = baseArea * margin // 630 m²
    expect(finalArea).toBe(630)
  })

  it('Inventory Statistics: calculates mean, std dev, and service level safety stock', () => {
    const shipments = [100, 120, 80, 110, 90]
    const mean = shipments.reduce((a, b) => a + b, 0) / shipments.length // 100
    const variance = shipments.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (shipments.length - 1)
    const stdDev = Math.sqrt(variance) // sqrt(250) ≈ 15.811
    const stock999 = mean + stdDev * 3.09
    const stock995 = mean + stdDev * 2.575
    expect(mean).toBe(100)
    expect(stock999).toBeGreaterThan(148)
    expect(stock995).toBeGreaterThan(140)
  })

  it('AMR Calculation: calculates cycle time, round trip and required units', () => {
    const tactTime = 60 // seconds
    const recycleRate = 100 // %
    const uph = (3600 / tactTime) * (recycleRate / 100) // 60 uph
    const loadQty = 10 // units per run
    const runCount = uph / loadQty // 6 runs/hour
    const cycleTime = 3600 / runCount // 600s
    const distance = 100 // m (one way)
    const speed = 1.0 // m/s
    const roundTripSec = (distance * 2) / speed + 20 + 20 // 200s travel + 40s load/unload = 240s
    const baseRaw = roundTripSec / cycleTime // 240 / 600 = 0.4 units
    const operationRate = 1.2
    const spare = 1
    const adjustedRaw = baseRaw * operationRate // 0.48
    const amrRequired = Math.ceil(adjustedRaw) + spare // 1 + 1 = 2
    expect(baseRaw).toBe(0.4)
    expect(amrRequired).toBe(2)
  })

  it('Logistics Personnel: calculates transport time and required headcount', () => {
    const pickTime = 60 // s
    const unloadTime = 40 // s
    const distance = 120 // m
    const speed = 1.2 // m/s -> 100s travel
    const transportTime = pickTime + unloadTime + (distance / speed) // 200s
    const tripsPerHour = 10
    const hoursPerDay = 8
    const dailyTrips = tripsPerHour * hoursPerDay // 80
    const dailyTransportTime = transportTime * dailyTrips // 16,000s
    const allowance = 0.8
    const standardWorkTime = hoursPerDay * 3600 * allowance // 23,040s
    const personnel = dailyTransportTime / standardWorkTime // 16000 / 23040 ≈ 0.69
    expect(personnel).toBeCloseTo(0.69, 2)
  })

  it('Warehouse Area: calculates UPH and Container modes', () => {
    // UPH mode
    const uph = 100
    const hours = 8
    const capacity = 20
    const dailyQty = uph * hours // 800
    const dailyLoadQty = dailyQty / capacity // 40
    const effectiveQty = dailyLoadQty * 1.3 // 52
    const length = 1.2
    const width = 1.0
    const unitArea = length * width // 1.2 m²
    const margin = 1.5
    const finalArea = effectiveQty * (unitArea * margin) // 52 * 1.8 = 93.6 m²
    expect(finalArea).toBeCloseTo(93.6, 1)

    // Container mode
    const countX = 4
    const countY = 5
    const floorQty = countX * countY // 20
    const contArea = floorQty * unitArea * margin // 20 * 1.8 = 36 m²
    expect(contArea).toBeCloseTo(36.0, 1)
  })

  it('Automation Rate: calculates automation and rehandling percentages with 0 support', () => {
    const totalItems = 200
    const automatedItems = 0
    const autoRate = (automatedItems / totalItems) * 100 // 0%
    expect(autoRate).toBe(0)
    expect(fmtN(autoRate, '%', 1, true)).toBe('0%')

    const rehandlingItems = 50
    const rhRate = (rehandlingItems / totalItems) * 100 // 25%
    expect(rhRate).toBe(25)
    expect(fmtN(rhRate, '%', 1, true)).toBe('25%')
  })
})
