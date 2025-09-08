import { type FieldMetadata } from "@conform-to/react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { Label } from "../_shadcn/ui/label";
import { cn } from "../lib/utils";

const FieldCtx = React.createContext<FieldMetadata<string> | undefined>(
  undefined,
);
const useField = () => {
  const f = React.useContext(FieldCtx);
  if (!f)
    throw new Error(
      "Use <FormLabel/FormControl/FormDescription/FormMessage> inside <FormField>.",
    );
  return f;
};

function FormField({
  field,
  children,
  className,
}: {
  field: FieldMetadata<string>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <FieldCtx.Provider value={field}>
      <div className={cn(className)}>{children}</div>
    </FieldCtx.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { id, valid } = useField();

  return (
    <Label
      data-slot="form-label"
      data-error={!valid}
      className={cn("data-[error=true]:text-destructive py-1.5", className)}
      htmlFor={id}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { descriptionId } = useField();

  return (
    <p
      data-slot="form-description"
      id={descriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { errorId, errors } = useField();

  if (!errors?.length) return <></>;

  return (
    <p
      data-slot="form-message"
      id={errorId}
      role="alert"
      className={cn("text-destructive text-sm whitespace-pre-line", className)}
      {...props}
    >
      {errors.join("\n")}
    </p>
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { descriptionId, errorId, id, initialValue, name, valid } = useField();

  return (
    <Slot
      data-slot="form-control"
      id={id}
      {...({ name: name } as Record<string, unknown>)}
      defaultValue={initialValue}
      aria-describedby={valid ? `${descriptionId}` : `${errorId}`}
      aria-invalid={!valid}
      {...props}
    />
  );
}

export { FormControl, FormField, FormLabel, FormDescription, FormMessage };
