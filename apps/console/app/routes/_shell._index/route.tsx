import { redirect } from "react-router";

import { api } from "~/lib/data";

async function defaultAgentMiddleware() {
  const { data: agents } = await api.agents.get();

  // FUTURE fade-in the next page
  // FUTURE remember last agent in sessions storage
  if (agents!.length > 0) {
    throw redirect(`/agent/${agents![0]?.slug}`);
  }
  throw redirect("/agent/create");
}

export const unstable_clientMiddleware = [defaultAgentMiddleware];

export default function Home() {
  return <></>;
}
