import { Moon, Sun, Sunrise } from "lucide-react";

export type Routine = {
  title: string;
  dosha: "vata" | "pitta" | "kapha";
  morning: string[];
  daytime: string[];
  evening: string[];
  favour: string[];
  reduce: string[];
};

const SECTIONS = [
  { key: "morning", label: "Morning", Icon: Sunrise },
  { key: "daytime", label: "Daytime", Icon: Sun },
  { key: "evening", label: "Evening", Icon: Moon },
] as const;

export function RoutineCard({ routine }: { routine: Routine }) {
  return (
    <section aria-label={routine.title} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-forest-900/5">
      <header className="bg-forest-800 px-4 py-3 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-leaf-300">Your dinacharya · {routine.dosha}</p>
        <h4 className="font-display text-xl">{routine.title}</h4>
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-3">
        {SECTIONS.map(({ key, label, Icon }) => (
          <div key={key}>
            <h5 className="flex items-center gap-1.5 text-sm font-bold text-forest-800">
              <Icon className="h-4 w-4 text-turmeric" aria-hidden />
              {label}
            </h5>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
              {routine[key].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {(routine.favour.length > 0 || routine.reduce.length > 0) && (
        <div className="grid gap-3 border-t border-forest-900/5 bg-cream p-4 text-sm sm:grid-cols-2">
          <TagList label="Favour" items={routine.favour} className="bg-leaf-100 text-forest-800" />
          <TagList label="Reduce" items={routine.reduce} className="bg-sand text-earth" />
        </div>
      )}
    </section>
  );
}

function TagList({ label, items, className }: { label: string; items: string[]; className: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="font-bold text-forest-900">{label}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li key={i} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
