import {
    FLOAT_COMPRESSION_PRECISION,
    FLOAT_FULL_PRECISION_DELIMITER,
    FLOAT_REDUCED_PRECISION_DELIMITER,
} from './constants.ts'

/**
 * Maximum safe integer boundary for bitwise conversion.
 * 位运算转换的最大安全整数边界。
 */
const maxInteger = 2147483648
/**
 * Minimum safe integer boundary for bitwise conversion.
 * 位运算转换的最小安全整数边界。
 */
const minInteger = -2147483649
/**
 * Base62 character set used for encoding.
 * Base62 编码字符集。
 */
const base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Convert number to base62 string.
 * 将数字转换为 base62 字符串。
 *
 * @param number - Integer to encode.
 * @param number - 需要编码的整数。
 * @returns Base62 representation.
 * @returns Base62 表示形式。
 */
export function compressInteger(number: number) {
    if (number === 0) {
        return '0'
    }

    let result = ''
    let carry = number < 0 ? -number : number
    let current = 0
    let fraction
    while (carry > 0) {
        carry = carry / 62
        fraction = carry % 1
        current = (fraction * 62 + 0.1) << 0
        carry -= fraction
        result = base62[current] + result
    }
    result = number < 0 ? '-' + result : result

    return result
}

/**
 * Convert base62 string to number.
 * 将 base62 字符串还原为数字。
 *
 * @param compressedInteger - Base62 encoded integer string.
 * @param compressedInteger - Base62 编码的整数字符串。
 * @returns Decoded integer.
 * @returns 解码后的整数。
 */
export function decompressInteger(compressedInteger: string): number {
    let value = 0
    if (compressedInteger[0] === '0') {
        return value
    } else {
        let negative = compressedInteger[0] === '-'
        let multiplier = 1
        const leftBound = negative ? 1 : 0
        for (let i = compressedInteger.length - 1; i >= leftBound; i--) {
            const code = compressedInteger.charCodeAt(i)
            let current = code - 48
            if (code >= 97) {
                current -= 13
            } else if (code >= 65) {
                current -= 7
            }
            value += current * multiplier
            multiplier *= 62
        }

        return negative ? -value : value
    }
}

/**
 * Convert float to base62 string for integer and fraction.
 * 将浮点数的整数与小数部分转换为 base62 字符串。
 *
 * @param float - Floating point number to encode.
 * @param float - 需要编码的浮点数。
 * @param fullPrecision - Whether to keep full precision.
 * @param fullPrecision - 是否保留完整精度。
 * @returns Encoded float string.
 * @returns 编码后的浮点字符串。
 */
export function compressFloat(float: number, fullPrecision: boolean = false): string {
    if (fullPrecision) {
        const [integer = '0', fraction = ''] = float.toString().split('.')
        const operator = integer === '-0' ? '-' : ''
        return `${operator}${compressInteger(parseInt(integer))}${FLOAT_FULL_PRECISION_DELIMITER}${fraction}`
    } else {
        const integer =
            float >= maxInteger
                ? Math.floor(float)
                : float <= minInteger
                  ? Math.ceil(float)
                  : float << 0
        const fraction = Math.round(FLOAT_COMPRESSION_PRECISION * (float % 1))
        return `${compressInteger(integer)}${FLOAT_REDUCED_PRECISION_DELIMITER}${compressInteger(fraction)}`
    }
}

/**
 * Convert base62 integer and fraction to float.
 * 将 base62 编码的整数与小数部分还原为浮点数。
 *
 * @param compressedFloat - Encoded float string.
 * @param compressedFloat - 编码后的浮点字符串。
 * @returns Decoded float.
 * @returns 解码后的浮点数。
 */
export function decompressFloat(compressedFloat: string): number {
    if (compressedFloat.indexOf(FLOAT_FULL_PRECISION_DELIMITER) > -1) {
        const [integer = '0', fraction = ''] = compressedFloat.split(FLOAT_FULL_PRECISION_DELIMITER)
        const multi = integer === '-0' ? -1 : 1
        const uncompressedInteger = decompressInteger(integer)
        return multi * parseFloat(uncompressedInteger + '.' + fraction)
    } else {
        const [integer = '0', fraction = '0'] = compressedFloat.split(
            FLOAT_REDUCED_PRECISION_DELIMITER,
        )
        const uncompressedInteger = decompressInteger(integer)
        const uncompressedFraction = decompressInteger(fraction)
        return uncompressedInteger + uncompressedFraction / FLOAT_COMPRESSION_PRECISION
    }
}
