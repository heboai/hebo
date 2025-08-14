import { Input } from "@hebo/ui/components/Input";

import { AgentLogo } from "~/components/ui/AgentLogo";

export function GeneralSettings() {
  return (
    <>
      <div className="row-span-2">
        <AgentLogo size={96} />
      </div>
      <div className="grid w-full grid-cols-[max-content_1fr] grid-rows-2 gap-x-4 gap-y-2">
        <label htmlFor="name">Name </label>
        <Input id="name" readOnly value="Dummy Name" />
        <label htmlFor="id">ID </label>
        <Input id="id" readOnly value="Dummy ID" />
      </div>
    </>
  );
}
