interface BrandLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function BrandLogo({
  className,
  width = 130,
  height = 34,
}: BrandLogoProps) {
  return (
    <img
      src="/assets/logo.png"
      alt="Totem"
      width={width}
      height={height}
      className={className ?? 'h-auto w-auto max-h-9'}
    />
  );
}
