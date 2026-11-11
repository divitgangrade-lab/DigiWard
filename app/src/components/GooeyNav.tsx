import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import './GooeyNav.css';

/**
 * Gooey navigation, adapted from React Bits' GooeyNav (JS + CSS variant).
 *
 * Differences from the published demo, all deliberate:
 * - the active index can be controlled, so the page can sync it to the section
 *   in view rather than only to clicks;
 * - particles and the goo filter are skipped under prefers-reduced-motion;
 * - timers and injected particles are cleaned up on unmount;
 * - colours come from the site tokens instead of the demo's white-on-dark.
 */

export interface GooeyNavItem {
  label: string;
  href: string;
}

interface GooeyNavProps {
  items: readonly GooeyNavItem[];
  activeIndex?: number;
  onChange?: (index: number, item: GooeyNavItem) => void;
  ariaLabel?: string;
  initialActiveIndex?: number;
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: readonly string[];
}

interface Particle {
  start: [number, number];
  end: [number, number];
  time: number;
  scale: number;
  color: string;
  rotate: number;
}

const noise = (amount = 1): number => amount / 2 - Math.random() * amount;

const getXY = (distance: number, pointIndex: number, totalPoints: number): [number, number] => {
  const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
  return [distance * Math.cos(angle), distance * Math.sin(angle)];
};

const DEFAULT_COLORS = ['var(--paper)', 'var(--rule-strong)', 'var(--paper-sunk)'] as const;

export function GooeyNav({
  items,
  activeIndex,
  onChange,
  ariaLabel = 'Sections',
  initialActiveIndex = 0,
  animationTime = 600,
  particleCount = 12,
  particleDistances = [58, 8],
  particleR = 70,
  timeVariance = 220,
  colors = DEFAULT_COLORS,
}: GooeyNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const timers = useRef<Set<number>>(new Set());
  const [innerIndex, setInnerIndex] = useState(initialActiveIndex);
  const current = Math.min(Math.max(0, activeIndex ?? innerIndex), Math.max(0, items.length - 1));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timersAtMount = timers.current;
    return () => {
      for (const timer of timersAtMount) window.clearTimeout(timer);
      timersAtMount.clear();
    };
  }, []);

  const schedule = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
  };

  const updateEffectPosition = (element: HTMLElement) => {
    const container = containerRef.current;
    const filter = filterRef.current;
    const text = textRef.current;
    if (!container || !filter || !text) return;
    const containerRect = container.getBoundingClientRect();
    const pos = element.getBoundingClientRect();
    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filter.style, styles);
    Object.assign(text.style, styles);
    text.innerText = element.innerText;
  };

  const createParticle = (index: number, time: number): Particle => {
    const rotate = noise(particleR / 10);
    return {
      start: getXY(particleDistances[0], particleCount - index, particleCount),
      end: getXY(particleDistances[1] + noise(7), particleCount - index, particleCount),
      time,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)] ?? DEFAULT_COLORS[0],
      rotate: rotate > 0 ? (rotate + particleR / 20) * 10 : (rotate - particleR / 20) * 10,
    };
  };

  const makeParticles = (element: HTMLElement) => {
    if (reduceMotion) return;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);
    for (let i = 0; i < particleCount; i += 1) {
      const time = animationTime * 2 + noise(timeVariance * 2);
      const particleData = createParticle(i, time);
      schedule(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.className = 'particle';
        particle.style.setProperty('--start-x', `${particleData.start[0]}px`);
        particle.style.setProperty('--start-y', `${particleData.start[1]}px`);
        particle.style.setProperty('--end-x', `${particleData.end[0]}px`);
        particle.style.setProperty('--end-y', `${particleData.end[1]}px`);
        particle.style.setProperty('--time', `${particleData.time}ms`);
        particle.style.setProperty('--scale', `${particleData.scale}`);
        particle.style.setProperty('--color', particleData.color);
        particle.style.setProperty('--rotate', `${particleData.rotate}deg`);
        point.className = 'point';
        particle.append(point);
        element.append(particle);
        requestAnimationFrame(() => element.classList.add('active'));
        schedule(() => particle.remove(), time);
      }, 30);
    }
  };

  const select = (element: HTMLElement, index: number) => {
    if (index === current) return;
    if (activeIndex === undefined) setInnerIndex(index);
    onChange?.(index, items[index] as GooeyNavItem);
    updateEffectPosition(element);
    const filter = filterRef.current;
    const text = textRef.current;
    if (filter) {
      for (const particle of filter.querySelectorAll('.particle')) particle.remove();
      filter.classList.remove('is-active');
      void filter.offsetWidth;
    }
    if (text) {
      text.classList.remove('active');
      void text.offsetWidth;
      text.classList.add('active');
    }
    if (filter) makeParticles(filter);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    const item = items[index];
    if (item?.href === '#') event.preventDefault();
    select(event.currentTarget.parentElement ?? event.currentTarget, index);
  };

  useEffect(() => {
    const list = navRef.current;
    if (!list) return undefined;
    const active = list.querySelectorAll('li')[current];
    if (active) {
      updateEffectPosition(active);
      textRef.current?.classList.add('active');
    }
    const observer = new ResizeObserver(() => {
      const currentActive = navRef.current?.querySelectorAll('li')[current];
      if (currentActive) updateEffectPosition(currentActive);
    });
    if (containerRef.current) observer.observe(containerRef.current);
    observer.observe(list);
    return () => observer.disconnect();
  }, [current, items.length]);

  return (
    <div className="gooey-nav" ref={containerRef}>
      <nav aria-label={ariaLabel}>
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li key={`${item.href}-${item.label}`} className={current === index ? 'is-active' : ''}>
              <a
                href={item.href}
                onClick={(event) => handleClick(event, index)}
                aria-current={current === index ? 'location' : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <span className="effect effect--filter" ref={filterRef} aria-hidden="true" />
      <span className="effect effect--text" ref={textRef} aria-hidden="true" />
    </div>
  );
}

export default GooeyNav;
