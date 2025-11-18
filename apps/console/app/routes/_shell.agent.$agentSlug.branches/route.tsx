import { unstable_useRoute } from "react-router";

import { parseWithValibot } from "@conform-to/valibot";

import CreateBranch, { BranchCreateSchema } from "./create";
import { createBranchDeleteSchema } from "./delete";
import BranchesTable from "./table";

import type { Route } from "./+types/route";
import { api } from "~console/lib/service";
import { parseError } from "~console/lib/errors";


export async function clientAction({ request, params }: Route.ClientActionArgs ) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  let submission, result;

  switch (intent) {
    case "create":
      submission = parseWithValibot(formData, {
        schema: BranchCreateSchema
      });

      if (submission!.status !== 'success')
        return submission!.reply();

      try {
        result = await api.agents({
          agentSlug: params.agentSlug,
        }).branches.post({
          name: submission.value.branchName,
          sourceBranchSlug: submission.value.sourceBranchSlug,
        });
      } catch (error) {
        return submission.reply({ formErrors: [ parseError(error).message ] });
      }
      
      if (result.error?.status === 409 || result.error?.status === 404 ) 
        return submission.reply({ fieldErrors: { branchName: [String(result.error.value)] }});

      break;

    case "delete": 
      const branchSlug = formData.get("branchSlug") as string;

      submission = parseWithValibot(formData, {
        schema: createBranchDeleteSchema(branchSlug)
      });

      if (submission!.status !== 'success')
        return submission!.reply();

      try {
        result = await api.agents({ agentSlug: params.agentSlug }).branches({ branchSlug: submission.value.slugConfirm}).delete();
      } catch (error) {
        return submission.reply({ formErrors: [ parseError(error).message ] });
      }

      if (result.error)
        return submission.reply({ formErrors: [String(result.error?.value)] });

      break;
  }
  
  return submission!.reply();
}


export default function Branches() {
  
  const agent = unstable_useRoute("routes/_shell.agent.$agentSlug")!.loaderData!.agent!;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1>Branches</h1>
        <p className="text-muted-foreground text-sm">
          Manage branches for your agent.
        </p>
      </div>

      <BranchesTable agent={agent} />

      <CreateBranch branches={agent.branches} />

    </div>
  );
}
