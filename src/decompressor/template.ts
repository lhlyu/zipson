import type {
    TemplateObjectIntermediateTarget,
    TemplateObjectPropertiesTarget,
    TemplateObjectElementsTarget,
} from '../index.ts'

/**
 * Append a parsed value into a template object by the current path.
 * 按当前路径将解析值追加到模板对象中。
 *
 * @param templateObjectTarget - Template target state.
 * @param templateObjectTarget - 模板目标状态。
 * @param targetValue - Parsed value to append.
 * @param targetValue - 要追加的解析值。
 */
function appendTemplateObjectValue(
    templateObjectTarget: TemplateObjectIntermediateTarget<any>,
    targetValue: any,
) {
    const currentPath = templateObjectTarget.paths[templateObjectTarget.currentPathIndex]
    if (!currentPath || currentPath.length === 0) {
        return
    }
    let i = 0
    let targetObject = templateObjectTarget.currentObject

    for (; i < currentPath.length - 1; i++) {
        const fragment = currentPath[i]
        if (fragment === undefined) {
            return
        }
        let next = targetObject[fragment]
        if (!next || typeof next !== 'object') {
            next = {}
            targetObject[fragment] = next
        }
        targetObject = next
    }

    // Undefined values are tokenized for a templated object to keep field order,
    // so we filter them in parsing to avoid including them in a parsed result
    if (targetValue !== void 0) {
        const leafKey = currentPath[i]
        if (leafKey === undefined) {
            return
        }
        targetObject[leafKey] = targetValue
    }
}

/**
 * Append a parsed value to a template object by properties.
 * 以属性方式将解析值追加到模板对象中。
 *
 * @param templateObjectElementsTarget - Template properties target.
 * @param templateObjectElementsTarget - 模板属性目标。
 * @param targetValue - Parsed value to append.
 * @param targetValue - 要追加的解析值。
 */
export function appendTemplateObjectPropertiesValue(
    templateObjectElementsTarget: TemplateObjectPropertiesTarget,
    targetValue: any,
) {
    // If we have a negative path index, that is the root identifier for a new object
    if (templateObjectElementsTarget.currentPathIndex === -1) {
        templateObjectElementsTarget.value[targetValue] =
            templateObjectElementsTarget.currentObject = {}
    } else {
        appendTemplateObjectValue(templateObjectElementsTarget, targetValue)
    }

    // If we got all path values, rotate to negative 1 for the next object
    if (
        ++templateObjectElementsTarget.currentPathIndex ===
        templateObjectElementsTarget.expectedPaths
    ) {
        templateObjectElementsTarget.currentPathIndex = -1
    }
}

/**
 * Append a parsed value to a template object by elements.
 * 以元素方式将解析值追加到模板对象中。
 *
 * @param templateObjectPropertiesTarget - Template elements target.
 * @param templateObjectPropertiesTarget - 模板元素目标。
 * @param targetValue - Parsed value to append.
 * @param targetValue - 要追加的解析值。
 */
export function appendTemplateObjectElementsValue(
    templateObjectPropertiesTarget: TemplateObjectElementsTarget,
    targetValue: any,
) {
    // If we have the first path value, create a new element
    if (templateObjectPropertiesTarget.currentPathIndex === 0) {
        templateObjectPropertiesTarget.currentObject = {}
        templateObjectPropertiesTarget.value.push(templateObjectPropertiesTarget.currentObject)
    }

    appendTemplateObjectValue(templateObjectPropertiesTarget, targetValue)

    // If we got all path values, rotate to 0 for the next element
    if (
        ++templateObjectPropertiesTarget.currentPathIndex ===
        templateObjectPropertiesTarget.expectedPaths
    ) {
        templateObjectPropertiesTarget.currentPathIndex = 0
    }
}
