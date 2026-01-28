# zipson

[![npm](https://img.shields.io/npm/v/@lhlyu/zipson)](https://www.npmjs.com/package/@lhlyu/zipson)
![Last Commit](https://img.shields.io/github/last-commit/lhlyu/zipson)

Zipson 是 `JSON.parse` / `JSON.stringify` 的可替代方案，提供压缩与流式解析能力。

本仓库基于原作者 [@jgranstrom/zipson](https://github.com/jgranstrom/zipson) 的实现进行维护与改进。

## 安装

```bash
npm install @lhlyu/zipson
```

## 快速开始

```ts
import { stringify, parse } from '@lhlyu/zipson'

const data = { hello: 'world', list: [1, 2, 3] }
const encoded = stringify(data)
const decoded = parse(encoded)
```

## API

### `stringify(data, options?)`

将数据序列化为 zipson 字符串。

### `stringifyTo(data, writer, options?)`

将数据序列化到指定的 zipson 写入器。

```ts
import { stringifyTo, ZipsonStringWriter } from '@lhlyu/zipson'

const writer = new ZipsonStringWriter()
stringifyTo([1, 2, 3], writer)
const encoded = writer.value
```

### `parse(string)`

解析 zipson 字符串。

### `parseIncremental()`

分片增量解析 zipson 字符串。传入 `null` 表示结束并返回解析结果。

```ts
import { parseIncremental } from '@lhlyu/zipson'

const increment = parseIncremental()
increment(chunk1)
increment(chunk2)
const result = increment(null)
```

## 选项

| 选项                  | 类型    | 默认值  | 说明                                                      |
| --------------------- | ------- | ------- | --------------------------------------------------------- |
| `detectUtcTimestamps` | boolean | `false` | 检测 `2018-01-01T00:00:00Z` 这类 UTC 时间戳并按日期压缩。 |
| `fullPrecisionFloats` | boolean | `false` | 保留完整浮点精度，默认精度约为 `10^-3`。                  |

## 注意事项

- 不支持循环引用对象，请仅传入 JSON 安全的数据结构。
- 部分小数（例如 `822.26702880859375`）会出现精度损失。

## Writer

压缩输出统一通过写入器接口输出，便于扩展不同目标。自定义写入器需要实现：

```ts
abstract class ZipsonWriter {
    abstract write(data: string): void
    abstract end(): void
}
```

### 自定义写入器示例

```ts
import { ZipsonWriter, stringifyTo } from '@lhlyu/zipson'

class ArrayWriter extends ZipsonWriter {
    chunks: string[] = []
    write(data: string) {
        this.chunks.push(data)
    }
    end() {}
}

const writer = new ArrayWriter()
stringifyTo({ a: 1 }, writer)
const encoded = writer.chunks.join('')
```

## 输出与类型声明

本分支默认输出：

- ESM 包：`dist/index.mjs`
- CJS 包：`dist/index.cjs`
- 类型声明：`types/`（与 `src/` 目录结构一致）

## 构建

JS 包由 rolldown 生成，类型声明由 tsc 生成：

```bash
npm run build
```

## 版权与致谢

本项目基于 Jonas Granstrom 的 zipson 原始实现进行修改与改进。
原仓库地址：https://github.com/jgranstrom/zipson

## 许可证

MIT，详见 `LICENSE`。
