/**
 * Drop-in replacement for `useServerFn` from @tanstack/react-start.
 *
 * The data layer now runs entirely in the browser, so there is no RPC to wrap —
 * the hook just hands back the function. Keeping the same shape means route
 * components did not have to change their call sites.
 */
export function useServerFn<T extends (...args: never[]) => unknown>(fn: T): T {
  return fn;
}
