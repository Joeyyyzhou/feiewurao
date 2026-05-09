import { useEffect } from 'react';

interface Props {
  src?: string;
  videoId?: string;
}

const VIDEO_BY_HOUR = (h: number): string => {
  // 4 个时段同 src（待 video skill 生原创后替换）
  return '/ocean-mediterranean.mp4';
};

export default function BgVideo() {
  useEffect(() => {
    // 每分钟检查时段并切视频
    const v = document.querySelector<HTMLVideoElement>('#bg-video');
    if (!v) return;
    function tick() {
      const h = new Date().getHours();
      const next = VIDEO_BY_HOUR(h);
      const cur = v?.querySelector('source')?.getAttribute('src');
      if (cur !== next && v) {
        v.querySelector('source')?.setAttribute('src', next);
        v.load();
      }
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="bg-video-wrap">
      <video id="bg-video" autoPlay muted loop playsInline>
        <source src="/ocean-mediterranean.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
