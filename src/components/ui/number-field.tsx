import { MinusIcon, PlusIcon } from "@heroicons/react/20/solid";
import {
  Button,
  NumberField as NumberFieldPrimitive,
} from "react-aria-components";
import { fieldStyles } from "./field";
import type { ButtonProps, NumberFieldProps } from "react-aria-components";
import { Input, InputGroup } from "@/components/ui/input";
import { cx } from "@/lib/primitive";

const NumberField = ({ className, ...props }: NumberFieldProps) => {
  return (
    <NumberFieldPrimitive
      {...props}
      data-slot="control"
      className={cx(fieldStyles(), className)}
    />
  );
};

function NumberInput(props: React.ComponentProps<typeof Input>) {
  return (
    <InputGroup className="[--input-gutter-end:--spacing(19)]">
      <Input className="tabular-nums" {...props} />
      <div data-slot="text" className="pointer-events-auto right-0 p-px">
        <div className="flex h-full items-center divide-x overflow-hidden rounded-r-[calc(var(--radius-lg)-1px)] border-l">
          <StepperButton slot="decrement" />
          <StepperButton slot="increment" />
        </div>
      </div>
    </InputGroup>
  );
}

interface StepperButtonProps extends ButtonProps {
  slot: "increment" | "decrement";
  emblemType?: "chevron" | "default";
  className?: string;
}

const StepperButton = ({
  slot,
  className,
  emblemType = "default",
  ...props
}: StepperButtonProps) => {
  return (
    <Button
      className={cx(
        "pressed:text-fg text-muted-fg hover:text-fg grid place-content-center disabled:opacity-50",
        "bg-input/20 pressed:bg-input/60 size-full min-w-11 grow sm:min-w-8.5",
        "*:data-[slot=stepper-icon]:size-5 sm:*:data-[slot=stepper-icon]:size-4",
        className,
      )}
      slot={slot}
      {...props}
    >
      {slot === "increment" ? (
        <PlusIcon data-slot="stepper-icon" />
      ) : (
        <MinusIcon data-slot="stepper-icon" />
      )}
    </Button>
  );
};

export type { NumberFieldProps };
export { NumberInput, NumberField };
