import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({
  label,
  id,
  className = "",
  ...props
}: TextFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="block text-left" htmlFor={fieldId}>
      <span className="mb-2 block text-sm font-medium text-muted">{label}</span>
      <input
        id={fieldId}
        className={`min-h-12 w-full rounded-xl border border-line bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-gold ${className}`}
        {...props}
      />
    </label>
  );
}
