import {
    compress,
    makeInvertedIndex,
    type CompressOptions,
    makeCompressContext,
} from './compress.ts'
import { ZipsonWriter, ZipsonStringWriter } from './compressor/writer.ts'
import { decompress, makeOrderedIndex, decompressIncremental } from './decompress.ts'
export * from './compressor/writer.ts'
export * from './compressor/common.ts'
export * from './decompressor/common.ts'

/**
 * Parse a zipson data string.
 * 解析 zipson 数据字符串。
 *
 * @param data - Zipson-encoded string.
 * @param data - Zipson 编码字符串。
 * @returns Parsed value.
 * @returns 解析后的值。
 */
export function parse(data: string): any {
    const orderedIndex = makeOrderedIndex()
    return decompress(data, orderedIndex)
}

/**
 * Incrementally parse a zipson data string in chunks.
 * 分片增量解析 zipson 数据字符串。
 *
 * @returns A function that accepts chunks and returns the final value on null.
 * @returns 接收分片的函数，传入 null 时返回最终值。
 */
export function parseIncremental() {
    const orderedIndex = makeOrderedIndex()
    const { cursor, increment } = decompressIncremental(orderedIndex)
    return function (data: string | null) {
        increment(data)
        if (data === null) {
            return cursor.rootTarget.value
        }
    }
}

/**
 * Stringify any data to a zipson writer.
 * 将任意数据序列化并写入 zipson 写入器。
 *
 * @param data - Value to stringify.
 * @param data - 待序列化的值。
 * @param writer - Destination a writer.
 * @param writer - 目标写入器。
 * @param options - Compression options.
 * @param options - 压缩选项。
 */
export function stringifyTo(data: any, writer: ZipsonWriter, options: CompressOptions = {}): void {
    const invertedIndex = makeInvertedIndex()
    const context = makeCompressContext()
    compress(context, data, invertedIndex, writer, options)
    writer.end()
}

/**
 * Stringify any data to a string.
 * 将任意数据序列化为字符串。
 *
 * @param data - Value to stringify.
 * @param data - 待序列化的值。
 * @param options - Compression options.
 * @param options - 压缩选项。
 * @returns Zipson-encoded string.
 * @returns Zipson 编码字符串。
 */
export function stringify(data: any, options?: CompressOptions): string {
    const writer = new ZipsonStringWriter()
    stringifyTo(data, writer, options)
    return writer.value
}
