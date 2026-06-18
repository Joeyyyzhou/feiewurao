import { useEffect, useRef, useState } from 'react';

const VIDEO_1080P = '/ocean-1080p.mp4';
const VIDEO_720P = '/ocean-720p.mp4';
const POSTER_SRC = '/ocean-poster.jpg';
const POSTER_MOBILE = '/ocean-poster-mobile.jpg';

function detectEnv() {
  if (typeof navigator === 'undefined') return { isMobile: false, isWechat: false, isSmall: false };
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|MicroMessenger/i.test(ua);
  const isWechat = /MicroMessenger/i.test(ua);
  const isSmall = (typeof window !== 'undefined') && window.innerWidth < 1440;
  return { isMobile, isWechat, isSmall };
}

/**
 * 全屏背景：用 <img> 而非 background-image 作为 poster 层，确保浏览器把它视为高优先级资源
 * 立即解码和绘制。video 在背后异步加载，canplay 时再 fade-in 覆盖 poster。
 *
 * 上次出过黑屏：video 元素即使 opacity:0 也会在 paint 阶段产生黑底，盖住 background-image。
 * 修法：
 *   1. 用 <img> 作为 poster（z-index 1），video 放在 z-index 2，opacity 0→1 切换
 *   2. img 加 fetchpriority="high"
 *   3. video 加 onError 兜底：失败也让 poster 永远兜着，不会黑屏
 *   4. 4 秒 watchdog：万一 canplay 一直不触发，强制 fade-in（视频画面糊一帧远比黑屏好）
 */
export default function BgVideo() {
  const [env] = useState(detectEnv);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const useStatic = env.isMobile;
  const videoSrc = env.isSmall ? VIDEO_720P : VIDEO_1080P;

  useEffect(() => {
    if (useStatic) return;
    const v = videoRef.current;
    if (!v) return;

    const onCanPlay = () => setVideoReady(true);
    v.addEventListener('canplay', onCanPlay, { once: true });

    const kick = () => v.play().catch(() => {});
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(kick, { timeout: 800 });
    } else {
      setTimeout(kick, 100);
    }

    // Watchdog：4 秒内若 canplay 还没触发，强制让 video 显示（避免某些浏览器/弱网下永久 opacity 0）
    const watchdog = setTimeout(() => setVideoReady(true), 4000);

    return () => {
      v.removeEventListener('canplay', onCanPlay);
      clearTimeout(watchdog);
    };
  }, [useStatic]);

  // 移动端只渲染 poster（用 img 元素，更稳）
  if (useStatic) {
    return (
      <div className="bg-video-wrap">
        <img
          src={POSTER_MOBILE}
          srcSet={`${POSTER_MOBILE} 1x, ${POSTER_SRC} 2x`}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="bg-poster"
        />
      </div>
    );
  }

  return (
    <div className="bg-video-wrap">
      {/* poster：必定瞬间绘制，永远兜底 */}
      <img
        src={POSTER_SRC}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="bg-poster"
      />
      {/* video：异步加载，canplay 后 fade-in 覆盖 poster */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={POSTER_SRC}
        onError={() => {/* 视频失败时不显示，poster 永远在底下 */}}
        style={{
          opacity: videoReady ? 1 : 0,
          transition: 'opacity 0.6s ease',
          willChange: 'opacity',
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  );
}
