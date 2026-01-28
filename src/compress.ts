import { compressAny } from './compressor/any.ts'
import { compressArray } from './compressor/array.ts'
import type { Compressors, Context, InvertedIndex, CompressOptions } from './compressor/common.ts'
import { compressDate } from './compressor/date.ts'
import { compressNumber } from './compressor/number.ts'
import { compressObject } from './compressor/object.ts'
import { compressString } from './compressor/string.ts'
import { TemplateObject } from './compressor/template/object.ts'
import { ZipsonWriter } from './compressor/writer.ts'
export * from './compressor/common.ts'

/**
 * Built-in compressors for supported types.
 * 内置的类型压缩器集合。
 */
const compressors: Compressors = {
    any: compressAny,
    array: compressArray,
    object: compressObject,
    string: compressString,
    date: compressDate,
    number: compressNumber,
    template: {
        Object: TemplateObject,
    },
}

/**
 * Create a new compression context.
 * 创建新的压缩上下文。
 *
 * @returns Fresh compression context.
 * @returns 新的压缩上下文。
 */
export function makeCompressContext(): Context {
    return {
        arrayItemWriters: [],
        arrayLevel: 0,
    }
}

/**
 * Create an inverted index for compression.
 * 创建用于压缩的反向索引。
 *
 * @returns Fresh inverted index.
 * @returns 新的反向索引。
 */
export function makeInvertedIndex(): InvertedIndex {
    return {
        stringMap: {},
        integerMap: {},
        floatMap: {},
        dateMap: {},
        lpDateMap: {},
        stringCount: 0,
        integerCount: 0,
        floatCount: 0,
        dateCount: 0,
        lpDateCount: 0,
    }
}

/**
 * Compress all data onto a provided writer.
 * 将所有数据压缩并写入指定写入器。
 *
 * @param context - Compression context.
 * @param context - 压缩上下文。
 * @param obj - Value to compress.
 * @param obj - 待压缩的值。
 * @param invertedIndex - Inverted index for references.
 * @param invertedIndex - 引用用的反向索引。
 * @param writer - Output writer.
 * @param writer - 输出写入器。
 * @param options - Compression options.
 * @param options - 压缩选项。
 */
export function compress(
    context: Context,
    obj: any,
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
) {
    compressors.any(compressors, context, obj, invertedIndex, writer, options)
}
