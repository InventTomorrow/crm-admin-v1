import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

/** Slim fake progress bar across the top on route changes. */
export function RouteProgressBar() {
  const { pathname } = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setVisible(true);
    setProgress(15);
    const timers = [
      setTimeout(() => setProgress(65), 100),
      setTimeout(() => setProgress(90), 300),
      setTimeout(() => setProgress(100), 450),
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-90 h-0.5">
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
