import { useParams, useRouteLoaderData } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/service";
import { parseError } from "~console/lib/errors";

import type { Route } from "./+types/route";
import BranchModelsPage from "./page";
import { branchModelsFormSchema, type BranchModelsFormValues } from "./schema";

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: branchModelsFormSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  let result;
  try {
    result = await api
      .agents({ agentSlug: params.agentSlug })
      .branches({ branchSlug: params.branchSlug })
      .patch({
        models: submission.value.models,
      });

  } catch (error) {
    return submission.reply({ formErrors: [parseError(error).message] });
  }

  if (result.error) {
    return submission.reply({ formErrors: [String(result.error?.value)] });
  }

  return submission.reply();
}

// FUTURE: use new useRoute instead of useRouteLoaderData to avoid redefining types
type LoaderAgentData = {
  agent: {
    slug: string;
    branches?: Array<{
      slug: string;
      models?: BranchModelsFormValues["models"];
    }>;
  };
};

export default function BranchModelsRoute() {
  const params = useParams();
  const { agent } = useRouteLoaderData("routes/_shell.agent.$agentSlug") as LoaderAgentData;
  
  // FUTURE: do this in a loader
  const branch = agent.branches?.find((a) => a.slug === params.branchSlug);

  return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Model Configuration
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Configure access for agents to different models and their routing
            behaviour. Connect existing inference endpoints or choose from our
            managed providers.
          </p>
        </div>
        <BranchModelsPage
          agentSlug={agent.slug}
          branchSlug={branch!.slug}
          models={branch!.models}
        />
      </div>
  );
}
