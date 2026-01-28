import { ARRAY_END_TOKEN, OBJECT_END_TOKEN } from '../constants.ts'
import { type Cursor, type OrderedIndex, SKIP_SCALAR, TargetType } from './common.ts'
import { decompressScalar } from './scalar.ts'
import {
    appendTemplateObjectElementsValue,
    appendTemplateObjectPropertiesValue,
} from './template.ts'

/**
 * Decompress a single element/token and apply it to the current target.
 * 解压单个元素/令牌并写入当前目标。
 *
 * @param c - Current token character.
 * @param c - 当前令牌字符。
 * @param cursor - Decompression cursor.
 * @param cursor - 解压游标。
 * @param data - Full data buffer.
 * @param data - 完整数据缓冲区。
 * @param orderedIndex - Ordered reference index.
 * @param orderedIndex - 有序引用索引。
 * @returns True if parsing should continue, false if more data is needed.
 * @returns 若可继续解析返回 true，否则需要更多数据返回 false。
 */
export function decompressElement(
    c: string,
    cursor: Cursor,
    data: string,
    orderedIndex: OrderedIndex,
): boolean {
    let targetValue: any

    if (c === ARRAY_END_TOKEN || c === OBJECT_END_TOKEN) {
        targetValue = cursor.currentTarget.value
        cursor.currentTarget = cursor.stack[cursor.pointer - 1]!
        cursor.pointer--
    } else {
        targetValue = decompressScalar(c, data, cursor, orderedIndex)
        if (targetValue === SKIP_SCALAR) {
            return false
        }
    }

    if (cursor.currentTarget.type === TargetType.SCALAR) {
        cursor.currentTarget.value = targetValue
    } else if (cursor.currentTarget.type === TargetType.ARRAY) {
        cursor.currentTarget.value[cursor.currentTarget.value.length] = targetValue
    } else if (cursor.currentTarget.type === TargetType.OBJECT) {
        if (cursor.currentTarget.key != null) {
            cursor.currentTarget.value[cursor.currentTarget.key] = targetValue
            cursor.currentTarget.key = void 0
        } else {
            cursor.currentTarget.key = targetValue
        }
    } else if (cursor.currentTarget.type === TargetType.TEMPLATE_OBJECT) {
        cursor.currentTarget.currentToken = targetValue
        cursor.currentTarget.currentTokens.push(targetValue)
    } else if (cursor.currentTarget.type === TargetType.TEMPLATE_OBJECT_PROPERTIES) {
        appendTemplateObjectPropertiesValue(cursor.currentTarget, targetValue)
    } else if (cursor.currentTarget.type === TargetType.TEMPLATE_OBJECT_ELEMENTS) {
        appendTemplateObjectElementsValue(cursor.currentTarget, targetValue)
    }

    return true
}
