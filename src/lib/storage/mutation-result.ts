export type SaveResult<T> = { status: 'persisted' | 'unchanged'; entity: T };
export const persisted = <T>(entity: T): SaveResult<T> => ({ status: 'persisted', entity });
export const unchanged = <T>(entity: T): SaveResult<T> => ({ status: 'unchanged', entity });
