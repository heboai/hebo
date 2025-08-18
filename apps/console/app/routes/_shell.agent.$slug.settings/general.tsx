"use client";

import { Input } from "@hebo/ui/components/Input";

import { AgentLogo } from "~/components/ui/AgentLogo";

type ActiveAgent = {
  slug: string;
  name: string;
}

export function GeneralSettings({ activeAgent }: { activeAgent: ActiveAgent }) {

  return (
    <>
      <div>
        <AgentLogo size={96} />
      </div>
      <div className="grid w-full grid-cols-[max-content_1fr] grid-rows-2 gap-x-4 gap-y-2">
        <label htmlFor="name">Name </label>
        <Input id="name" readOnly value={activeAgent.name} />
        <label htmlFor="slug">Slug </label>
        <Input id="slug" readOnly value={activeAgent.slug} />
      </div>
    </>
  );
}
