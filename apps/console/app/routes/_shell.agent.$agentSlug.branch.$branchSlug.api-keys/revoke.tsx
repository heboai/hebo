import { useEffect } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { z } from "zod";

import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint } from "@conform-to/zod/v4";

import { Alert, AlertDescription } from "@hebo/shared-ui/components/Alert";
import { Button } from "@hebo/shared-ui/components/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@hebo/shared-ui/components/Dialog";
import { FormControl, FormField, FormMessage } from "@hebo/shared-ui/components/Form";

import { useActionDataErrorToast } from "~console/lib/errors";


export const ApiKeyRevokeSchema = z.object({
  apiKeyId: ((msg) => z.string(msg).trim().min(1, msg))("Select an API key to revoke"),
});

type ApiKeyRevokeFormValues = z.infer<typeof ApiKeyRevokeSchema>;

type RevokeApiKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey?: { id: string; description: string; key: string };
};

export function RevokeApiKeyDialog({open, onOpenChange, apiKey}: RevokeApiKeyDialogProps) {

  const lastResult = useActionData();

  useActionDataErrorToast();

  const [form, fields] = useForm<ApiKeyRevokeFormValues>({
    lastResult,
    id: apiKey?.id || "",
    constraint: getZodConstraint(ApiKeyRevokeSchema),
    defaultValue: {
      apiKeyId: apiKey?.id || "",
    },
  });

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "idle" && lastResult?.status === "success") {
      onOpenChange(false);
    }
  }, [navigation.state, lastResult?.status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-sidebar">
        <Form method="post" {...getFormProps(form)} className="contents">
          <DialogHeader>
            <DialogTitle>Revoke API key</DialogTitle>
            <DialogDescription>
              Revoking immediately blocks the key from future use.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              Key ({apiKey?.key ?? ""}) will stop working immediately.
            </AlertDescription>
          </Alert>

          <input type="hidden" name="intent" value="revoke" />

          <FormField field={fields.apiKeyId}>
            <FormControl className="hidden">
              <input type="hidden" />
            </FormControl>
            <FormMessage />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={navigation.state !== "idle"}
            >
              Revoke
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
