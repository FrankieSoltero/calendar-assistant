import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toBe('base active')
  })

  it('filters out falsy values', () => {
    const result = cn('base', false && 'hidden', null, undefined, 'visible')
    expect(result).toBe('base visible')
  })

  it('handles object syntax', () => {
    const result = cn({ active: true, disabled: false })
    expect(result).toBe('active')
  })

  it('merges tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('handles array syntax', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('returns empty string for no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })
})
