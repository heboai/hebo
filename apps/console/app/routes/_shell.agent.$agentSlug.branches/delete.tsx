import { getFormProps, useForm } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@hebo/shared-ui/components/Dialog";
import { Alert, AlertTitle } from "@hebo/shared-ui/components/Alert";
import { Form, useActionData, useNavigation } from "react-router";
import { Button } from "@hebo/shared-ui/components/Button";
import { FormControl, FormField, FormLabel, FormMessage } from "@hebo/shared-ui/components/Form";
import { Input } from "@hebo/shared-ui/components/Input";
import { literal, object, type InferOutput } from "valibot";
import { useActionDataErrorToast } from "~console/lib/errors";


export function createBranchDeleteSchema(branchSlug: string) {
  return object({
    slugConfirm: literal(branchSlug, "You must type your EXACT branch slug"),
  });
}
export type AgentDeleteFormValues = InferOutput<ReturnType<typeof createBranchDeleteSchema>>;

type DeleteBranchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchSlug?: string;
};

export default function DeleteBranchDialog({ open, onOpenChange, branchSlug }: DeleteBranchDialogProps) {
  const lastResult = useActionData();

  useActionDataErrorToast();

  const [form, fields] = useForm<AgentDeleteFormValues>({
    lastResult,
    id: branchSlug ?? "none",
    constraint: getValibotConstraint(createBranchDeleteSchema(branchSlug ?? "")),
  });

  const navigation = useNavigation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-sidebar">
        <Form method="post" {...getFormProps(form)} className="contents">
          <DialogHeader>
            <DialogTitle>Delete branch</DialogTitle>
            <DialogDescription>
              This will delete your branch irreversibly.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTitle>
              <strong>Warning:</strong> This action is not reversible. Be certain.
            </AlertTitle>
          </Alert>

          <input type="hidden" name="branchSlug" value={branchSlug ?? ""} />

          <FormField field={fields.slugConfirm}>
            <FormLabel>
              <div>
                To confirm, type{" "}
                <strong>{branchSlug}</strong> in the box below:
              </div>
            </FormLabel>
            <FormControl>
              <Input autoComplete="off" />
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
              name="intent"
              value="delete"
              isLoading={navigation.state !== "idle"}
            >
              Delete
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
