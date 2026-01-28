/**
 * Determine if a value should be treated as an object for serialization.
 * 判断值在序列化时是否应视为对象。
 *
 * @param obj - Value to test.
 * @param obj - 待判断的值。
 * @returns True when the value should be serialized as an object.
 * @returns 当值应按对象序列化时返回 true。
 */
export function isObject(obj: any): boolean {
    const type = typeof obj
    if (type === 'number') {
        return false
    } else if (type === 'string') {
        return false
    } else if (type === 'boolean') {
        return false
    } else if (obj === null) {
        return false
    } else if (Array.isArray(obj)) {
        return false
    } else if (obj instanceof Date) {
        return false
    } else return obj !== void 0
}
