# zipson

[![npm](https://img.shields.io/npm/v/@lhlyu/zipson)](https://www.npmjs.com/package/@lhlyu/zipson)
![Last Commit](https://img.shields.io/github/last-commit/lhlyu/zipson)

Zipson is a drop-in alternative to `JSON.parse` / `JSON.stringify` with added compression and streaming support.

This repository is a maintained fork based on the original work by [@jgranstrom/zipson](https://github.com/jgranstrom/zipson).

## Install

```bash
npm install @lhlyu/zipson
```

## Quick Start

```ts
import { stringify, parse } from '@lhlyu/zipson'

const data = { hello: 'world', list: [1, 2, 3] }
const encoded = stringify(data)
const decoded = parse(encoded)
```

## API

### `stringify(data, options?)`

Stringify data to a zipson string.

### `stringifyTo(data, writer, options?)`

Stringify data to a specific zipson writer.

```ts
import { stringifyTo, ZipsonStringWriter } from '@lhlyu/zipson'

const writer = new ZipsonStringWriter()
stringifyTo([1, 2, 3], writer)
const encoded = writer.value
```

### `parse(string)`

Parse a zipson string.

### `parseIncremental()`

Incrementally parse a zipson string by feeding chunks. Call with `null` to finalize and get the result.

```ts
import { parseIncremental } from '@lhlyu/zipson'

const increment = parseIncremental()
increment(chunk1)
increment(chunk2)
const result = increment(null)
```

## Options

| Option                | Type    | Default | Description                                                                      |
| --------------------- | ------- | ------- | -------------------------------------------------------------------------------- |
| `detectUtcTimestamps` | boolean | `false` | Detect UTC timestamps such as `2018-01-01T00:00:00Z` and compress them as dates. |
| `fullPrecisionFloats` | boolean | `false` | Keep full floating point precision. Default is `10^-3`.                          |

## Notes

- Circular references are not supported. Provide JSON-safe objects only.
- Some decimals (for example `822.26702880859375`) can lose precision.

## Writer

Compression output is generalized to a writer class to support different output targets. Custom writers should implement:

```ts
abstract class ZipsonWriter {
    abstract write(data: string): void
    abstract end(): void
}
```

### Custom Writer Example

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

## Output and Types

This fork ships:

- ESM bundle: `dist/index.mjs`
- CJS bundle: `dist/index.cjs`
- Types: `types/` (mirrors `src/` structure)

## Build

JS bundles are produced by rolldown, and declaration files are produced by tsc:

```bash
npm run build
```

## Attribution

This project is based on the original zipson implementation by Jonas Granstrom.
Original repository: https://github.com/jgranstrom/zipson

## License

MIT. See `LICENSE`.
