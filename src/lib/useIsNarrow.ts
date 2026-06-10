import { useEffect, useState } from 'react';

/**
 * 移动端断点 hook
 * @returns 当前 window.innerWidth <= breakpoint
 */
export function useIsNarrow(breakpoint = 768): boolean {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );
  useEffect(() => {
    function onResize() { setNarrow(window.innerWidth <= breakpoint); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return narrow;
}
