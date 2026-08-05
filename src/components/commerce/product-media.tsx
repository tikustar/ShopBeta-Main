import {
  Armchair,
  Camera,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Lightbulb,
  Monitor,
  Mouse,
  Plug,
  Printer,
  Router,
  Smartphone,
  Speaker,
  Tablet,
  Watch,
} from "lucide-react";
import type { IconKey } from "@/lib/data";
import { cn } from "@/lib/utils";

const map: Record<IconKey, React.ElementType> = {
  laptop: Laptop,
  monitor: Monitor,
  smartphone: Smartphone,
  tablet: Tablet,
  headphones: Headphones,
  speaker: Speaker,
  watch: Watch,
  gamepad: Gamepad2,
  keyboard: Keyboard,
  mouse: Mouse,
  camera: Camera,
  printer: Printer,
  router: Router,
  cpu: Cpu,
  harddrive: HardDrive,
  lightbulb: Lightbulb,
  chair: Armchair,
  plug: Plug,
};

export function ProductIcon({
  icon,
  className,
}: {
  icon: IconKey;
  className?: string;
}) {
  const Icon = map[icon] ?? Laptop;
  return <Icon className={className} aria-hidden />;
}

/**
 * Placeholder product imagery: a soft tinted surface with the device glyph.
 * Swap for real <Image /> sources when the catalogue is connected.
 */
export function ProductMedia({
  icon,
  tone,
  name,
  className,
  iconClassName,
  iconTone = "text-ink/75",
}: {
  icon: IconKey;
  tone: string;
  name: string;
  className?: string;
  iconClassName?: string;
  iconTone?: string;
}) {
  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-xl",
        tone,
        className,
      )}
    >
      <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/60 blur-2xl" aria-hidden />
      <ProductIcon
        icon={icon}
        className={cn(
          "relative h-1/2 w-1/2 transition-transform duration-500 ease-premium",
          iconTone,
          iconClassName,
        )}
      />
    </div>
  );
}

export function BrandMark({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid h-12 w-12 place-items-center rounded-xl bg-soft text-sm font-semibold tracking-tight text-ink",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
