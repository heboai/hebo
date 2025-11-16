import { unstable_useRoute } from "react-router";
import { toast } from "sonner";

import { Button } from "@hebo/shared-ui/components/Button";

import BranchesTable from "./table";


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

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={(event) => {
            event.preventDefault();
            toast.info("Create coming soon");
          }}
        >
          + Create Branch
        </Button>
      </div>
    </div>
  );
}
