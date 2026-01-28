import {
    DATE_REGEX,
    REF_STRING_TOKEN,
    REGEX_STRING_TOKEN,
    ESCAPED_STRING_TOKEN,
    STRING_TOKEN,
    REFERENCE_HEADER_LENGTH,
    UNREFERENCED_STRING_TOKEN,
    REGEX_UNREFERENCED_STRING_TOKEN,
    ESCAPED_UNREFERENCED_STRING_TOKEN,
    STRING_IDENT_PREFIX,
    ESCAPE_CHARACTER,
    REGEX_ESCAPE_CHARACTER,
} from '../constants.ts'
import { compressInteger } from '../util.ts'
import type { Context, InvertedIndex, CompressOptions, Compressors } from './common.ts'
import { ZipsonWriter } from './writer.ts'

/**
 * Compress a string value to the writer.
 * 将字符串值压缩并写入写入器。
 *
 * @param compressors - All compressors' registry.
 * @param compressors - 压缩器注册表。
 * @param context - Compression context.
 * @param context - 压缩上下文。
 * @param obj - String to compress.
 * @param obj - 待压缩的字符串。
 * @param invertedIndex - Inverted index for references.
 * @param invertedIndex - 引用用的反向索引。
 * @param writer - Output writer.
 * @param writer - 输出写入器。
 * @param options - Compression options.
 * @param options - 压缩选项。
 */
export function compressString(
    compressors: Compressors,
    context: Context,
    obj: string,
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
) {
    let foundRef: string | undefined

    //
    const stringIdent = STRING_IDENT_PREFIX + obj

    // Detect if a string is utc timestamp if enabled
    if (options.detectUtcTimestamps && obj[obj.length - 1] === 'Z' && obj.match(DATE_REGEX)) {
        const date = Date.parse(obj)
        compressors.date(compressors, context, date, invertedIndex, writer, options)
    } else if ((foundRef = invertedIndex.stringMap[stringIdent]) !== void 0) {
        writer.write(`${REF_STRING_TOKEN}${foundRef}`)
    } else {
        const ref = compressInteger(invertedIndex.stringCount)
        const newRef = `${STRING_TOKEN}${obj.replace(REGEX_ESCAPE_CHARACTER, ESCAPE_CHARACTER + ESCAPE_CHARACTER).replace(REGEX_STRING_TOKEN, ESCAPED_STRING_TOKEN)}${STRING_TOKEN}`
        if (ref.length + REFERENCE_HEADER_LENGTH + 1 < newRef.length) {
            invertedIndex.stringMap[stringIdent] = ref
            invertedIndex.stringCount++
            writer.write(newRef)
        } else {
            writer.write(
                `${UNREFERENCED_STRING_TOKEN}${obj.replace(REGEX_ESCAPE_CHARACTER, ESCAPE_CHARACTER + ESCAPE_CHARACTER).replace(REGEX_UNREFERENCED_STRING_TOKEN, ESCAPED_UNREFERENCED_STRING_TOKEN)}${UNREFERENCED_STRING_TOKEN}`,
            )
        }
    }
}
