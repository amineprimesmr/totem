interface BrandLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function BrandLogo({
  className,
  width = 160,
  height = 44,
}: BrandLogoProps) {
  return (
    <img
      src="/assets/logo.png?v=20260311-1"
      alt="Totem"
      width={width}
      height={height}
      className={className ?? 'h-auto w-auto max-h-12'}
    />
  );
}
