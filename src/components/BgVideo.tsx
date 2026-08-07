import { useEffect, useRef, useState } from 'react';

export default function BgVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const tryPlay = () => {
      el.play().catch(() => {
        const onUserAction = () => {
          el.play().catch(() => {});
          document.removeEventListener('click', onUserAction);
          document.removeEventListener('touchstart', onUserAction);
        };
        document.addEventListener('click', onUserAction, { once: true });
        document.addEventListener('touchstart', onUserAction, { once: true });
      });
    };
    tryPlay();
    el.addEventListener('pause', tryPlay);

    // 在视频接近结尾时淡出，循环开始时淡入，消除跳切感
    const FADE_DURATION = 1.5; // 秒
    let raf: number;

    const checkFade = () => {
      if (!el.duration || el.paused) {raf = requestAnimationFrame(checkFade); return; }
      const remaining = el.duration - el.currentTime;
      if (remaining <= FADE_DURATION) {
        // 接近结尾：淡出
        setOpacity(Math.max(0, remaining / FADE_DURATION));
      } else if (el.currentTime <= FADE_DURATION) {
        // 刚从头开始：淡入
        setOpacity(Math.min(1, el.currentTime / FADE_DURATION));
      } else {
        setOpacity(1);
      }
      raf = requestAnimationFrame(checkFade);
    };
    raf = requestAnimationFrame(checkFade);

    return () => {
      el.removeEventListener('pause', tryPlay);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="bg-video-wrap">
      <img src="/ocean-poster.jpg" className="bg-poster" alt="" />
      <video
        ref={videoRef}
        key="bg-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 2, background: 'transparent',
          opacity, transition: 'opacity 0.1s linear',
        }}
      >
        <source src="/ocean-1080p.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
