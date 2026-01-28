import {
    ARRAY_REPEAT_COUNT_THRESHOLD,
    ARRAY_REPEAT_MANY_TOKEN,
    ARRAY_REPEAT_TOKEN,
    ARRAY_END_TOKEN,
    ARRAY_START_TOKEN,
} from '../constants.ts'
import { compressInteger } from '../util.ts'
import type { Context, InvertedIndex, CompressOptions, Compressors } from './common.ts'
import { ZipsonWriter, ZipsonStringWriter } from './writer.ts'

/**
 * Compress an array to the writer.
 * 将数组压缩并写入写入器。
 *
 * @param compressors - All compressors' registry.
 * @param compressors - 压缩器注册表。
 * @param context - Compression context.
 * @param array - Array to compress.
 * @param array - 待压缩的数组。
 * @param invertedIndex - Inverted index for references.
 * @param invertedIndex - 引用用的反向索引。
 * @param writer - Output writer.
 * @param writer - 输出写入器。
 * @param options - Compression options.
 * @param options - 压缩选项。
 */
export function compressArray(
    compressors: Compressors,
    context: Context,
    array: any[],
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
) {
    // Increase the context array level and create a new element writer if needed
    context.arrayLevel++
    if (context.arrayLevel > context.arrayItemWriters.length) {
        context.arrayItemWriters.push(new ZipsonStringWriter())
    }

    // Get the element and parent writer
    const arrayItemWriter = context.arrayItemWriters[context.arrayLevel - 1]
    const parentWriter = context.arrayItemWriters[context.arrayLevel - 2] || writer
    if (!arrayItemWriter) {
        throw new Error('Array item writer is not initialized')
    }

    parentWriter.write(ARRAY_START_TOKEN)
    let previousItem = ''
    let repeatedTimes = 0
    let repeatManyCount = 0

    // Create a template object for the first two keys in an object
    let templateObject = new compressors.template.Object(array[0], array[1])

    // Compress template is templating
    if (templateObject.isTemplating) {
        templateObject.compressTemplate(compressors, context, invertedIndex, parentWriter, options)
    }

    for (let i = 0; i < array.length; i++) {
        let item = array[i]
        arrayItemWriter.value = ''

        // Make undefined elements into null values
        if (item === undefined) {
            item = null
        }

        // Determine if still templating after the two first elements
        if (i > 1 && templateObject.isTemplating) {
            templateObject.isNextTemplate(array[i], parentWriter)
        }

        if (templateObject.isTemplating) {
            // Compress template values if templating
            templateObject.compressTemplateValues(
                compressors,
                context,
                invertedIndex,
                arrayItemWriter,
                options,
                array[i],
            )
        } else {
            // Compress any element otherwise
            compressors.any(compressors, context, item, invertedIndex, arrayItemWriter, options)
        }

        // Check if we wrote an identical element
        if (arrayItemWriter.value === previousItem) {
            // Count repetitions and see if we repeated enough to use many tokens
            repeatedTimes++
            if (repeatedTimes >= ARRAY_REPEAT_COUNT_THRESHOLD) {
                // Write a many token if needed and count how many " times we repeated
                if (repeatManyCount === 0) {
                    parentWriter.write(ARRAY_REPEAT_MANY_TOKEN)
                }
                repeatManyCount++
            } else {
                // Default to standard repeat token
                parentWriter.write(ARRAY_REPEAT_TOKEN)
            }
        } else {
            repeatedTimes = 0
            if (repeatManyCount > 0) {
                // If we repeated many times, write the count before the next element
                parentWriter.write(compressInteger(repeatManyCount))
                repeatManyCount = 0
            }
            parentWriter.write(arrayItemWriter.value)
            previousItem = arrayItemWriter.value
        }
    }

    // If still repeating may, write the final repeat count
    if (repeatManyCount > 0) {
        parentWriter.write(compressInteger(repeatManyCount))
    }

    // Finalize a template object if still templating
    if (templateObject.isTemplating) {
        templateObject.end(parentWriter)
    }

    parentWriter.write(ARRAY_END_TOKEN)

    context.arrayLevel--
}
