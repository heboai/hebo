import { Form, useNavigation } from "react-router";
import { object, string, literal } from "valibot";
import { useForm, getFormProps } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";

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


type ActiveAgent = {
  slug: string;
  name: string;
}

export function DangerSettings({ activeAgent, error }: { activeAgent: ActiveAgent, error?: string  }) {

  const FormSchema = object({
    agentName: literal(activeAgent.name, "You must type your EXACT agent name"),
    slug: string(),
  });

  const [form, fields] = useForm({
    defaultValue: {
      agentName: "",
      slug: activeAgent.slug,
    },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: FormSchema });
    },
  });

  const navigation = useNavigation();

  return (
    <span className="flex flex-col gap-2">
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
                  </DialogHeader>
                  <Alert variant="destructive">
                    <AlertTitle>
                      <strong>Warning:</strong> This action is not reversible.
                      Be certain.
                    </AlertTitle>
                  </Alert>

                  <FormField field={fields.slug} className="hidden">
                    <FormControl>
                      <input />  
                    </FormControl>
                  </FormField>

                  <FormField field={fields.agentName}>
                    <FormLabel>
                      To confirm, type{" "}
                      <strong>{activeAgent.name}</strong> in
                      the box below:
                    </FormLabel>
                    <FormControl>
                      <Input />
                    </FormControl>
                    <FormMessage />
                  </FormField>

                  {error && (
                    <div className="text-destructive text-right" role="alert">
                      {error}
                    </div>
                  )}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button isLoading={Boolean(navigation.formAction)} type="submit">
                      Delete Agent
                    </Button>
                  </DialogFooter>
                </Form>
              </DialogContent>
            </Dialog>

          </CardAction>
        </CardHeader>
      </Card>
    </span>
  );
}
