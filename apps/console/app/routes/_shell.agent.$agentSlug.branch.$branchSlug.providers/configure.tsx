import { useEffect } from "react";
import { useFetcher } from "react-router";
import { z } from "zod";

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


export const ProviderConfigureSchema = z.object({
  slug: z.string(),
  config: ((msg) => z.string(msg).trim().min(1, msg))("Please provide valid credentials"),
});

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <fetcher.Form method="post" {...getFormProps(form)} className="contents">
                <DialogHeader>
                    <DialogTitle>Configure {provider?.name} Credentials</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <FormField field={fields.slug}>
                        <FormControl className="hidden">
                            <input type="hidden" />
                        </FormControl>
                    </FormField>

                    <FormField field={fields.config}>
                        <FormLabel>Credentials</FormLabel>
                        <FormControl>
                            <Input placeholder="Credentials" autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                    </FormField>
                    
                    <div className="text-sm">
                        The configured provider will only handle requests after you enable it for a specific model. 
                    </div>
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
