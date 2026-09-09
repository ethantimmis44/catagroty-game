import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function TextArea({
  label,
  id,
  className = "",
  ...props
}: TextAreaProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="block text-left" htmlFor={fieldId}>
      <span className="mb-2 block text-sm font-medium text-muted">{label}</span>
      <textarea
        id={fieldId}
        className={`min-h-24 w-full resize-y rounded-xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-gold ${className}`}
        {...props}
      />
    </label>
  );
}
