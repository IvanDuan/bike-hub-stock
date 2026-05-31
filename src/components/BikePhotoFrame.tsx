type BikePhotoFrameProps = {
  src?: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
};

export function BikePhotoFrame({
  src,
  alt,
  className = "aspect-[4/3] w-full",
  placeholderClassName = "text-2xl text-zinc-300",
}: BikePhotoFrameProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-contain" />
      ) : (
        <span className={placeholderClassName} aria-hidden>
          🚲
        </span>
      )}
    </div>
  );
}
