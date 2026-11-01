import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLanguage, lwoText, setLanguage, syncLanguage } from '../src/i18n'
import { fmtN } from '../src/shared/utils/common'

describe('LWO language preference', () => {
  const values = new Map()

  beforeEach(() => {
    values.clear()
    vi.stubGlobal('localStorage', {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    })
    syncLanguage('Korean')
  })

  it('persists the selected language and safely falls back for untranslated text', () => {
    setLanguage('English')
    expect(values.get('tmo_language')).toBe('English')
    expect(lwoText('작업자 부하율')).toBe('Worker workload')
    expect(lwoText('검토되지 않은 내용')).toBe('검토되지 않은 내용')

    syncLanguage('Chinese')
    expect(getLanguage()).toBe('Chinese')
    expect(lwoText('작업자 부하율')).toBe('作业人员负荷率')
    expect(syncLanguage('unsupported')).toBe('Korean')
  })

  it('preserves user-provided names in translated confirmations', () => {
    setLanguage('English')
    const name = '관리자 $& {name}'
    expect(lwoText('{name}을(를) 삭제하시겠습니까?', { name }))
      .toBe('Delete 관리자 $& {name}?')
  })

  it('localizes result units without changing numeric values', () => {
    expect(fmtN(2.5, '대', 1)).toBe('2.5대')
    setLanguage('English')
    expect(fmtN(2.5, '대', 1)).toBe('2.5 units')
    expect(fmtN(30, '초', 0)).toBe('30sec')
    syncLanguage('Chinese')
    expect(fmtN(2.5, '대', 1)).toBe('2.5台')
    expect(fmtN(30, '초', 0)).toBe('30秒')
  })

  it('does not switch language when persistence fails', () => {
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('storage unavailable') } })
    expect(() => setLanguage('English')).toThrow('storage unavailable')
    expect(getLanguage()).toBe('Korean')
  })
})
