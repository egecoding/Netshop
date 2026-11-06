import { useEffect, useRef, useState } from 'react';

interface Slide {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  gradient: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'Flash Sale',
    title: 'Up to 50% off backhaul radios',
    subtitle: 'Gear up your towers before the deal ends tonight.',
    ctaLabel: 'Shop Flash Sale',
    ctaHref: '/products?sort=price-asc',
    gradient: 'from-orange-500 via-red-500 to-rose-600',
  },
  {
    eyebrow: 'New Arrivals',
    title: 'WiFi 6 CPE radios are in stock',
    subtitle: 'Higher throughput, better OFDMA scheduling, same rugged build.',
    ctaLabel: 'Shop CPE & PtMP Radios',
    ctaHref: '/categories/cpe-radios',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
  },
  {
    eyebrow: 'Installer Favorite',
    title: 'Managed PoE switches from KSh 5,000',
    subtitle: 'Power your whole cabinet without a second power supply.',
    ctaLabel: 'Shop PoE Switches',
    ctaHref: '/categories/poe-switches',
    gradient: 'from-rose-500 via-orange-500 to-amber-400',
  },
  {
    eyebrow: 'Bulk & Net-30',
    title: 'Buying for multiple towers?',
    subtitle: 'Get volume pricing and installer invoice terms.',
    ctaLabel: 'Request a Bulk Quote',
    ctaHref: '/bulk-quote',
    gradient: 'from-red-600 via-rose-500 to-orange-500',
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    stop();
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4500);
  }
  function stop() {
    if (timer.current) clearInterval(timer.current);
  }

  useEffect(() => {
    start();
    return stop;
  }, []);

  function goTo(i: number) {
    setIndex(i);
    start();
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={stop}
      onMouseLeave={start}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          className={`bg-gradient-to-br ${slide.gradient} ${
            i === index ? 'relative opacity-100' : 'absolute inset-0 opacity-0'
          } flex min-h-[260px] items-center transition-opacity duration-700 sm:min-h-[320px]`}
          aria-hidden={i !== index}
        >
          <div
            className="absolute -top-10 -right-10 h-56 w-56 animate-float rounded-full bg-white/15 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-xl"
            aria-hidden="true"
          />
          <div className="relative z-10 px-6 py-10 sm:px-12">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide text-white uppercase backdrop-blur">
              {slide.eyebrow}
            </span>
            <h2 className="mt-3 max-w-md text-3xl font-extrabold text-white sm:text-4xl">{slide.title}</h2>
            <p className="mt-2 max-w-sm text-white/90">{slide.subtitle}</p>
            <a
              href={slide.ctaHref}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg transition hover:scale-105"
            >
              {slide.ctaLabel}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
