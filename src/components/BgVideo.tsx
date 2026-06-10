import { useEffect, useRef, useState } from 'react';

const VIDEO_SRC = '/ocean-mediterranean.mp4';
const POSTER_SRC = '/ocean-poster.jpg';

export default function BgVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    // 尝试播放，被浏览器拒绝时 fallback 到 poster
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.then === 'function') {
        p.catch(() => {
          // 微信/iOS 拒绝 autoplay，等首次触摸再播
          setCanPlay(false);
          const resume = () => {
            v.play().then(() => setCanPlay(true)).catch(() => {});
            window.removeEventListener('touchstart', resume);
            window.removeEventListener('click', resume);
          };
          window.addEventListener('touchstart', resume, { once: true });
          window.addEventListener('click', resume, { once: true });
        });
      }
    };

    tryPlay();
  }, []);

  return (
    <div
      className="bg-video-wrap"
      style={{
        // 兜底背景图：即使 video 标签被微信屏蔽 / 视频还没加载好，
        // 海面图先撑住，绝不会出现死黑
        backgroundImage: `url(${POSTER_SRC})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <video
        ref={ref}
        id="bg-video"
        autoPlay
        muted
        loop
        playsInline
        // @ts-ignore - 微信内核专属属性
        webkit-playsinline="true"
        // @ts-ignore - 微信/QQ 浏览器：不要接管全屏播放
        x5-video-player-type="h5-page"
        // @ts-ignore
        x5-video-player-fullscreen="false"
        // @ts-ignore
        x5-playsinline="true"
        poster={POSTER_SRC}
        preload="auto"
        style={{ opacity: canPlay ? 1 : 0, transition: 'opacity .6s ease' }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
    </div>
  );
}
