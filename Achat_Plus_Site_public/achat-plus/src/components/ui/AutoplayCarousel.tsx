import * as React from 'react';
import { Carousel, CarouselContent, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

type AutoplayCarouselProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  autoplay?: boolean;
  autoplayInterval?: number; // ms
  loop?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  arrowClassName?: string;
  align?: 'start' | 'center' | 'end';
  previousClassName?: string;
  nextClassName?: string;
};

export function AutoplayCarousel({
  children,
  className,
  contentClassName,
  autoplay = true,
  autoplayInterval = 3500,
  loop = true,
  showArrows = true,
  showDots = true,
  arrowClassName,
  align = 'start',
  previousClassName,
  nextClassName,
}: AutoplayCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Track total slides + current index (loop-safe using scrollSnapList length)
  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

  // Autoplay
  React.useEffect(() => {
    if (!autoplay || !api || paused) return;
    timerRef.current = setInterval(() => {
      api.scrollNext();
    }, autoplayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplay, api, paused, autoplayInterval]);

  const scrollTo = (index: number) => api?.scrollTo(index);

  return (
    <div
      className={cn('group/auto relative', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Carousel
        setApi={setApi}
        opts={{ align, loop }}
      >
        {showArrows && (
          <>
            <CarouselPrevious className={cn('top-1/2 -translate-y-1/2', previousClassName ?? '-left-3', arrowClassName)} />
            <CarouselNext className={cn('top-1/2 -translate-y-1/2', nextClassName ?? '-right-3', arrowClassName)} />
          </>
        )}
        <CarouselContent className={contentClassName}>{children}</CarouselContent>
      </Carousel>

      {showDots && count > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à la diapositive ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                'h-2 appearance-none rounded-full transition-all duration-300',
                i === current ? 'w-6 bg-primary' : 'w-2 bg-primary/25 hover:bg-primary/50',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}