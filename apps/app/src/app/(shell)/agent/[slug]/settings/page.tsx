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
  DialogDescription,
  DialogHeader,
} from "@hebo/ui/components/Dialog";
import { Input } from "@hebo/ui/components/Input";

import { AgentLogo } from "~/components/ui/AgentLogo";

export default function Settings() {
  return (
    // TODO: generalize layout gaps
    <div className="flex max-w-2xl flex-col gap-4">
      <h1>Agent Settings</h1>

      <div className="flex flex-row items-center gap-4">
        <div className="row-span-2">
          <AgentLogo width={96} height={96} />
        </div>
        <div className="grid w-full grid-cols-[max-content_1fr] grid-rows-2 gap-x-4 gap-y-2">
          <label htmlFor="name">Name </label>
          <Input id="name" readOnly value="Dummy Name" />
          <label htmlFor="id">ID </label>
          <Input id="id" readOnly value="Dummy ID" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2>Danger Zone</h2>
        {/* TODO: generalize px / py for Cards */}
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
                <DialogContent className="sm:max-w-md">
                  <DialogHeader className="gap-4">
                    <DialogTitle>Delete Agent</DialogTitle>
                    <DialogDescription className="flex flex-col gap-2">
                      <Alert variant="destructive">
                        <AlertTitle>
                          <b>Warning:</b> This action is not reversible. Be
                          certain.
                        </AlertTitle>
                      </Alert>
                      <div>
                        To confirm, type &quot;<b>Dummy Name</b>&quot; in the
                        box below:
                      </div>
                      <Input className="border-destructive" />
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Delete Agent</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardAction>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
