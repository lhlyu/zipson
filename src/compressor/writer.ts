/**
 * Zipson writer base class; consumes zipson compression output chunks as strings.
 * Zipson Writer 抽象基类；接收 Zipson 压缩输出的字符串分片。
 */
export abstract class ZipsonWriter {
    /**
     * Write a chunk of compressed output.
     * 写入一段压缩输出分片。
     *
     * @param data - Output chunk content.
     * @param data - 输出分片内容。
     */
    abstract write(data: string): void
    /**
     * Signal that no more data will be written.
     * 通知写入结束，不再有更多数据。
     */
    abstract end(): void
}

/**
 * Accumulates all zipson compression output into a single string.
 * 将 Zipson 压缩输出完整累积到一个字符串中。
 */
export class ZipsonStringWriter extends ZipsonWriter {
    /**
     * The accumulated output string.
     * 累积的输出字符串。
     */
    public value: string = ''

    /**
     * Append a chunk to the internal buffer.
     * 将分片追加到内部缓冲区。
     *
     * @param data - Output chunk content.
     * @param data - 输出分片内容。
     */
    write(data: string) {
        this.value += data
    }

    /**
     * No-op for a string writer.
     * 字符串写入器无需收尾处理。
     */
    end() {}
}
