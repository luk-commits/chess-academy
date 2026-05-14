import { useCallback, useState } from 'react';

export function useCardTagsExpanded() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = useCallback((id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return { expanded, toggle };
}
