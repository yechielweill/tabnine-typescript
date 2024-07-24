export interface IQueue<T> {
    enqueue(item: T, priority?: number): void;
    dequeue(): T | undefined;
    isEmpty(): boolean;
}
