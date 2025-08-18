import { useRouteLoaderData } from "react-router";

import { DangerSettings } from "./danger";
import { GeneralSettings } from "./general";

export default function Settings() {
  const { activeAgent } = useRouteLoaderData("routes/_shell");

  return (
    // FUTURE: generalize layout gaps
    <div className="flex max-w-2xl flex-col gap-4">
      <h1>Agent Settings</h1>

      <div className="flex flex-row items-center gap-4">
        <GeneralSettings activeAgent={activeAgent} />
      </div>

      <div className="flex flex-col gap-3">
        <DangerSettings activeAgent={activeAgent} />
      </div>
    </div>
  );
}
