import { useEffect, useRef, useState } from 'react';

// 6:00–18:00 白天，18:00–6:00 夜晚
function isDaytime(d: Date) {
  const h = d.getHours();
  return h >= 6 && h < 18;
}

export default function BgVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [day, setDay] = useState<boolean>(() => isDaytime(new Date()));

  // 每分钟检查一次，跨越 6:00 / 18:00 分界时自动切换
  useEffect(() => {
    const id = window.setInterval(() => {
      setDay((prev) => {
        const now = isDaytime(new Date());
        return now === prev ? prev : now;
      });
    }, 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  // 自动播放兜底（被浏览器拦截时，首次交互后重播）
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
    return () => { el.removeEventListener('pause', tryPlay); };
  }, [day]);

  const videoSrc = day ? '/ocean-day.mp4' : '/ocean-night.mp4';
  const poster = day ? '/ocean-day-poster.jpg' : '/ocean-night-poster.jpg';

  return (
    <div className="bg-video-wrap">
      <img src={poster} className="bg-poster" alt="" />
      <video
        ref={videoRef}
        key={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={poster}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, background: 'transparent' }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  );
}
