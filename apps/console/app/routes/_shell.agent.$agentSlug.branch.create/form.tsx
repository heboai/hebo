import { Form, useActionData, useNavigation } from "react-router";
import { message, nonEmpty, object, string, pipe, trim, type InferOutput } from "valibot";
import { useForm, getFormProps } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";

import { Button } from "@hebo/shared-ui/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hebo/shared-ui/components/Card";
import {
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@hebo/shared-ui/components/Form";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";

import { useActionDataErrorToast } from "~console/lib/errors";

export const BranchCreateSchema = object({
  branchName: message(pipe(string(), trim(), nonEmpty()), "Please enter a branch name"),
  sourceBranch: string(),
});
export type BranchCreateFormValues = InferOutput<typeof BranchCreateSchema>;

export function BranchCreateForm({ 
  agentSlug, 
  branches 
}: { 
  agentSlug: string;
  branches: Array<{ name: string; slug: string }>;
}) {
  const lastResult = useActionData();
  
  useActionDataErrorToast();
  
  const [form, fields] = useForm<BranchCreateFormValues>({
    lastResult,
    constraint: getValibotConstraint(BranchCreateSchema),
    defaultValue: {
      sourceBranch: branches.find(b => b.slug === "main")?.slug || branches[0]?.slug || "",
    }
  });

  const navigation = useNavigation();

  return (
    <Form method="post" {...getFormProps(form)} className="contents">
      <Card className="sm:max-w-lg min-w-0 w-full border-none bg-transparent shadow-none">
        <CardHeader>
          <CardTitle><h1>Create a new branch</h1></CardTitle>
          <CardDescription>
            Branches allow you to experiment with different model configurations 
            for your agent without affecting the main branch.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="sm:grid sm:grid-cols-[auto_1fr] sm:gap-y-2">
            <FormField field={fields.branchName} className="contents">
              <FormLabel className="sm:w-32">Branch Name</FormLabel>
              <FormControl>
                <Input placeholder="Set a branch name" autoComplete="off" />
              </FormControl>
              <FormMessage className="sm:col-start-2" />
            </FormField>

            <FormField field={fields.sourceBranch} className="contents">
              <FormLabel className="sm:w-32">Source</FormLabel>
              <FormControl>
                <Select
                  items={branches.map((branch) => ({
                    value: branch.slug,
                    name: branch.name,
                  }))}
                />
              </FormControl>
              <FormMessage className="sm:col-start-2" />
            </FormField>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            isLoading={navigation.state !== "idle"}
          >
            Create Branch
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
