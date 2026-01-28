import { ZipsonStringWriter, ZipsonWriter } from './writer.ts'

/**
 * Compression context for a single compression process.
 * 单次压缩流程的上下文信息。
 */
export interface Context {
    /**
     * Stack of array item writers for nested arrays.
     * 嵌套数组的写入器栈。
     */
    arrayItemWriters: ZipsonStringWriter[]
    /**
     * Current array nesting level.
     * 当前数组嵌套层级。
     */
    arrayLevel: number
}

/**
 * Optional compression options.
 * 可选的压缩配置项。
 */
export interface CompressOptions {
    /**
     * Automatically detect UTC timestamps (e.g., 2018-01-01T00:00:00.000Z) and compress them as dates.
     * 自动检测 UTC 时间戳（例如 2018-01-01T00:00:00.000Z），并按日期压缩。
     */
    detectUtcTimestamps?: boolean

    /**
     * Include full precision floating point numbers in compression output (e.g., 1.232323232323).
     * 压缩输出中保留完整浮点精度（例如 1.232323232323）。
     */
    fullPrecisionFloats?: boolean
}

/**
 * Map from discovered values to their respective reference identifiers.
 * 已发现值到其引用标识符的映射表。
 */
export interface InvertedIndex {
    /**
     * String value map.
     * 字符串值映射。
     */
    stringMap: { [index: string]: string }
    /**
     * Integer value map.
     * 整数值映射。
     */
    integerMap: { [index: number]: string }
    /**
     * Float value map.
     * 浮点值映射。
     */
    floatMap: { [index: string]: string }
    /**
     * Date (timestamp) value map.
     * 日期（时间戳）值映射。
     */
    dateMap: { [index: number]: string }
    /**
     * Low-precision date (timestamp) value map.
     * 低精度日期（时间戳）值映射。
     */
    lpDateMap: { [index: number]: string }
    /**
     * Count of unique strings.
     * 唯一字符串数量。
     */
    stringCount: number
    /**
     * Count of unique integers.
     * 唯一整数数量。
     */
    integerCount: number
    /**
     * Count of unique floats.
     * 唯一浮点数量。
     */
    floatCount: number
    /**
     * Count of unique dates.
     * 唯一日期数量。
     */
    dateCount: number
    /**
     * Count of unique low-precision dates.
     * 唯一低精度日期数量。
     */
    lpDateCount: number
}

/**
 * Compression function for a specific type, writing compressed output to a writer.
 * 针对特定类型的压缩函数，将压缩输出写入指定写入器。
 */
export type Compressor<T> = (
    compressors: Compressors,
    context: Context,
    obj: T,
    invertedIndex: InvertedIndex,
    writer: ZipsonWriter,
    options: CompressOptions,
) => void

export interface TemplateCompressor<T> {
    /**
     * Are we currently templating?
     * 当前是否处于模板化阶段？
     */
    isTemplating: boolean

    /**
     * Determine if we are still templating with a new object.
     * 使用新对象判断是否仍处于模板化阶段。
     */
    isNextTemplate: (obj: T, writer: ZipsonWriter) => void

    /**
     * Compress the template structure.
     * 压缩模板结构。
     */
    compressTemplate: (
        compressors: Compressors,
        context: Context,
        invertedIndex: InvertedIndex,
        writer: ZipsonWriter,
        options: CompressOptions,
    ) => void

    /**
     * Compress values with a template structure.
     * 使用模板结构压缩具体值。
     */
    compressTemplateValues: (
        compressors: Compressors,
        context: Context,
        invertedIndex: InvertedIndex,
        writer: ZipsonWriter,
        options: CompressOptions,
        obj: T,
    ) => void

    /**
     * Finalize the compressed template.
     * 完成模板压缩的收尾处理。
     */
    end: (writer: ZipsonWriter) => void
}

/**
 * All available compressors for specific types.
 * 针对不同类型的压缩器集合。
 */
export interface Compressors {
    /**
     * Generic compressor.
     * 通用压缩器。
     */
    any: Compressor<any>
    /**
     * Array compressor.
     * 数组压缩器。
     */
    array: Compressor<any[]>
    /**
     * Object compressor.
     * 对象压缩器。
     */
    object: Compressor<any>
    /**
     * String compressor.
     * 字符串压缩器。
     */
    string: Compressor<string>
    /**
     * Date compressor (timestamp).
     * 日期压缩器（时间戳）。
     */
    date: Compressor<number>
    /**
     * Number compressor.
     * 数值压缩器。
     */
    number: Compressor<number>
    /**
     * Template compressor factory.
     * 模板压缩器工厂。
     */
    template: {
        Object: new (a: any, b: any) => TemplateCompressor<any>
    }
}
