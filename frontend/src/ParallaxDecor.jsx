import { useEffect } from 'react';

export default function ParallaxDecor() {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 1600);
        document.documentElement.style.setProperty('--parallax-slow', `${y * -0.035}px`);
        document.documentElement.style.setProperty('--parallax-mid', `${y * -0.075}px`);
        document.documentElement.style.setProperty('--parallax-fast', `${y * -0.12}px`);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--parallax-slow');
      document.documentElement.style.removeProperty('--parallax-mid');
      document.documentElement.style.removeProperty('--parallax-fast');
    };
  }, []);

  return (
    <>
      <div className="parallax-decor" aria-hidden="true">
        <span className="parallax-shape shape-disc" />
        <span className="parallax-shape shape-tape" />
        <span className="parallax-shape shape-pencil" />
      </div>
      <div className="paper-grain" aria-hidden="true" />
    </>
  );
}
