"use client";

import { useState } from "react";
import { useRouteLoaderData, useParams } from "react-router";

import supportedModels from "@hebo/shared-data/json/supported-models";

import { Button } from "@hebo/shared-ui/components/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@hebo/shared-ui/components/Collapsible";
import { Card } from "@hebo/shared-ui/components/Card";
import { Badge } from "@hebo/shared-ui/components/Badge";
import { BranchModelForm, clientAction } from "./form";
import { RailSymbol } from "lucide-react";

import type { Route } from "./+types/route";


const getModelDisplayName = (modelName: string): string => {
  if (modelName === "custom") {
    return "Custom Model";
  }
  
  const model = supportedModels.find((m) => m.name === modelName);
  return model?.displayName || modelName;
};

export { clientAction };

export default function AgentBranchConfig({ loaderData, actionData }: Route.ComponentProps) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [newFormIds, setNewFormIds] = useState<string[]>([]);

  const { agent } = useRouteLoaderData<{
    agent: {
      branches: Array<{
        models: Array<{ alias: string; type: string }>;
      }>;
    };
  }>("routes/_shell.agent.$agentSlug")!;
  const { agentSlug, branchSlug } = useParams<{ agentSlug: string; branchSlug: string }>();
  const activeBranch = agent.branches[0];
  const models = activeBranch.models;
  const defaultModel = models.find((m) => m.alias === "default");

  return (
    <div className="absolute flex items-center w-full justify-center flex-col gap-2 max-w-lg">
      <div className="flex flex-col">
        <h2>Model Configuration</h2>
        <p className="text-muted-foreground">
          Configure access for agents to different models and their routing behaviour (incl. to your
          existing inference endpoints). Learn more about Model Configuration
        </p>
      </div>

        {models.map((m) => {
          const isOpen = !!openMap[m.alias];
          return (
            <Card key={m.alias} className="w-full border-none p-3">
              <Collapsible
                open={isOpen}
                onOpenChange={(v) => setOpenMap((prev) => ({ ...prev, [m.alias]: v }))}
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <p className="text-sm">
                    {agentSlug}/{branchSlug}/{m.alias}
                  </p>
                  <p className="text-sm">{getModelDisplayName(m.type)}</p>
                  <Badge variant="secondary">Custom <RailSymbol /> </Badge>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className={isOpen ? "invisible" : ""}>Edit</Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
                    <BranchModelForm
                      defaultModel={m}
                      currentModels={models}
                      supportedModels={supportedModels as { name: string; displayName?: string }[]}
                      onCancel={() => setOpenMap((prev) => ({ ...prev, [m.alias]: false }))}
                    />
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}

        {newFormIds.map((id) => (
          <Card key={id} className="w-full border-none p-3">
            <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
              <BranchModelForm
                currentModels={models}
                supportedModels={supportedModels as { name: string; displayName?: string }[]}
                onCancel={() => setNewFormIds((prev) => prev.filter((nid) => nid !== id))}
              />
            </Card>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={() =>
            setNewFormIds((prev) => [...prev, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`])
          }
        >
          + Add Model
        </Button>
    </div>
  );
}
