import { redirect, useParams } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";

import type { Route } from "./+types/route";

import { BranchCreateForm, BranchCreateSchema } from "./form";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const result = await api.agents({ agentSlug: params.agentSlug }).branches.get();
  return { branches: result.data ?? [] };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();

  const submission = parseWithValibot(formData, { schema: BranchCreateSchema });
  
  if (submission.status !== 'success')
    return submission.reply();

  // Get source branch models to copy
  const branchesResult = await api.agents({ agentSlug: params.agentSlug }).branches.get();
  const sourceBranch = branchesResult.data?.find(b => b.slug === submission.value.sourceBranch);
  
  const result = await api.agents({ agentSlug: params.agentSlug }).branches.post({
    name: submission.value.branchName,
    models: sourceBranch?.models ?? [],
  });

  return redirect(`/agent/${params.agentSlug}/branch/${result.data!.slug}`);
}

export default function BranchCreate({ loaderData }: Route.ComponentProps) {
  const { agentSlug } = useParams();
  
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <BranchCreateForm agentSlug={agentSlug!} branches={loaderData.branches} />
    </div>
  );
}
