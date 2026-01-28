import { type Target, TargetType, type Cursor, type OrderedIndex } from './decompressor/common.ts'
import { decompressStages } from './decompressor/stages.ts'

/**
 * Create an ordered index for decompression.
 * 创建用于解压的有序索引结构。
 *
 * @returns A fresh ordered index container.
 * @returns 新的有序索引容器。
 */
export function makeOrderedIndex(): OrderedIndex {
    return {
        strings: [],
        integers: [],
        floats: [],
        dates: [],
        lpDates: [],
    }
}

/**
 * Create a new cursor with a root target for the specified drain mode.
 * 根据指定的 drain 模式创建游标与根目标。
 *
 * @param drain - Whether to enter drain mode immediately.
 * @param drain - 是否立即进入 drain 模式。
 * @returns Initialized cursor.
 * @returns 初始化后的游标。
 */
function makeCursor(drain: boolean): Cursor {
    const rootTarget: Target = { type: TargetType.SCALAR, value: void 0 }
    const stack: Target[] = Array.from({ length: 10 })
    stack[0] = rootTarget

    return { index: 0, rootTarget, stack, currentTarget: rootTarget, pointer: 0, drain }
}

/**
 * Decompress a data string with the provided ordered index.
 * 使用提供的有序索引解压数据字符串。
 *
 * @param data - Compressed data.
 * @param data - 压缩数据。
 * @param orderedIndex - Ordered index for references.
 * @param orderedIndex - 引用用的有序索引。
 * @returns Decompressed value.
 * @returns 解压后的值。
 */
export function decompress(data: string, orderedIndex: OrderedIndex) {
    const cursor = makeCursor(true)
    decompressStages(cursor, data, orderedIndex)
    return cursor.rootTarget.value
}

/**
 * Decompress zipson data incrementally by providing chunks in sequence.
 * 通过顺序提供数据分片来增量解压 zipson 数据。
 *
 * @param orderedIndex - Ordered index for references.
 * @param orderedIndex - 引用用的有序索引。
 * @returns Incremental API with increment function and cursor.
 * @returns 含有 increment 函数与游标的增量解压接口。
 */
export function decompressIncremental(orderedIndex: OrderedIndex) {
    const cursor = makeCursor(false)

    // Keep an internal buffer for any unterminated chunks of data
    let buffer = ''
    /**
     * Feed a new chunk into the decompressor.
     * 将新分片送入解压器。
     *
     * @param data - Next chunk, or null to finalize.
     * @param data - 下一个分片，或传入 null 表示结束。
     */
    function increment(data: string | null) {
        if (data === null) {
            // Move the cursor to drain mode if we got the last chunk of data
            cursor.drain = true
        } else if (data.length === 0) {
            return
        } else {
            buffer += data
        }

        // Decompress and determine the amount of buffer that was parsed
        const cursorIndexBefore = cursor.index
        decompressStages(cursor, buffer, orderedIndex)
        const movedAmount = cursor.index - cursorIndexBefore

        // Rotate parsed data out of buffer and move cursor back to next parsing position
        if (movedAmount > 0) {
            buffer = buffer.substring(movedAmount)
            cursor.index -= movedAmount
        }
    }

    return { increment, cursor }
}
