import { useState, useEffect } from 'react';

const POSTER_SRC = '/ocean-poster.jpg';
const POSTER_MOBILE = '/ocean-poster-mobile.jpg';

/**
 * 全屏背景：CSS 动画驱静态海报，替代视频。
 *  - GPU 加速、60fps、无循环卡顿
 *  - 动画：极慢缩放 + 微平移（Ken Burns），30s 一周期，无缝循环
 *  - 省流量、省电、移动端更稳
 */
export default function BgVideo() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const posterSrc = isMobile ? POSTER_MOBILE : POSTER_SRC;

  return (
    <div className="bg-video-wrap">
      <div
        className="bg-animated"
        style={{ backgroundImage: `url(${posterSrc})` }}
      />
    </div>
  );
}
