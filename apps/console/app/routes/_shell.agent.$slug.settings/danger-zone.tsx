import { ajvResolver } from "@hookform/resolvers/ajv";
import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { useNavigation, useSubmit } from "react-router";
import { useForm } from "react-hook-form";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@hebo/ui/components/Form";
import { Input } from "@hebo/ui/components/Input";

import type { JSONSchemaType } from "ajv";


type ActiveAgent = {
  slug: string;
  name: string;
}

export function DangerSettings({ activeAgent, error }: { activeAgent: ActiveAgent, error?: string  }) {

  const FormSchema = Type.Object({
    agentName: Type.Literal(activeAgent.name, {
      errorMessage: "You must type your EXACT agent name",
    }),
    slug: Type.String({
      default: activeAgent.slug,
    }),
  });

  type FormData = Static<typeof FormSchema>;
  
  const form = useForm<FormData>({
    resolver: ajvResolver(FormSchema as unknown as JSONSchemaType<FormData>),
    defaultValues: { ...Value.Create(FormSchema), agentName: ""} satisfies Partial<FormData>
  });

  const submit = useSubmit();
  const navigation = useNavigation();

  return (
    <>
      <h2>Danger Zone</h2>

      {/* FUTURE: generalize px / py for Cards */}
      <Card className="border-destructive border-dashed py-5">
        <CardHeader className="px-5">
          <CardTitle>Delete this agent</CardTitle>
          <CardDescription>
            Once you delete an agent, there is no going back. Be certain.
          </CardDescription>
          <CardAction className="self-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Agent</Button>
              </DialogTrigger>
              <DialogContent className="bg-sidebar sm:max-w-md">
                {/* FUTURE: improve spacing in dialog */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => submit(data, { method: "post" }))} aria-busy={Boolean(navigation.formAction)}>
                    <DialogHeader>
                      <DialogTitle>Delete Agent</DialogTitle>
                    </DialogHeader>
                    <Alert variant="destructive">
                      <AlertTitle>
                        <strong>Warning:</strong> This action is not reversible.
                        Be certain.
                      </AlertTitle>
                    </Alert>

                    <FormField
                      control={form.control}
                      name="agentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            To confirm, type{" "}
                            <strong>{activeAgent.name}</strong> in
                            the box below:
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage>
                            {error && <span>{error}</span>}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem >
                          <FormControl>
                            <input type="hidden" {...field} />  
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button isLoading={Boolean(navigation.formAction)} type="submit">
                        Delete Agent
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>
      </Card>
    </>
  );
}
