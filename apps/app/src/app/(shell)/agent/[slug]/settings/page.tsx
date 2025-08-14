import { Button } from "@hebo/ui/components/Button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hebo/ui/components/Card";
import { Input } from "@hebo/ui/components/Input";

import { AgentLogo } from "~/components/ui/AgentLogo";

export default function Settings() {
  return (
    <div className="max-w-2xl">
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

      <div>
        <h2>Danger Zone</h2>
        {/* TODO: generalize px / py to all cards */}
        <Card className="border-destructive border-dashed py-5">
          <CardHeader className="px-5">
            <CardTitle>Delete this agent</CardTitle>
            <CardDescription>
              Once you delete an agent, there is no going back. Be certain.
            </CardDescription>
            <CardAction className="self-center">
              <Button variant="destructive">Delete Agent</Button>
            </CardAction>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
