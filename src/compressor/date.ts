import {
    DATE_LOW_PRECISION,
    REF_LP_DATE_TOKEN,
    LP_DATE_TOKEN,
    REFERENCE_HEADER_LENGTH,
    UNREFERENCED_LP_DATE_TOKEN,
    REF_DATE_TOKEN,
    DATE_TOKEN,
    UNREFERENCED_DATE_TOKEN,
} from '../constants.ts'
import { compressInteger } from '../util.ts'
import type { Context, InvertedIndex, CompressOptions, Compressors } from './common.ts'
import { ZipsonWriter } from './writer.ts'

/**
 * Compress date (as unix timestamp) to the writer.
 * 将日期（Unix 时间戳）压缩并写入写入器。
 *
 * @param compressors - All compressors' registry.
 * @param compressors - 压缩器注册表。
 * @param context - Compression context.
 * @param context - 压缩上下文。
 * @param obj - Unix timestamp to compress.
 * @param obj - 待压缩的 Unix 时间戳。
 * @param invertedIndex - Inverted index for references.
 * @param invertedIndex - 引用用的反向索引。
 * @param writer - Output writer.
 * @param writer - 输出写入器。
 * @param options - Compression options.
 * @param options - 压缩选项。
 */
export function compressDate(
    compressors: Compressors,
    context: Context,
    obj: number,
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
) {
    let foundRef: string | undefined

    /**
     * Determine if we should represent the date with low precision
     */
    const lowPrecisionDate = obj / DATE_LOW_PRECISION
    const isLowPrecision = lowPrecisionDate % 1 === 0

    if (isLowPrecision) {
        if ((foundRef = invertedIndex.lpDateMap[lowPrecisionDate]) !== void 0) {
            writer.write(`${REF_LP_DATE_TOKEN}${foundRef}`)
        } else {
            const ref = compressInteger(invertedIndex.lpDateCount)
            const compressedDate = compressInteger(lowPrecisionDate)
            const newRef = `${LP_DATE_TOKEN}${compressedDate}`
            if (ref.length + REFERENCE_HEADER_LENGTH < newRef.length) {
                invertedIndex.lpDateMap[lowPrecisionDate] = ref
                invertedIndex.lpDateCount++
                writer.write(newRef)
            } else {
                writer.write(`${UNREFERENCED_LP_DATE_TOKEN}${compressedDate}`)
            }
        }
    } else {
        if ((foundRef = invertedIndex.dateMap[obj]) !== void 0) {
            writer.write(`${REF_DATE_TOKEN}${foundRef}`)
        } else {
            const ref = compressInteger(invertedIndex.dateCount)
            const compressedDate = compressInteger(obj)
            const newRef = `${DATE_TOKEN}${compressedDate}`
            if (ref.length + REFERENCE_HEADER_LENGTH < newRef.length) {
                invertedIndex.dateMap[obj] = ref
                invertedIndex.dateCount++
                writer.write(newRef)
            } else {
                writer.write(`${UNREFERENCED_DATE_TOKEN}${compressedDate}`)
            }
        }
    }
}
