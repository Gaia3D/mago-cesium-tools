import {describe, expect, it} from 'vitest'
import {add} from '../src/cesium/math'

describe('math.js', () => {
    it ('add method', () => {
        expect(add(2, 3)).toBe(5)
        expect(add(-1, 1)).toBe(0)
        expect(add(0, 0)).toBe(0)
        expect(add(0.1, 0.2)).toBeCloseTo(0.3)
    })
})