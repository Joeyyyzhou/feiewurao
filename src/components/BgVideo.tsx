export default function BgVideo() {
  return (
    <div className="bg-video-wrap">
      <img src="/ocean-poster.jpg" className="bg-poster" alt="" />
      <video key="bg-video" autoPlay loop muted playsInline preload="auto">
        <source src="/ocean-1080p.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
