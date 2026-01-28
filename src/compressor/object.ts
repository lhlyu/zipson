import { OBJECT_START_TOKEN, OBJECT_END_TOKEN } from '../constants.ts'
import type { Context, InvertedIndex, CompressOptions, Compressors } from './common.ts'
import { ZipsonWriter } from './writer.ts'

/**
 * Compress an object to the writer.
 * 将对象压缩并写入写入器。
 *
 * @param compressors - All compressors' registry.
 * @param compressors - 压缩器注册表。
 * @param context - Compression context.
 * @param context - 压缩上下文。
 * @param obj - Object to compress.
 * @param obj - 待压缩的对象。
 * @param invertedIndex - Inverted index for references.
 * @param invertedIndex - 引用用的反向索引。
 * @param writer - Output writer.
 * @param writer - 输出写入器。
 * @param options - Compression options.
 * @param options - 压缩选项。
 */
export function compressObject(
    compressors: Compressors,
    context: Context,
    obj: any,
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
) {
    writer.write(OBJECT_START_TOKEN)
    const keys = Object.keys(obj)

    // Create a template object for the first two keys in an object
    const firstKey = keys[0]
    const secondKey = keys[1]
    let templateObject = new compressors.template.Object(
        firstKey !== undefined ? obj[firstKey] : void 0,
        secondKey !== undefined ? obj[secondKey] : void 0,
    )

    // Compress template is templating
    if (templateObject.isTemplating) {
        templateObject.compressTemplate(compressors, context, invertedIndex, writer, options)
    }

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (key === undefined) {
            continue
        }

        // Determine if still templating after the two first keys
        if (i > 1 && templateObject.isTemplating) {
            templateObject.isNextTemplate(obj[key], writer)
        }

        if (templateObject.isTemplating) {
            // Compress id and template values if templating
            compressors.string(compressors, context, key, invertedIndex, writer, options)
            templateObject.compressTemplateValues(
                compressors,
                context,
                invertedIndex,
                writer,
                options,
                obj[key],
            )
        } else {
            // Compress object key and value if not templating
            const val = obj[key]
            if (val !== undefined) {
                compressors.string(compressors, context, key, invertedIndex, writer, options)
                compressors.any(compressors, context, val, invertedIndex, writer, options)
            }
        }
    }

    // Finalize a template object if still templating
    if (templateObject.isTemplating) {
        templateObject.end(writer)
    }

    writer.write(OBJECT_END_TOKEN)
}
