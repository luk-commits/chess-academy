import { useEffect, useState } from 'react';

/**
 * Steruje animacją wejścia w etap: blokuje animację przy resetcie,
 * zwraca `animateBoard` do włączenia po krótkiej chwili (lub po wybłyśnięciu intro FEN).
 * Zwraca też `revealIntro` - callback do podstawienia intro FEN po starcie animacji.
 */
export function useStageIntroAnimation(
  resetKey: unknown,
  hasIntroFen: boolean,
  onRevealIntro: () => void,
) {
  const [animateBoard, setAnimateBoard] = useState(true);

  useEffect(() => {
    setAnimateBoard(false);
    if (hasIntroFen) {
      const tid = window.setTimeout(() => {
        setAnimateBoard(true);
        requestAnimationFrame(onRevealIntro);
      }, 250);
      return () => clearTimeout(tid);
    }
    const enableTid = window.setTimeout(() => setAnimateBoard(true), 100);
    return () => clearTimeout(enableTid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return animateBoard;
}
