"use client";

export type FieldErrors = Partial<Record<string, string>>;

/** Labelled input with an inline error, shared by the checkout and consultation forms. */
export function TextField({
  name,
  label,
  errors,
  type = "text",
  autoComplete,
  inputMode,
  defaultValue,
  className = "",
}: {
  name: string;
  label: string;
  errors: FieldErrors;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
  defaultValue?: string;
  className?: string;
}) {
  const id = `field-${name}`;
  const error = errors[name];
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-forest-900">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1.5 h-12 w-full rounded-2xl bg-cream px-4 ring-1 ring-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-500 aria-invalid:ring-red-400"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Turns zod issues into { field: message }, using the last path segment as the field name. */
export function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = String(issue.path.at(-1) ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}
