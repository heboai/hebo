import { redirect } from "react-router";

import { api } from "~/lib/data";

async function defaultAgentMiddleware() {
  const { data: agents } = await api.agents.get();

  // FUTURE fade-in the next page
  // FUTURE remember last agent and branch in session storage
  if (agents!.length > 0) {
    const firstAgent = agents![0];
    
    // Try to get branches for the first agent
    try {
      const { data: branches } = await api.agents({ agentSlug: firstAgent.slug }).branches.get();
      
      if (branches && branches.length > 0) {
        // Redirect to first branch of first agent
        throw redirect(`/agent/${firstAgent.slug}/branch/${branches[0].slug}`);
      } else {
        // No branches, redirect to agent page (could be a create branch flow)
        throw redirect(`/agent/${firstAgent.slug}`);
      }
    } catch {
      // If branches API fails, fallback to agent page
      throw redirect(`/agent/${firstAgent.slug}`);
    }
  }
  throw redirect("/agent/create");
}

export const unstable_clientMiddleware = [defaultAgentMiddleware];

export default function Home() {
  return <></>;
}
