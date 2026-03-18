/**
 * SoundCloud Logo Component (Bars + Text)
 * Matches the reference UI provided.
 */

const SoundCloudLogo = ({ className = "", showText = true }) => {
  const bars = [8, 12, 16, 20, 24, 20, 16];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-end gap-[2px]">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-[3px] rounded-sm bg-foreground"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight text-foreground uppercase">
          SoundCloud
        </span>
      )}
    </div>
  );
};

export default SoundCloudLogo;
