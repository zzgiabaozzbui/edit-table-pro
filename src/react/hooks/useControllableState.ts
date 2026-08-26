import { useCallback, useState } from "react";

/**
 * One convention for controlled/uncontrolled props: pass the controlled
 * value plus an onChange, or nothing and own the state internally.
 */
export function useControllableState<T>(
  controlled: T | undefined,
  fallback: T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] {
  const [internal, setInternal] = useState<T>(fallback);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : internal;
  const set = useCallback(
    (v: T) => {
      if (!isControlled) setInternal(v);
      onChange?.(v);
    },
    [isControlled, onChange],
  );
  return [value, set];
}
