import {
    TEMPLATE_OBJECT_FINAL,
    TEMPLATE_OBJECT_START,
    TEMPLATE_OBJECT_END,
} from '../../constants.ts'
import type {
    Context,
    InvertedIndex,
    CompressOptions,
    Compressors,
    TemplateCompressor,
} from '../common.ts'
import { isObject } from '../util.ts'
import { ZipsonWriter } from '../writer.ts'

/**
 * Template field with a single key.
 * 仅包含键名的模板字段。
 */
type TemplateStructField = [string]
/**
 * Template field with a nested structure.
 * 包含嵌套结构的模板字段。
 */
type TemplateStructNestedField = [string, TemplateStruct]
/**
 * Template structure for object keys and nested paths.
 * 对象键与嵌套路径的模板结构。
 */
interface TemplateStruct extends Array<TemplateStructField | TemplateStructNestedField> {
    [index: number]: TemplateStructField | TemplateStructNestedField
}

/**
 * Template compressor for object-like values.
 * 面向对象结构的模板压缩器。
 */
export class TemplateObject implements TemplateCompressor<any> {
    /**
     * Whether the compressor is currently templating.
     * 当前是否处于模板化状态。
     */
    public isTemplating = false
    /**
     * Discovered shared structure between objects.
     * 对象间共享的结构模板。
     */
    private struct: TemplateStruct = []

    /**
     * Create a new template object using two candidates that might share a structure.
     * 以两个可能共享结构的对象初始化模板对象。
     *
     * @param a - First object candidate.
     * @param a - 第一个对象候选。
     * @param b - Second object candidate.
     * @param b - 第二个对象候选。
     */
    constructor(a: any, b: any) {
        if (a != null && b != null) {
            this.isTemplating = buildTemplate(a, b, this.struct)
        }
    }

    /**
     * Compress the template structure to the writer.
     * 将模板结构压缩并写入写入器。
     *
     * @param compressors - All compressors' registry.
     * @param compressors - 压缩器注册表。
     * @param context - Compression context.
     * @param context - 压缩上下文。
     * @param invertedIndex - Inverted index for references.
     * @param invertedIndex - 引用用的反向索引。
     * @param writer - Output writer.
     * @param writer - 输出写入器。
     * @param options - Compression options.
     * @param options - 压缩选项。
     */
    compressTemplate(
        compressors: Compressors,
        context: Context,
        invertedIndex: InvertedIndex,
        writer: ZipsonWriter,
        options: CompressOptions,
    ) {
        compressObjectTemplate(compressors, context, invertedIndex, writer, options, this.struct)
    }

    /**
     * Compress object values based on the template structure.
     * 按模板结构压缩对象的值。
     *
     * @param compressors - All compressors' registry.
     * @param compressors - 压缩器注册表。
     * @param context - Compression context.
     * @param context - 压缩上下文。
     * @param invertedIndex - Inverted index for references.
     * @param invertedIndex - 引用用的反向索引。
     * @param writer - Output writer.
     * @param writer - 输出写入器。
     * @param options - Compression options.
     * @param options - 压缩选项。
     * @param obj - Object to compress.
     * @param obj - 待压缩的对象。
     */
    compressTemplateValues(
        compressors: Compressors,
        context: Context,
        invertedIndex: InvertedIndex,
        writer: ZipsonWriter,
        options: CompressOptions,
        obj: any,
    ) {
        compressObjectValues(compressors, context, invertedIndex, writer, options, this.struct, obj)
    }

    /**
     * Determine if the next object conforms to the existing template structure.
     * 如果不符合，将向写入器写入结束标记。
     *
     * @deprecated Use isNextTemplate instead.
     */
    isNextTemplate(obj: any, writer: ZipsonWriter) {
        this.isTemplating = conformsToStructure(this.struct, obj)
        if (!this.isTemplating) {
            writer.write(TEMPLATE_OBJECT_FINAL)
        }
    }

    /**
     * Finalize a template object and write an ending token.
     * 结束模板对象并写入结束标记。
     *
     * @param writer - Output writer.
     * @param writer - 输出写入器。
     */
    end(writer: ZipsonWriter) {
        writer.write(TEMPLATE_OBJECT_FINAL)
    }
}

/**
 * Build a shared template structure for two objects.
 * 若严格共享结构则返回 true，否则返回 false。
 *
 * @param a - First object candidate.
 * @param a - 第一个对象候选。
 * @param b - Second object candidate.
 * @param b - 第二个对象候选。
 * @param struct - Output structure container.
 * @param struct - 输出结构容器。
 * @param level - Current recursion depth.
 * @param level - 当前递归层级。
 * @returns Whether a shared structure was found.
 * @returns 是否找到共享结构。
 */
