import { useControl } from "@conform-to/react/future";
import { useRef } from "react";

import {
  SelectTrigger,
  Select as ShadcnSelect,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../_shadcn/ui/select";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  items: Array<{ name: React.ReactNode; value: string }>;
  placeholder?: string;
  defaultValue: string;
}

function Select({
  name,
  disabled,
  items,
  placeholder,
  defaultValue,
}: SelectProps) {
  const selectRef = useRef<React.ComponentRef<typeof SelectTrigger>>(null);
  const control = useControl({
    defaultValue,
    onFocus() {
      selectRef.current?.focus();
    },
  });

  return (
    <>
      <input name={name} ref={control.register} type="hidden" />
      <ShadcnSelect
        // Conform's docs show using control.value directly; this is safe.
        // eslint-disable-next-line react-hooks/refs
        value={control.value}
        onValueChange={(value) => {
          control.change(value);
        }}
        onOpenChange={(open) => {
          if (!open) {
            control.blur();
          }
        }}
      >
        <SelectTrigger
          className="bg-background w-full min-w-0 truncate"
          ref={selectRef}
          disabled={disabled}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => {
            return (
              <SelectItem key={item.value} value={item.value}>
                {item.name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </ShadcnSelect>
    </>
  );
}

export { Select };
