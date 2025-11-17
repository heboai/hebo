import { unstable_useRoute } from "react-router";

import BranchesTable from "./table";
import CreateBranch from "./create";


export default function AgentBranchesRoute() {
  
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
