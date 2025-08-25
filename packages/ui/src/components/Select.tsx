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
  id?: string;
  name: string;
  items: Array<{ name: string; value: string }>;
  placeholder: string;
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
  const selectRef = useRef<React.ElementRef<typeof SelectTrigger>>(null);
  const control = useControl({
    defaultValue,
    onFocus() {
      selectRef.current?.focus();
    },
  });

  return (
    <>
      <input name={name} ref={control.register} hidden />
      <ShadcnSelect
        value={control.value}
        onValueChange={(value) => control.change(value)}
        onOpenChange={(open) => {
          if (!open) {
            control.blur();
          }
        }}
      >
        <SelectTrigger {...props} ref={selectRef}>
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
