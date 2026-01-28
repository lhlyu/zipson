import { expect } from 'vitest'

import { type CompressOptions, parse, stringify } from '../../src'

function isObjectLike(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object'
}

function roughlyEqual(actual: unknown, expected: unknown, epsilon: number): boolean {
    if (typeof actual === 'number' && typeof expected === 'number') {
        return Number.isNaN(actual) && Number.isNaN(expected)
            ? true
            : Math.abs(actual - expected) <= epsilon
    }

    if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) {
            return false
        }
        for (let i = 0; i < actual.length; i++) {
            if (!roughlyEqual(actual[i], expected[i], epsilon)) {
                return false
            }
        }
        return true
    }

    if (isObjectLike(actual) && isObjectLike(expected)) {
        const actualKeys = Object.keys(actual)
        const expectedKeys = Object.keys(expected)
        if (actualKeys.length !== expectedKeys.length) {
            return false
        }
        for (const key of actualKeys) {
            if (!roughlyEqual(actual[key], expected[key], epsilon)) {
                return false
            }
        }
        return true
    }

    return Object.is(actual, expected)
}

export function testPackUnpack(
    original: any,
    expectedCompressionOffset = 0,
    roughly = false,
    options?: CompressOptions,
) {
    const packed = stringify(original, options)
    const unpacked = parse(packed)
    const baseline = JSON.stringify(original)
    const expected = baseline !== undefined ? JSON.parse(baseline) : undefined
    if (roughly) {
        expect(roughlyEqual(unpacked, expected, 0.001)).toBe(true)
    } else {
        expect(unpacked).toEqual(expected)
    }
    if (original !== undefined) {
        expect(packed.length).toBeLessThanOrEqual(baseline.length + expectedCompressionOffset)
    }
}
