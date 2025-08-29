import { redirect } from "react-router";

import { api } from "~/lib/data";

async function defaultAgentMiddleware() {
  const { data: agents } = await api.agents.get();

  // FUTURE fade-in the next page
  // FUTURE remember last agent and branch in session storage
  
  if (!agents?.length) {
    throw redirect("/agent/create");
  }

  try {
    const { data: branches } = await api.agents({ agentSlug: agents[0].slug }).branches.get();
    
    if (branches?.length) {
      throw redirect(`/agent/${agents[0].slug}/branch/${branches[0].slug}`);
    }
  } catch {
    // API error or no branches - fallback to create
  }
  
  throw redirect("/agent/create");
}

export const unstable_clientMiddleware = [defaultAgentMiddleware];

export default function Home() {
  return <></>;
}
