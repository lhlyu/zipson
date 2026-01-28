import {
    ARRAY_START_TOKEN,
    OBJECT_START_TOKEN,
    ARRAY_REPEAT_TOKEN,
    ARRAY_REPEAT_MANY_TOKEN,
    TEMPLATE_OBJECT_START,
    TEMPLATE_OBJECT_END,
    TEMPLATE_OBJECT_FINAL,
} from '../constants.ts'
import { type Cursor, type OrderedIndex, TargetType, SKIP_SCALAR } from './common.ts'
import { decompressElement } from './element.ts'
import { decompressScalar } from './scalar.ts'

/**
 * Run decompression stages over the data buffer.
 * 对数据缓冲区执行分阶段解压。
 *
 * @param cursor - Decompression cursor.
 * @param cursor - 解压游标。
 * @param data - Full data buffer.
 * @param data - 完整数据缓冲区。
 * @param orderedIndex - Ordered reference index.
 * @param orderedIndex - 有序引用索引。
 */
export function decompressStages(cursor: Cursor, data: string, orderedIndex: OrderedIndex) {
    for (; cursor.index < data.length; cursor.index++) {
        const c = data[cursor.index]
        if (c === undefined) {
            return
        }

        if (c === ARRAY_START_TOKEN) {
            cursor.currentTarget = { type: TargetType.ARRAY, value: [] }
            cursor.stack[++cursor.pointer] = cursor.currentTarget
        } else if (c === OBJECT_START_TOKEN) {
            cursor.currentTarget = { type: TargetType.OBJECT, value: {} }
            cursor.stack[++cursor.pointer] = cursor.currentTarget
        } else if (
            c === ARRAY_REPEAT_TOKEN &&
            (cursor.currentTarget.type === TargetType.ARRAY ||
                cursor.currentTarget.type === TargetType.TEMPLATE_OBJECT_ELEMENTS)
        ) {
            const repeatedItem = cursor.currentTarget.value[cursor.currentTarget.value.length - 1]
            cursor.currentTarget.value.push(repeatedItem)
        } else if (
            c === ARRAY_REPEAT_MANY_TOKEN &&
            (cursor.currentTarget.type === TargetType.ARRAY ||
                cursor.currentTarget.type === TargetType.TEMPLATE_OBJECT_ELEMENTS)
        ) {
            const repeatCount = decompressScalar(c, data, cursor, orderedIndex)
            if (repeatCount === SKIP_SCALAR) {
                return
            }
            if (typeof repeatCount !== 'number') {
                throw new Error(`Unexpected repeat count ${String(repeatCount)} at ${cursor.index}`)
            }
            const repeatedItem = cursor.currentTarget.value[cursor.currentTarget.value.length - 1]
            for (let i = 0; i < repeatCount; i++) {
                cursor.currentTarget.value.push(repeatedItem)
            }
        } else if (
            c === TEMPLATE_OBJECT_START &&
            (cursor.currentTarget.type === TargetType.TEMPLATE_OBJECT ||
                cursor.currentTarget.type === TargetType.OBJECT ||
                cursor.currentTarget.type === TargetType.ARRAY)
        ) {
            if (cursor.currentTarget.type !== TargetType.TEMPLATE_OBJECT) {
                const parentTarget = cursor.currentTarget
                cursor.currentTarget = {
                    type: TargetType.TEMPLATE_OBJECT,
                    value: void 0,
                    currentTokens: [],
                    currentRoute: [],
                    paths: [],
                    level: 0,
                    parentTarget,
                }
                cursor.stack[++cursor.pointer] = cursor.currentTarget
            } else {
                // Add any found tokens prior to the next nested as separate paths
                for (let i = 0; i < cursor.currentTarget.currentTokens.length - 1; i++) {
                    const currentToken = cursor.currentTarget.currentTokens[i]
                    if (currentToken == null) {
                        continue
                    }
                    cursor.currentTarget.paths[cursor.currentTarget.paths.length] =
                        cursor.currentTarget.currentRoute.concat(currentToken)
                }
                // Add the most recent token as part of the next path
                if (cursor.currentTarget.currentToken != null) {
                    cursor.currentTarget.currentRoute.push(cursor.currentTarget.currentToken)
                }
                // Clear tokens for nested object
                cursor.currentTarget.currentTokens = []
                cursor.currentTarget.level++
            }
        } else if (
            c === TEMPLATE_OBJECT_END &&
            cursor.currentTarget.type === TargetType.TEMPLATE_OBJECT
        ) {
            for (let i = 0; i < cursor.currentTarget.currentTokens.length; i++) {
                const currentToken = cursor.currentTarget.currentTokens[i]
                if (currentToken == null) {
                    continue
                }
                cursor.currentTarget.paths[cursor.currentTarget.paths.length] =
                    cursor.currentTarget.currentRoute.concat(currentToken)
            }
            cursor.currentTarget.currentTokens = []
            cursor.currentTarget.currentRoute = cursor.currentTarget.currentRoute.slice(0, -1)
            cursor.currentTarget.level--

            if (cursor.currentTarget.level < 0) {
                const paths = cursor.currentTarget.paths
                const parentTarget = cursor.currentTarget.parentTarget
                cursor.pointer--
                if (parentTarget.type === TargetType.ARRAY) {
                    cursor.currentTarget = {
                        type: TargetType.TEMPLATE_OBJECT_ELEMENTS,
                        value: parentTarget.value,
                        paths,
                        currentPathIndex: 0,
                        expectedPaths: paths.length,
                        currentObject: {},
                    }
                } else if (parentTarget.type === TargetType.OBJECT) {
                    cursor.currentTarget = {
                        type: TargetType.TEMPLATE_OBJECT_PROPERTIES,
                        value: parentTarget.value,
                        paths,
                        currentPathIndex: -1,
                        expectedPaths: paths.length,
                        currentObject: {},
                    }
                }
                cursor.stack[++cursor.pointer] = cursor.currentTarget
            }
        } else if (c === TEMPLATE_OBJECT_FINAL) {
            cursor.currentTarget = cursor.stack[--cursor.pointer]!
        } else {
            if (!decompressElement(c, cursor, data, orderedIndex)) {
                return
            }
        }
    }
}
