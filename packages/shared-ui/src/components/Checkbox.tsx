import { useControl } from "@conform-to/react/future";
import { useRef } from "react";

import { Checkbox as ShadCNCheckbox } from "../_shadcn/ui/checkbox";

export type CheckboxProps = {
  id?: string;
  name: string;
  value?: string;
  defaultChecked?: boolean;
  ["aria-describedby"]?: string;
};

export function Checkbox({
  name,
  value,
  defaultChecked,
  ...props
}: CheckboxProps) {
  const checkboxRef = useRef<React.ElementRef<typeof ShadCNCheckbox>>(null);
  const control = useControl({
    defaultChecked,
    value,
    onFocus() {
      checkboxRef.current?.focus();
    },
  });

  return (
    <>
      <input type="checkbox" ref={control.register} name={name} hidden />
      <ShadCNCheckbox
        {...props}
        ref={checkboxRef}
        checked={control.checked}
        onCheckedChange={(checked) => control.change(checked)}
        onBlur={() => control.blur()}
        className="focus:ring-2 focus:ring-stone-950 focus:ring-offset-2"
      />
    </>
  );
}
