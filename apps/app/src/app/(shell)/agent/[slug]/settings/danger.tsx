"use client";

import { ajvResolver } from "@hookform/resolvers/ajv";
import { Static, Type } from "@sinclair/typebox";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useSnapshot } from "valtio";

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

import { api, queryClient, useEdenMutation } from "~/lib/data";
import { agentStore } from "~/state/shell";

import type { JSONSchemaType } from "ajv";

const AGENT_NAME = agentStore.activeAgent
  ? agentStore.activeAgent.name
  : ("" as const);

const FormSchema = Type.Object({
  agentName: Type.Literal(AGENT_NAME, {
    errorMessage: "You must type your EXACT agent name",
  }),
});

type FormData = Static<typeof FormSchema>;

export function DangerSettings() {
  const form = useForm<FormData>({
    resolver: ajvResolver(FormSchema as unknown as JSONSchemaType<FormData>),
  });

  const agentSnap = useSnapshot(agentStore);
  const router = useRouter();

  const { mutate, error, isPending } = useEdenMutation({
    mutationFn: () =>
      api.agents({ agentSlug: agentSnap.activeAgent?.slug ?? "" }).delete(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      // FUTURE: implement wrapper for router to apply ViewTransitions
      router.replace(`/`);
    },
  });

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
                  <form onSubmit={form.handleSubmit(() => mutate())}>
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
                            <strong>
                              &quot;{agentSnap.activeAgent?.name}&quot;
                            </strong>{" "}
                            in the box below:
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage>
                            {error && <span>{error?.message}</span>}
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button isLoading={isPending} type="submit">
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
