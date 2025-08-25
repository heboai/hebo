import { type FieldMetadata } from "@conform-to/react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { Label } from "../_shadcn/ui/label";
import { cn } from "../lib/utils";

// TODO: does this actually work
const FieldCtx = React.createContext<FieldMetadata<any> | undefined>(undefined);
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
}: {
  field: FieldMetadata<any>;
  children: React.ReactNode;
}) {
  return <FieldCtx.Provider value={field}>{children}</FieldCtx.Provider>;
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
      className={cn("data-[error=true]:text-destructive", className)}
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

  return (
    <p
      data-slot="form-message"
      id={errorId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {errors}
    </p>
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { id, defaultValue, valid, descriptionId, errorId } = useField();

  return (
    <Slot
      data-slot="form-control"
      id={id}
      // TODO: does the defaultValue work?
      // TODO: what about name?
      defaultValue={defaultValue}
      aria-describedby={valid ? `${descriptionId}` : `${errorId}`}
      aria-invalid={!valid}
      {...props}
    />
  );
}

export { FormControl, FormField, FormLabel, FormDescription, FormMessage };
