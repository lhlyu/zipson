import {
    REF_INTEGER_TOKEN,
    INTEGER_TOKEN,
    REFERENCE_HEADER_LENGTH,
    UNREFERENCED_INTEGER_TOKEN,
    REF_FLOAT_TOKEN,
    FLOAT_TOKEN,
    UNREFERENCED_FLOAT_TOKEN,
    INTEGER_SMALL_EXCLUSIVE_BOUND_LOWER,
    INTEGER_SMALL_EXCLUSIVE_BOUND_UPPER,
    INTEGER_SMALL_TOKENS,
    INTEGER_SMALL_TOKEN_ELEMENT_OFFSET,
} from '../constants.ts'
import { compressInteger, compressFloat } from '../util.ts'
import type { Context, InvertedIndex, CompressOptions, Compressors } from './common.ts'
import { ZipsonWriter } from './writer.ts'

/**
 * Compress a number (integer or float) to the writer.
 * 将数字（整数或浮点数）压缩并写入写入器。
 *
 * @param compressors - All compressors' registry.
 * @param compressors - 压缩器注册表。
 * @param context - Compression context.
 * @param context - 压缩上下文。
 * @param obj - Number to compress.
 * @param obj - 待压缩的数字。
 * @param invertedIndex - Inverted index for references.
 * @param invertedIndex - 引用用的反向索引。
 * @param writer - Output writer.
 * @param writer - 输出写入器。
 * @param options - Compression options.
 * @param options - 压缩选项。
 */
export function compressNumber(
    compressors: Compressors,
    context: Context,
    obj: number,
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
) {
    let foundRef: string | undefined

    if (obj % 1 === 0) {
        // Check if the value is a small integer
        if (
            obj < INTEGER_SMALL_EXCLUSIVE_BOUND_UPPER &&
            obj > INTEGER_SMALL_EXCLUSIVE_BOUND_LOWER
        ) {
            const token = INTEGER_SMALL_TOKENS[obj + INTEGER_SMALL_TOKEN_ELEMENT_OFFSET]
            if (!token) {
                throw new Error(`Missing small integer token for value ${obj}`)
            }
            writer.write(token)
        } else if ((foundRef = invertedIndex.integerMap[obj]) !== void 0) {
            writer.write(`${REF_INTEGER_TOKEN}${foundRef}`)
        } else {
            const ref = compressInteger(invertedIndex.integerCount)
            const compressedInteger = compressInteger(obj)
            const newRef = `${INTEGER_TOKEN}${compressedInteger}`
            if (ref.length + REFERENCE_HEADER_LENGTH < newRef.length) {
                invertedIndex.integerMap[obj] = ref
                invertedIndex.integerCount++
                writer.write(newRef)
            } else {
                writer.write(`${UNREFERENCED_INTEGER_TOKEN}${compressedInteger}`)
            }
        }
    } else {
        // Compress float prior to lookup to reuse for "same" floating values
        const compressedFloat = compressFloat(obj, options.fullPrecisionFloats)
        if ((foundRef = invertedIndex.floatMap[compressedFloat]) !== void 0) {
            writer.write(`${REF_FLOAT_TOKEN}${foundRef}`)
        } else {
            const ref = compressInteger(invertedIndex.floatCount)
            const newRef = `${FLOAT_TOKEN}${compressedFloat}`
            if (ref.length + REFERENCE_HEADER_LENGTH < newRef.length) {
                invertedIndex.floatMap[compressedFloat] = ref
                invertedIndex.floatCount++
                writer.write(newRef)
            } else {
                writer.write(`${UNREFERENCED_FLOAT_TOKEN}${compressedFloat}`)
            }
        }
    }
}
