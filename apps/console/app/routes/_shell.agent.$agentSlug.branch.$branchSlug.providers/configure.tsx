import { useEffect } from "react";
import { useFetcher } from "react-router";

import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint } from "@conform-to/zod/v4";

import { Button } from "@hebo/shared-ui/components/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@hebo/shared-ui/components/Dialog";
import { FormControl, FormField, FormLabel, FormMessage } from "@hebo/shared-ui/components/Form";
import { Input } from "@hebo/shared-ui/components/Input";

import { useFormErrorToast } from "~console/lib/errors";
import { ApiKeyProviderConfigSchema, BedrockProviderConfigSchema, VertexProviderConfigSchema } from "./schema";
import z from "zod";


function labelize(key: string) {
  return key.replace(/^\w/, c => c.toUpperCase()); 
}

export const ProviderConfigureSchema = z.discriminatedUnion("slug", [
  z.object({
    slug: z.literal("bedrock"),
    config: BedrockProviderConfigSchema,
  }),
  z.object({
    slug: z.literal("vertex"),
    config: VertexProviderConfigSchema,
  }),
  z.object({
    slug: z.literal("groq"),
    config: ApiKeyProviderConfigSchema,
  }),
]);

type ProviderConfigureFormValues = z.infer<typeof ProviderConfigureSchema>;

type ConfigureProviderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: { name: string; slug: string; };
};

export function ConfigureProviderDialog({open, onOpenChange, provider}: ConfigureProviderDialogProps) {
  const fetcher = useFetcher();

  const [form, fields] = useForm<ProviderConfigureFormValues>({
    id: provider?.slug,
    lastResult: fetcher.data?.submission,
    constraint: getZodConstraint(ProviderConfigureSchema),
    defaultValue: { 
        slug: provider?.slug,
    }
  });
  useFormErrorToast(form.allErrors);
  
  useEffect(() => {
    if (fetcher.state === "idle" && form.status === "success") {
      onOpenChange(false);
    }
  }, [fetcher.state, form.status]);

  const providerFields = Object.fromEntries(
    ProviderConfigureSchema.options.map((opt) => [
      (opt.shape.slug as z.ZodLiteral).value,
      Object.keys((opt.shape.config as z.ZodObject).shape),
    ])
  ) as Record<string, string[]>;
  const configFieldset = fields.config.getFieldset();
  const activeKeys = provider ? providerFields[provider.slug] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <fetcher.Form
          key={provider?.slug ?? "configure-provider"}
          method="post"
          {...getFormProps(form)}
          className="contents"
        >
          <DialogHeader>
            <DialogTitle>Configure {provider?.name} Credentials</DialogTitle>
          </DialogHeader>

          <FormField field={fields.slug}>
            <FormControl className="hidden">
              <input type="hidden" value={provider?.slug} />
            </FormControl>
          </FormField>

          {(activeKeys as (keyof typeof configFieldset)[]).map((key) => {
            const field = configFieldset[key];
            return (
              <FormField key={key} field={field}>
                <FormLabel>{labelize(key)}</FormLabel>
                <FormControl>
                  <Input placeholder={labelize(key)} autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormField>
            )
          })}
          
          <div className="text-sm">
            The configured provider will only handle requests after you enable it for a specific model. 
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  >
                  Cancel
              </Button>
            </DialogClose>
              <Button
                  type="submit"
                  name="intent"
                  value="configure"
                  isLoading={fetcher.state !== "idle"}
                  >
                  Set
              </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
