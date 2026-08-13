import { useEffect, useRef } from 'react';

export default function BgVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = 0.82;
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
    return () => { el.removeEventListener('pause', tryPlay); };
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
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, background: 'transparent' }}
      >
        <source src="/ocean-1080p.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
