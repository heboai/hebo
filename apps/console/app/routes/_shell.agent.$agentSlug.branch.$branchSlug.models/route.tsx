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
    <BranchModelsPage
      agentSlug={agent.slug}
      branchSlug={branch!.slug}
      models={branch!.models}
    />
  );
}
