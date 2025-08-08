"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import { useSnapshot } from "valtio";

import { Logo } from "~/components/ui/Logo";
import { agentStore } from "~/stores/agentStore";

export function AgentSelector() {
  const agentSnap = useSnapshot(agentStore);
  const router = useRouter();

  useLayoutEffect(() => {
    // TODO: Query Agents
    if (agentSnap.agents.length === 0) {
      router.push("/create-agent");
    }
    // TODO: Listen to Agent updates
  }, [agentSnap.agents.length, router]);

  return agentSnap.agents.length > 0 ? (
    /* TODO: Implement Agent & Branch Dropdowns */
    <></>
  ) : (
    <Link href="/">
      <Logo />
    </Link>
  );
}
