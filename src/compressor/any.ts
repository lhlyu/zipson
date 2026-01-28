import {
    BOOLEAN_TRUE_TOKEN,
    BOOLEAN_FALSE_TOKEN,
    NULL_TOKEN,
    UNDEFINED_TOKEN,
} from '../constants.ts'
import type { InvertedIndex, Context, CompressOptions, Compressors } from './common.ts'
import { ZipsonWriter } from './writer.ts'

/**
 * Compress any supported data type to the writer.
 * 将任意受支持的数据类型压缩并写入写入器。
 *
 * @param compressors - All compressors' registry.
 * @param compressors - 压缩器注册表。
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
export function compressAny(
    compressors: Compressors,
    context: Context,
    obj: any,
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
) {
    const type = typeof obj

    if (type === 'number') {
        compressors.number(compressors, context, obj, invertedIndex, writer, options)
    } else if (type === 'string') {
        compressors.string(compressors, context, obj, invertedIndex, writer, options)
    } else if (type === 'boolean') {
        writer.write(obj ? BOOLEAN_TRUE_TOKEN : BOOLEAN_FALSE_TOKEN)
    } else if (obj === null) {
        writer.write(NULL_TOKEN)
    } else if (obj === undefined) {
        writer.write(UNDEFINED_TOKEN)
    } else if (Array.isArray(obj)) {
        compressors.array(compressors, context, obj, invertedIndex, writer, options)
    } else if (obj instanceof Date) {
        compressors.date(compressors, context, obj.getTime(), invertedIndex, writer, options)
    } else {
        compressors.object(compressors, context, obj, invertedIndex, writer, options)
    }
}
