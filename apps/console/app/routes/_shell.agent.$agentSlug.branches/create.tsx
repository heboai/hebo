import { GitBranch } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { message, nonEmpty, object, pipe, string, trim, type InferOutput } from "valibot";

import { getFormProps, useForm } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";

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


export const BranchCreateSchema = object({
  branchName: message(pipe(string(), trim(), nonEmpty()), "Please enter a branch name"),
  sourceBranchSlug: string(),
});
export type BranchCreateFormValues = InferOutput<typeof BranchCreateSchema>;


type CreateBranchProps = {
    branches?: 
    {
        slug: string,
        name: string,
    }[]
};

export default function CreateBranch({ branches }: CreateBranchProps) {

  const lastResult = useActionData();
  const [open, setOpen] = useState(false);

  useActionDataErrorToast();

  const [form, fields] = useForm<BranchCreateFormValues>({
    lastResult,
    constraint: getValibotConstraint(BranchCreateSchema),
    defaultValue: {
      sourceBranchSlug: branches?.[0]?.slug,
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
          <Button
            type="button"
            variant="outline"
          >
            + Create Branch
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <Form method="post" {...getFormProps(form)} className="contents">
          <DialogHeader>
            <DialogTitle>Create branch</DialogTitle>
            <DialogDescription>
              Set a name and choose a source from which to branch out.
            </DialogDescription>
          </DialogHeader>
          <div>
            <FormField field={fields.branchName}>
              <FormLabel>Branch name</FormLabel>
              <FormControl>
                <Input autoComplete="off" placeholder="Set a branch name" />
              </FormControl>
              <FormMessage />
            </FormField>
          </div>
          <div>
            <FormField field={fields.sourceBranchSlug}>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <Select
                  items={
                    (branches ?? []).map(branch => ({
                      value: branch.slug,
                      name: (
                        <>
                          <GitBranch aria-hidden="true" />
                          {branch.name}
                        </>
                      ),
                    }))
                  }
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
              Create
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
