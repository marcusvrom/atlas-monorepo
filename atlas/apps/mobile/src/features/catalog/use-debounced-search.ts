import { useEffect, useState } from 'react';
export function useDebouncedSearch(value: string) {
  const [query, setQuery] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(value), 250);
    return () => clearTimeout(timer);
  }, [value]);
  return query;
}
