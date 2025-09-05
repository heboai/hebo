import { Outlet } from "react-router";

export default function AgentBranchLayout() {
  return <div className="max-w-2xl flex flex-col gap-6"><Outlet /></div>;
}
