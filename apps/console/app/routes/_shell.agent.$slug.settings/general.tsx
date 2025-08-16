"use client";

import { useSnapshot } from "valtio";

import { Input } from "@hebo/ui/components/Input";

import { AgentLogo } from "~/components/ui/AgentLogo";
import { agentStore } from "~/state/shell";

export function GeneralSettings() {
  const agentSnap = useSnapshot(agentStore);

  return (
    <>
      <div>
        <AgentLogo size={96} />
      </div>
      <div className="grid w-full grid-cols-[max-content_1fr] grid-rows-2 gap-x-4 gap-y-2">
        <label htmlFor="name">Name </label>
        <Input id="name" readOnly value={agentSnap.activeAgent?.name || ""} />
        <label htmlFor="slug">Slug </label>
        <Input id="slug" readOnly value={agentSnap.activeAgent?.slug || ""} />
      </div>
    </>
  );
}
