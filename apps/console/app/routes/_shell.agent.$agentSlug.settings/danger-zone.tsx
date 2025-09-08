import { Form, useActionData, useNavigation } from "react-router";
import { object, string, literal, type InferOutput } from "valibot";
import { useForm, getFormProps } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";

import { Alert, AlertTitle } from "@hebo/ui/components/Alert";
import { Button } from "@hebo/ui/components/Button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hebo/ui/components/Card";
import {
  Dialog,
  DialogFooter,
  DialogClose,
  DialogDescription,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@hebo/ui/components/Dialog";
import {
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@hebo/ui/components/Form";
import { Input } from "@hebo/ui/components/Input";
import { useActionDataErrorToast } from "~console/lib/errors";


export function createAgentDeleteSchema(agentSlug: string) {
  return object({
    slugConfirm: literal(agentSlug, "You must type your EXACT agent slug"),
    slugValidate: string(),
  });
}
export type AgentDeleteFormValues = InferOutput<ReturnType<typeof createAgentDeleteSchema>>;

export function DangerSettings({ agent }: { agent: { slug: string }}) {

  const lastResult = useActionData();

  useActionDataErrorToast();

  const [form, fields] = useForm<AgentDeleteFormValues>({
    lastResult,
    constraint: getValibotConstraint(createAgentDeleteSchema(agent.slug)),
    defaultValue: {
      slugValidate: agent.slug,
    },
  });

  const navigation = useNavigation();

  return (
    <div className="flex flex-col gap-2">
      <h2>Danger Zone</h2>

      <Card className="border-destructive border-dashed">
        <CardHeader>
          <CardTitle>Delete this agent</CardTitle>
          <CardDescription>
            Once you delete an agent, there is no going back. Be certain.
          </CardDescription>
          <CardAction className="self-center">

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Agent</Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md bg-sidebar">
                <Form method="post" {...getFormProps(form)} className="contents">
                  <DialogHeader>
                    <DialogTitle>Delete Agent</DialogTitle>
                    <DialogDescription>
                      This will delete your agent irreversibly.
                    </DialogDescription>
                  </DialogHeader>
                  <Alert variant="destructive">
                    <AlertTitle>
                      <strong>Warning:</strong> This action is not reversible.
                      Be certain.
                    </AlertTitle>
                  </Alert>

                  <FormField field={fields.slugConfirm}>
                    <FormLabel>
                      To confirm, type{" "}
                      <strong>{agent.slug}</strong> in
                      the box below:
                    </FormLabel>
                    <FormControl>
                      <Input autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormField>

                  <FormField field={fields.slugValidate} className="hidden">
                    <FormControl>
                      <input type="hidden" />  
                    </FormControl>
                  </FormField>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button isLoading={navigation.state !== "idle"} type="submit">
                      Delete Agent
                    </Button>
                  </DialogFooter>
                </Form>
              </DialogContent>
            </Dialog>

          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}
