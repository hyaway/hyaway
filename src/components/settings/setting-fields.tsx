import { useState } from "react";
import { Label } from "@/components/ui-primitives/label";
import { Slider } from "@/components/ui-primitives/slider";
import { Switch } from "@/components/ui-primitives/switch";

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  max: number;
  min: number;
  step: number;
  onValueChange?: (value: number) => void;
  /** If true, only calls onValueChange when the slider is released */
  commitOnRelease?: boolean;
  /** Custom formatter for the displayed value */
  formatValue?: (value: number) => string;
}

export function SliderField({
  id,
  label,
  value,
  max,
  min,
  step,
  onValueChange,
  commitOnRelease = false,
  formatValue,
}: SliderFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const displayValue = commitOnRelease ? localValue : value;

  // Sync local value when external value changes
  if (!commitOnRelease && localValue !== value) {
    setLocalValue(value);
  }

  const formattedValue = formatValue
    ? formatValue(displayValue)
    : String(displayValue);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-muted-foreground text-base tabular-nums">
          {formattedValue}
        </span>
      </div>
      <Slider
        id={id}
        value={[Math.min(displayValue, max)]}
        onValueChange={(v) => {
          const newValue = Array.isArray(v) ? v[0] : v;
          if (commitOnRelease) {
            setLocalValue(newValue);
          } else {
            onValueChange?.(newValue);
          }
        }}
        onValueCommitted={(v) => {
          if (commitOnRelease) {
            const newValue = Array.isArray(v) ? v[0] : v;
            onValueChange?.(newValue);
          }
        }}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

interface RangeSliderFieldProps {
  id: string;
  label: string;
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
  step: number;
  onValueChange?: (minValue: number, maxValue: number) => void;
  /** Custom formatter for the displayed values */
  formatValue?: (minValue: number, maxValue: number) => string;
}

export function RangeSliderField({
  id,
  label,
  minValue,
  maxValue,
  min,
  max,
  step,
  onValueChange,
  formatValue,
}: RangeSliderFieldProps) {
  const formattedValue = formatValue
    ? formatValue(minValue, maxValue)
    : `${minValue} - ${maxValue}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-muted-foreground text-base tabular-nums">
          {formattedValue}
        </span>
      </div>
      <Slider
        id={id}
        value={[minValue, maxValue]}
        onValueChange={(v) => {
          if (Array.isArray(v) && v.length === 2) {
            onValueChange?.(v[0], v[1]);
          }
        }}
        min={min}
        max={max}
        step={step}
        minStepsBetweenValues={1}
      />
    </div>
  );
}

interface SwitchFieldProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        {description && (
          <span className="text-muted-foreground text-xs">{description}</span>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

interface SettingsGroupProps {
  children: React.ReactNode;
}

export function SettingsGroup({ children }: SettingsGroupProps) {
  return <div className="flex flex-col gap-6">{children}</div>;
}
