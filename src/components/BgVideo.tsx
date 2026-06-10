import { useEffect, useState } from 'react';

const VIDEO_SRC = '/ocean-mediterranean.mp4';
const POSTER_SRC = '/ocean-poster.jpg';
const POSTER_MOBILE = '/ocean-poster-mobile.jpg';

function detectEnv() {
  if (typeof navigator === 'undefined') return { isMobile: false, isWechat: false };
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|MicroMessenger/i.test(ua);
  const isWechat = /MicroMessenger/i.test(ua);
  return { isMobile, isWechat };
}

export default function BgVideo() {
  const [env] = useState(detectEnv);
  // 移动端 / 微信：完全不渲染 video 元素，只用静态图。
  // 桌面端：用 video，并以 poster 兜底。
  const useStatic = env.isMobile;

  useEffect(() => {
    if (useStatic) return;
    const v = document.querySelector<HTMLVideoElement>('#bg-video');
    if (v) v.play().catch(() => {});
  }, [useStatic]);

  if (useStatic) {
    return (
      <div
        className="bg-video-wrap"
        style={{
          backgroundImage: `image-set(url(${POSTER_SRC}) 2x, url(${POSTER_MOBILE}) 1x), url(${POSTER_MOBILE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  }

  return (
    <div
      className="bg-video-wrap"
      style={{
        backgroundImage: `url(${POSTER_SRC})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <video
        id="bg-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={POSTER_SRC}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
    </div>
  );
}
