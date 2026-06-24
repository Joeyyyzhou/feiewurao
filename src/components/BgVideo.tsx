import { useState, useEffect } from 'react';

const VID_SRC = '/ocean.mp4';
const VID_MOBILE = '/ocean-mobile.mp4';
const POSTER_SRC = '/ocean-poster.jpg';
const POSTER_MOBILE = '/ocean-poster-mobile.jpg';

export default function BgVideo() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const videoSrc = isMobile ? VID_MOBILE : VID_SRC;
  const posterSrc = isMobile ? POSTER_MOBILE : POSTER_SRC;

  return (
    <div className="bg-video-wrap">
      <img className="bg-poster" src={posterSrc} alt="" aria-hidden="true" />
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={posterSrc}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  );
}
