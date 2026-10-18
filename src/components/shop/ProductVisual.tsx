import { Droplet, FlaskConical, Leaf, Sparkles } from "lucide-react";
import type { Category } from "@/lib/catalog";

// Illustrated stand-in until real product photography is added to the catalogue.
const STYLES: Record<Category, { bg: string; Icon: typeof Leaf }> = {
  "ayurvedic-medicine": { bg: "from-forest-700 to-forest-900", Icon: FlaskConical },
  skincare: { bg: "from-turmeric to-earth", Icon: Sparkles },
  haircare: { bg: "from-forest-600 to-earth", Icon: Droplet },
  supplements: { bg: "from-leaf-500 to-forest-700", Icon: Leaf },
};

export function ProductVisual({ category, name, size = "md" }: { category: Category; name: string; size?: "sm" | "md" | "lg" }) {
  const { bg, Icon } = STYLES[category];
  const box = size === "lg" ? "aspect-square rounded-3xl" : size === "sm" ? "aspect-[4/3] rounded-xl" : "aspect-[4/3] rounded-2xl";
  const icon = size === "lg" ? "h-24 w-24" : size === "sm" ? "h-8 w-8" : "h-12 w-12";
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-gradient-to-br ${bg} ${box}`} role="img" aria-label={name}>
      <div className="absolute inset-0 opacity-30 leaf-pattern" aria-hidden />
      <Icon className={`${icon} text-white/90`} strokeWidth={1.25} aria-hidden />
    </div>
  );
}
