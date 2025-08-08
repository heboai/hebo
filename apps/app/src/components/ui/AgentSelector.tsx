"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSnapshot } from "valtio";

import { Logo } from "~/components/ui/Logo";
import { agentStore } from "~/stores/agentStore";

export function AgentSelector() {
  const agentSnap = useSnapshot(agentStore);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // TODO: Query Agents
    if (agentSnap.agents.length === 0 && pathname !== "/create-agent") {
      router.push("/create-agent");
    }
  }, [agentSnap.agents.length, pathname, router]);

  return agentSnap.agents.length > 0 ? (
    /* TODO: Implement Agent & Branch Dropdowns */
    <></>
  ) : (
    <Link href="/">
      <Logo />
    </Link>
  );
}
