import { defineConfig } from 'rolldown'

export default defineConfig([
    {
        input: 'src/index.ts',
        output: {
            dir: 'dist',
            format: 'es',
            cleanDir: true,
            entryFileNames: 'index.mjs',
            codeSplitting: false,
        },
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.cjs',
            format: 'cjs',
            codeSplitting: false,
        },
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.iife.js',
            format: 'iife',
            name: 'Zipson',
            codeSplitting: false,
        },
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.umd.js',
            format: 'umd',
            name: 'Zipson',
            codeSplitting: false,
        },
    },
])
