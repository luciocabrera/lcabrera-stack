import { useEffect, useState } from 'react';

type SetValue<T> = (value: ((val: T) => T) | T) => void;

type UseLocalStorageArgs<T> = {
  readonly initialValue: T;
  readonly key: string;
};

/**
 * Custom hook for syncing state with localStorage
 * @template T - The type of the stored value
 * @param args - The hook arguments
 * @returns A tuple of [storedValue, setValue] similar to useState
 */
export const useLocalStorage = <T>({ initialValue, key }: UseLocalStorageArgs<T>): [T, SetValue<T>] => {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR safety check
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (globalThis.window === undefined) {
      return initialValue;
    }

    try {
      const item = globalThis.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value: ((val: T) => T) | T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = typeof value === 'function' ? (value as (val: T) => T)(storedValue) : value;

      setStoredValue(valueToStore);

      // SSR safety check
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (globalThis.window !== undefined) {
        globalThis.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    globalThis.addEventListener('storage', handleStorageChange);

    return () => {
      globalThis.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
};
