import { useState, useEffect, useRef } from 'react';

const VID_SRC = '/ocean.mp4';
const VID_MOBILE = '/ocean-mobile.mp4';
const POSTER_SRC = '/ocean-poster.jpg';
const POSTER_MOBILE = '/ocean-poster-mobile.jpg';

/**
 * 全屏海面视频背景。
 * 修复：用 timeupdate 在视频结束前 0.2s 无缝跳回开头，
 * 避免 loop 属性导致的硬解码卡顿。
 */
export default function BgVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 无缝循环：结束前 0.2s 跳回开头，避免硬解码卡顿
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onTimeUpdate = () => {
      if (vid.duration && vid.currentTime > vid.duration - 0.2) {
        vid.currentTime = 0;
      }
    };
    vid.addEventListener('timeupdate', onTimeUpdate);
    return () => vid.removeEventListener('timeupdate', onTimeUpdate);
  }, []);

  const videoSrc = isMobile ? VID_MOBILE : VID_SRC;
  const posterSrc = isMobile ? POSTER_MOBILE : POSTER_SRC;

  return (
    <div className="bg-video-wrap">
      <img className="bg-poster" src={posterSrc} alt="" aria-hidden="true" />
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={posterSrc}
        src={videoSrc}
      />
    </div>
  );
}
