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
import { GitBranch } from "lucide-react";
import { Form, useActionData, useNavigation } from "react-router";
import { message, nonEmpty, object, pipe, string, trim, type InferOutput } from "valibot";
import { useActionDataErrorToast } from "~console/lib/errors";


export const BranchCreateSchema = object({
  branchName: message(pipe(string(), trim(), nonEmpty()), "Please enter a branch name"),
  sourceBranch: string(),
});
export type BranchCreateFormValues = InferOutput<typeof BranchCreateSchema>;


type CreateBranchProps = {
    branches?: 
    {
        slug: string,
        name?: string,
    }[]
};

export default function CreateBranch({ branches }: CreateBranchProps) {

  const lastResult = useActionData();

  useActionDataErrorToast();

  const [form, fields] = useForm<BranchCreateFormValues>({
    lastResult,
    constraint: getValibotConstraint(BranchCreateSchema),defaultValue: {
      sourceBranch: branches?.[0].slug || "empty",
    }
  });

  const navigation = useNavigation();

  return (
    <Dialog>
        <DialogTrigger asChild>
        <div>
            <Button
            type="button"
            variant="outline"
            >
            + Create Branch
            </Button>
        </div>
        </DialogTrigger>
        <DialogContent>
            <Form method="post" {...getFormProps(form)} className="contents">
                <DialogHeader>
                    <DialogTitle>Create branch</DialogTitle>
                    <DialogDescription>Set a name and choose a source from which to branch out.</DialogDescription>
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
                    <FormField field={fields.sourceBranch}>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                            <Select
                                items={[
                                    { value: "empty", name: <>(Empty Branch)</> },
                                    ...(branches?.map(branch => ({
                                        value: branch.slug,
                                        name: (
                                            <>
                                                <GitBranch />
                                                {branch.name}
                                            </>
                                        ),
                                        })) ?? []),
                                    ]}/>
                        </FormControl>
                        <FormMessage />
                    </FormField>
                </div>
                <DialogFooter>
                    <DialogClose>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        isLoading={navigation.state !== "idle"}
                        >
                        Create
                    </Button>
                </DialogFooter>
            </Form>
        </DialogContent>
    </Dialog>
  )
}
