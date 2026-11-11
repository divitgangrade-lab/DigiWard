import { useEffect, useState } from 'react';

/**
 * Follows the section under the sticky header. Scroll work is batched into one
 * animation frame, so the nav does not force layout on every scroll event.
 */
export const useActiveSection = (ids: readonly string[], offset?: number): string => {
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const headerHeight = document.querySelector('.masthead')?.getBoundingClientRect().height ?? 96;
      const threshold = offset ?? headerHeight + 24;
      let current = ids[0] ?? '';
      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= threshold) current = id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (raf !== 0) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    update();
    const header = document.querySelector('.masthead');
    const headerObserver = header ? new ResizeObserver(schedule) : null;
    if (header && headerObserver) headerObserver.observe(header);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    return () => {
      cancelAnimationFrame(raf);
      headerObserver?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  }, [ids, offset]);

  return active;
};