function buildTemplate(a: any, b: any, struct: TemplateStruct, level = 0): boolean {
    // Do not check deeper than 6 levels
    if (level > 6) {
        return false
    }

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    // If they do not have the same number of keys, it is not a shared structure
    if (keysA.length !== keysB.length) {
        return false
    }

    // Do not try to find a shared structure if there are more than 10 keys for one level
    if (keysA.length > 10) {
        return false
    }

    // Sort keys to assert structural equality
    keysA.sort((a, b) => a.localeCompare(b))
    keysB.sort((a, b) => a.localeCompare(b))

    // Check each key for structural equality
    for (let i = 0; i < keysA.length; i++) {
        const keyA = keysA[i]
        const keyB = keysB[i]
        if (keyA === undefined || keyB === undefined) {
            return false
        }
        // If the keys do not share the same identifier, they are not structurally equal
        if (keyA !== keyB) {
            return false
        }

        const valueA = a[keyA]
        const valueB = b[keyB]

        // Check if the key is an object
        if (isObject(valueA)) {
            if (!isObject(valueB)) {
                // If an is an object a b is not, they are not structurally equal
                return false
            }

            // Create a substructure for a nested object
            const nextStruct: TemplateStruct = []

            // Add key and substructure to the parent structure
            struct.push([keyA, nextStruct])

            // Check nested objects for structural equality
            if (!buildTemplate(valueA, valueB, nextStruct, level + 1)) {
                return false
            }
        } else if (isObject(valueB)) {
            // If an is not an object and b is, they are not structurally equal
            return false
        } else {
            struct.push([keyA])
        }
    }

    // If not on root level or root level is structurally equal objects, they are considered equal
    return level > 0 || isObject(a)
}

/**
 * Check if an object conforms to an existing structure.
 * 判断对象是否符合现有结构。
 *
 * @param struct - Template structure to validate against.
 * @param struct - 用于校验的模板结构。
 * @param obj - Object to validate.
 * @param obj - 待校验的对象。
 * @returns Whether the object conforms to the structure.
 * @returns 是否符合结构。
 */
function conformsToStructure(struct: TemplateStruct, obj: any) {
    if (!isObject(obj)) {
        return false
    }
    if (Object.keys(obj).length !== struct.length) {
        return false
    }
    for (let i = 0; i < struct.length; i++) {
        const field = struct[i]
        if (!field) {
            return false
        }
        const key = field[0]
        const nestedStruct = field.length > 1 ? field[1] : undefined
        if (obj[key] === void 0) {
            return false
        }
        if (nestedStruct) {
            if (!conformsToStructure(nestedStruct, obj[key])) {
                return false
            }
        } else {
            if (isObject(obj[key])) {
                return false
            }
        }
    }

    return true
}

/**
 * Compress an object template to the writer.
 * 将对象模板压缩并写入写入器。
 *
 * @param compressors - All compressors' registry.
 * @param compressors - 压缩器注册表。
 * @param context - Compression context.
 * @param context - 压缩上下文。
 * @param invertedIndex - Inverted index for references.
 * @param invertedIndex - 引用用的反向索引。
 * @param writer - Output writer.
 * @param writer - 输出写入器。
 * @param options - Compression options.
 * @param options - 压缩选项。
 * @param struct - Template structure.
 * @param struct - 模板结构。
 */
function compressObjectTemplate(
    compressors: Compressors,
    context: Context,
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
    struct: TemplateStruct,
) {
    writer.write(TEMPLATE_OBJECT_START)
    for (let i = 0; i < struct.length; i++) {
        const field = struct[i]
        if (!field) {
            continue
        }
        const key = field[0]
        const nestedStruct = field.length > 1 ? field[1] : undefined

        const nextStruct = field[1]
        const isNotEmpty = nextStruct && nextStruct.length > 0

        compressors.string(compressors, context, key, invertedIndex, writer, options)
        if (nestedStruct && isNotEmpty) {
            compressObjectTemplate(compressors, context, invertedIndex, writer, options, nextStruct)
        }
    }
    writer.write(TEMPLATE_OBJECT_END)
}

/**
 * Compress object values according to the provided structure.
 * 按提供的结构压缩对象值。
 *
 * @param compressors - All compressors' registry.
 * @param compressors - 压缩器注册表。
 * @param context - Compression context.
 * @param context - 压缩上下文。
 * @param invertedIndex - Inverted index for references.
 * @param invertedIndex - 引用用的反向索引。
 * @param writer - Output writer.
 * @param writer - 输出写入器。
 * @param options - Compression options.
 * @param options - 压缩选项。
 * @param struct - Template structure.
 * @param struct - 模板结构。
 * @param obj - Object to compress.
 * @param obj - 待压缩的对象。
 */
function compressObjectValues(
    compressors: Compressors,
    context: Context,
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
    struct: TemplateStruct,
    obj: any,
) {
    for (let i = 0; i < struct.length; i++) {
        const field = struct[i]
        if (!field) {
            continue
        }
        const key = field[0]
        const value = obj[key]
        const nestedStruct = field.length > 1 ? field[1] : undefined

        const nextStruct = field[1]
        const isNotEmpty = nextStruct && nextStruct.length > 0

        if (nestedStruct && isNotEmpty) {
            compressObjectValues(
                compressors,
                context,
                invertedIndex,
                writer,
                options,
                nextStruct,
                value,
            )
        } else {
            compressors.any(compressors, context, value, invertedIndex, writer, options)
        }
    }
}
