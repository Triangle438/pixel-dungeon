import { describe, expect, it } from 'vitest'
import { parseSeed } from './seed'

describe('parseSeed', () => {
  it('reads a numeric seed from the query string', () => {
    expect(parseSeed('?seed=12345')).toBe(12345)
    expect(parseSeed('?x=1&seed=7')).toBe(7)
  })

  it('returns null when missing or invalid', () => {
    expect(parseSeed('')).toBeNull()
    expect(parseSeed('?seed=')).toBeNull()
    expect(parseSeed('?seed=abc')).toBeNull()
    expect(parseSeed('?seed=-5')).toBeNull()
    expect(parseSeed('?seed=1.5')).toBeNull()
    expect(parseSeed('?seed=99999999999')).toBeNull()
  })
})
