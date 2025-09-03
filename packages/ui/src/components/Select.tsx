import { useControl } from "@conform-to/react/future";
import { useRef } from "react";

import {
  SelectTrigger,
  Select as ShadcnSelect,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../_shadcn/ui/select";

type SelectProps = {
  name?: string;
  items: Array<{ name: React.ReactNode; value: string }>;
  placeholder?: string;
  defaultValue?: string;
  ["aria-describedby"]?: string;
};

function Select({
  name,
  items,
  placeholder,
  defaultValue,
  ...props
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
          {...props}
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
