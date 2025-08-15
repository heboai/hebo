"use client";

import escapeStringRegexp from "escape-string-regexp";
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
import { Input } from "@hebo/ui/components/Input";

import { api, queryClient, useEdenMutation } from "~/lib/data";
import { agentStore } from "~/state/shell";

type FormData = {
  agentName: string;
};

export function DangerSettings() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      agentName: "",
    },
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
                <form
                  onSubmit={handleSubmit(() => mutate())}
                  aria-busy={isPending}
                >
                  <DialogHeader>
                    <DialogTitle>Delete Agent</DialogTitle>
                  </DialogHeader>
                  <Alert variant="destructive">
                    <AlertTitle>
                      <strong>Warning:</strong> This action is not reversible.
                      Be certain.
                    </AlertTitle>
                  </Alert>
                  <div>
                    To confirm, type &quot;<b>{agentSnap.activeAgent?.name}</b>
                    &quot; in the box below:
                  </div>
                  <Input
                    className="border-destructive"
                    disabled={isPending}
                    {...register("agentName", {
                      pattern: {
                        // eslint-disable-next-line security/detect-non-literal-regexp -- safe: escaped with escape-string-regexp
                        value: new RegExp(
                          `^${escapeStringRegexp(agentSnap.activeAgent?.name || "")}$`,
                        ),
                        message: "Please enter the agent name",
                      },
                      required: "Please enter the agent name",
                    })}
                    aria-describedby={
                      errors.agentName ? "agent-name-error" : undefined
                    }
                  />
                  {(errors.agentName || error) && (
                    <div
                      id="agent-name-error"
                      className="text-destructive"
                      role="alert"
                    >
                      {errors.agentName?.message}
                      {error?.message}
                    </div>
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button isLoading={isPending} type="submit">
                      Delete Agent
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>
      </Card>
    </>
  );
}
