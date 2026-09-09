type ChoiceOption<T extends string | number> = {
  label: string;
  value: T;
};

type ChoiceGroupProps<T extends string | number> = {
  label: string;
  value: T;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
};

export function ChoiceGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset className="text-left">
      <legend className="mb-2 text-sm font-medium text-muted">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              className={`min-h-12 rounded-xl border px-4 text-sm font-semibold tracking-wide transition-colors ${
                selected
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-line bg-surface/80 text-muted hover:border-gold/40 hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
