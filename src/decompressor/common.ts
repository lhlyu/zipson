/**
 * Basic scalar types.
 * 基础标量类型。
 */
export type Scalar = string | null | undefined | boolean | number

/**
 * Skip scalar marker type.
 * 标量跳过标记类型。
 */
export interface SkipScalar {}
/**
 * Skip scalar marker instance.
 * 标量跳过标记实例。
 */
export const SKIP_SCALAR: SkipScalar = {}

/**
 * Referenced values indexed by order of occurrence.
 * 按出现顺序索引的引用值。
 */
export interface OrderedIndex {
    /**
     * Ordered string values.
     * 有序字符串值。
     */
    strings: string[]
    /**
     * Ordered integer values.
     * 有序整数值。
     */
    integers: number[]
    /**
     * Ordered float values.
     * 有序浮点值。
     */
    floats: number[]
    /**
     * Ordered date values (ISO strings).
     * 有序日期值（ISO 字符串）。
     */
    dates: string[]
    /**
     * Ordered low-precision date values (ISO strings).
     * 有序低精度日期值（ISO 字符串）。
     */
    lpDates: string[]
}

/**
 * Target type differentiators.
 * 目标类型区分标识。
 */
export enum TargetType {
    ARRAY = 'ARRAY',
    OBJECT = 'OBJECT',
    SCALAR = 'SCALAR',
    TEMPLATE_OBJECT = 'TEMPLATE_OBJECT',
    TEMPLATE_OBJECT_PROPERTIES = 'TEMPLATE_OBJECT_PROPERTIES',
    TEMPLATE_OBJECT_ELEMENTS = 'TEMPLATE_OBJECT_ELEMENTS',
}

/**
 * A current output target of a specified type.
 * 指定类型的当前输出目标。
 */
export type Target =
    | ScalarTarget
    | ArrayTarget
    | ObjectTarget
    | TemplateObjectTarget
    | TemplateObjectPropertiesTarget
    | TemplateObjectElementsTarget

/**
 * Basic output targets.
 * 基础输出目标类型。
 */
export interface BaseTarget<T> {
    /**
     * Target type tag.
     * 目标类型标记。
     */
    type: T
    /**
     * Target value.
     * 目标值。
     */
    value: any
}
/**
 * Scalar output target.
 * 标量输出目标。
 */
export interface ScalarTarget extends BaseTarget<TargetType.SCALAR> {
    value: any
}
/**
 * Array output target.
 * 数组输出目标。
 */
export interface ArrayTarget extends BaseTarget<TargetType.ARRAY> {
    value: any[]
}
/**
 * Object output target.
 * 对象输出目标。
 */
export interface ObjectTarget extends BaseTarget<TargetType.OBJECT> {
    /**
     * Pending object key.
     * 等待写入的对象键。
     */
    key?: any
}

/**
 * Template object output targets.
 * 模板对象输出目标。
 */
export interface TemplateObjectTarget extends BaseTarget<TargetType.TEMPLATE_OBJECT> {
    /**
     * Template target has no direct value.
     * 模板目标不直接持有值。
     */
    value: void
    /**
     * Property paths derived from the template.
     * 从模板推导出的属性路径。
     */
    paths: string[][]
    /**
     * Current nesting level.
     * 当前嵌套层级。
     */
    level: number
    /**
     * Current route prefix for nested tokens.
     * 嵌套令牌的当前路径前缀。
     */
    currentRoute: string[]
    /**
     * Most recent token in the current route.
     * 当前路径中的最近令牌。
     */
    currentToken?: string
    /**
     * Collected tokens at the current level.
     * 当前层级收集的令牌。
     */
    currentTokens: string[]
    /**
     * Parent target receiving the templated output.
     * 接收模板输出的父目标。
     */
    parentTarget: ArrayTarget | ObjectTarget
}
/**
 * Intermediate template target state.
 * 模板目标的中间状态。
 */
export interface TemplateObjectIntermediateTarget<T> extends BaseTarget<T> {
    /**
     * Property paths derived from the template.
     * 从模板推导出的属性路径。
     */
    paths: string[][]
    /**
     * Current object being populated.
     * 正在填充的当前对象。
     */
    currentObject: any
    /**
     * Current path index.
     * 当前路径索引。
     */
    currentPathIndex: number
    /**
     * Expected number of paths.
     * 期望的路径数量。
     */
    expectedPaths: number
}
/**
 * Template properties target.
 * 模板属性目标。
 */
export interface TemplateObjectPropertiesTarget extends TemplateObjectIntermediateTarget<TargetType.TEMPLATE_OBJECT_PROPERTIES> {
    value: any
}
/**
 * Template elements target.
 * 模板元素目标。
 */
export interface TemplateObjectElementsTarget extends TemplateObjectIntermediateTarget<TargetType.TEMPLATE_OBJECT_ELEMENTS> {
    value: any[]
}

/**
 * Decompression cursor state.
 * 解压游标状态。
 */
export type Cursor = {
    /**
     * Current index in the data string.
     * 数据字符串中的当前位置。
     */
    index: number
    /**
     * Root target to store the result.
     * 用于存放结果的根目标。
     */
    rootTarget: ScalarTarget
    /**
     * Target stack.
     * 目标栈。
     */
    stack: Target[]
    /**
     * Stack pointer.
     * 栈指针。
     */
    pointer: number
    /**
     * Current target being written.
     * 当前写入的目标。
     */
    currentTarget: Target
    /**
     * Drain mode for incremental parsing.
     * 增量解析的 drain 模式。
     */
    drain: boolean
}
