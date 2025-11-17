import { unstable_useRoute } from "react-router";

import BranchesTable from "./table";
import CreateBranch, { BranchCreateSchema } from "./create";
import type { Route } from "./+types/route";
import { parseWithValibot } from "@conform-to/valibot";
import { createBranchDeleteSchema } from "./delete";

export async function clientAction({ request }: Route.ClientActionArgs ) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  let submission;

  switch (intent) {
    case "create": {
      submission = parseWithValibot(formData, {
        schema: BranchCreateSchema
      });
    }

    case "delete": {
      const branchSlug = formData.get("branchSlug") as string;

      submission = parseWithValibot(formData, {
        schema: createBranchDeleteSchema(branchSlug)
      });
    }
  }
  
  if (submission!.status !== 'success')
    return submission!.reply();

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
