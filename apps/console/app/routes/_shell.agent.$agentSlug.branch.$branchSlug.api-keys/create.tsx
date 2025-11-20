import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { z } from "zod";

import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint } from "@conform-to/zod/v4";

import { Button } from "@hebo/shared-ui/components/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@hebo/shared-ui/components/Dialog";
import { FormControl, FormField, FormLabel, FormMessage } from "@hebo/shared-ui/components/Form";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";

import { useActionDataErrorToast } from "~console/lib/errors";


const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const API_KEY_EXPIRATION_OPTIONS = [
  { label: "1 day", value: "1d", durationMs: 1 * DAY_IN_MS },
  { label: "7 days", value: "7d", durationMs: 7 * DAY_IN_MS },
  { label: "30 days", value: "30d", durationMs: 30 * DAY_IN_MS },
  { label: "90 days", value: "90d", durationMs: 90 * DAY_IN_MS },
  { label: "1 year", value: "365d", durationMs: 365 * DAY_IN_MS },
] as const;

export const ApiKeyCreateSchema = z.object({
  description: ((msg) => z.string(msg).trim().min(1, msg))("Please enter a description"),
  expiresIn: z.literal(
    API_KEY_EXPIRATION_OPTIONS.map((option) => option.value),
    "Select an expiration window",
  ),
});

type ApiKeyCreateFormValues = z.infer<typeof ApiKeyCreateSchema>;

export function CreateApiKeyDialog() {
  const lastResult = useActionData();
  const [open, setOpen] = useState(false);

  useActionDataErrorToast();

  const [form, fields] = useForm<ApiKeyCreateFormValues>({
    lastResult,
    constraint: getZodConstraint(ApiKeyCreateSchema),
    defaultValue: {
      expiresIn: "30d",
    },
  });

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "idle" && lastResult?.status === "success") {
      setOpen(false);
    }
  }, [navigation.state, lastResult?.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div>
        <DialogTrigger asChild>
          <Button type="button">+ Create API Key</Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <Form method="post" {...getFormProps(form)} className="contents">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Provide a brief description and expiration window for this key.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <FormField field={fields.description}>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="API key description" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormField>
            <FormField field={fields.expiresIn}>
              <FormLabel>Expires in</FormLabel>
              <FormControl>
                <Select
                  items={API_KEY_EXPIRATION_OPTIONS.map((option) => ({
                    value: option.value,
                    name: option.label,
                  }))}
                />
              </FormControl>
              <FormMessage />
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              name="intent"
              value="create"
              isLoading={navigation.state !== "idle"}
            >
              Create key
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
