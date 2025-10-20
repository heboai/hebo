import { useParams, useRouteLoaderData } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hebo/shared-ui/components/Card";

type AgentLoaderData = {
  agent?: {
    branches?: Array<{
      slug: string;
      name?: string;
      models?: Array<{ alias?: string; type?: string }>;
    }>;
  };
};

export default function BranchModelsRoute() {
  const params = useParams<{ branchSlug: string }>();
  const parentData =
    (useRouteLoaderData("routes/_shell.agent.$agentSlug") as AgentLoaderData) ??
    {};

  const branch =
    parentData.agent?.branches?.find(
      (candidate) => candidate.slug === params.branchSlug,
    ) ?? null;

  const models = branch?.models ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Models</h1>
        <p className="text-muted-foreground">
          {branch
            ? `Configure the models exposed by the ${branch.name ?? branch.slug} branch.`
            : `Configure the models exposed by the ${params.branchSlug ?? "current"} branch.`}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Branch models</CardTitle>
          <CardDescription>
            This is a scaffolded view. Replace it with your models management UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {models.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No models are defined for this branch yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {models.map((model, index) => (
                <li
                  key={model?.alias ?? index}
                  className="text-sm text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {model?.alias ?? "Unnamed"}
                  </span>
                  {model?.type ? ` · ${model.type}` : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
