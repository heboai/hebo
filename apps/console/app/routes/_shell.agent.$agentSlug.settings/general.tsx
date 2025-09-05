"use client";

import { Input } from "@hebo/ui/components/Input";

import { AgentLogo } from "~console/components/ui/AgentLogo";

type ActiveAgent = {
  slug: string;
  name: string;
}

export function GeneralSettings({ activeAgent }: { activeAgent: ActiveAgent }) {

  return (
    <div className="flex flex-row gap-4 items-center">
      <div>
        <AgentLogo size={96} />
      </div>
      <div className="w-full grid grid-cols-[max-content_1fr] gap-x-3 gap-y-2 items-center">
        <label htmlFor="name">Name</label>
        <Input id="name" readOnly defaultValue={activeAgent.name} />
        <label htmlFor="slug">Slug</label>
        <Input id="slug" readOnly defaultValue={activeAgent.slug} />
      </div>
    </div>
  );
}
