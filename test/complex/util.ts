import { expect } from 'vitest'

import { stringify, parse, parseIncremental } from '../../src'

export class TestCase {
    constructor(
        public name: string,
        private obj: any,
        private tokens: string[],
    ) {}

    compress() {
        const compressed = stringify(this.obj)
        expect(compressed).toEqual(this.tokens.join(''))
    }

    decompress() {
        const decompressed = parse(this.tokens.join(''))
        expect(decompressed).toEqual(this.obj)
    }

    decompressIncremental() {
        const all = this.tokens.join('')
        for (let i = 0; i < all.length; i++) {
            for (let j = i; j < all.length; j++) {
                const increment = parseIncremental()
                increment(all.slice(0, i))
                increment(all.slice(i, j))
                increment(all.slice(j))
                expect(increment(null)).toEqual(this.obj)
            }
        }
    }
}
