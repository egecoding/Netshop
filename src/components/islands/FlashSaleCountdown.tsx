import { useEffect, useState } from 'react';

// Counts down to the end of the current day (local time), then rolls over to the next day --
// there's no real "sale end" in this demo, so a rolling daily deadline keeps the urgency
// feeling live without a fake fixed date that would eventually just show "Sale Ended".
function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function formatParts(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0'));
}

export default function FlashSaleCountdown() {
  // Starts null so the server-rendered markup and React's first client render agree exactly
  // (both show the placeholder) -- computing msUntilMidnight() directly in useState would give
  // the server and client a different "now", which React flags as a hydration mismatch the
  // instant that second ticks over between SSR and hydration.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    setRemaining(msUntilMidnight());
    const id = setInterval(() => setRemaining(msUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const [hh, mm, ss] = remaining === null ? ['00', '00', '00'] : formatParts(remaining);

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-white">
      {[hh, mm, ss].map((part, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="rounded-md bg-black/25 px-2 py-1 tabular-nums">{part}</span>
          {i < 2 && <span className="text-white/70">:</span>}
        </span>
      ))}
    </div>
  );
}
