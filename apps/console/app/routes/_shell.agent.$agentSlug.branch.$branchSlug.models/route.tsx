import { useParams, useRouteLoaderData } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/service";
import { parseError } from "~console/lib/errors";

import ModelsConfigForm from "./form";
import { modelsConfigFormSchema, type ModelsConfigFormValues } from "./schema";

import type { Route } from "./+types/route";

export async function clientAction({ request, params }: Route.ClientActionArgs) {

  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: modelsConfigFormSchema,
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
        models: submission.value.models ?? [],
      });

  } catch (error) {
    return submission.reply({ formErrors: [parseError(error).message] });
  }

  if (result.error) {
    return submission.reply({ formErrors: [String(result.error?.value)] });
  }

  return submission.reply();
}

// FUTURE: try experimental useRoute instead of useRouteLoaderData to avoid redefining types
type LoaderAgentData = {
  agent: {
    slug: string;
    branches?: Array<{
      slug: string;
      models?: ModelsConfigFormValues["models"];
    }>;
  };
};

export default function ModelsConfigRoute() {
  const params = useParams();
  const { agent } = useRouteLoaderData("routes/_shell.agent.$agentSlug") as LoaderAgentData;
  
  // FUTURE: do this in a separate loader as part of the branch switching feature
  const branch = agent.branches?.find((a) => a.slug === params.branchSlug);

  return (
      <div className="flex flex-col gap-4">
        <h1>Model Configuration</h1>
        <p className="text-muted-foreground text-sm">
          Configure access for the agent to different models. Use our managed providers or connect your existing inference endpoints.
        </p>

        <ModelsConfigForm
          agentSlug={agent.slug}
          branchSlug={branch!.slug}
          models={branch!.models}
        />
      </div>
  );
}
