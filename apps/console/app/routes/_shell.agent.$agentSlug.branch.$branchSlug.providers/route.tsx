import { parseWithZod } from "@conform-to/zod/v4";
import z from "zod";

import { api } from "~console/lib/service";
import { parseError } from "~console/lib/errors";

import type { Route } from "./+types/route";
import { ProvidersList } from "./list";


export async function clientLoader() {
  return { providers: (await api.providers.get()).data ?? [] };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create": {
      const submission = parseWithZod(formData, {
        schema: z.object(), // FUTURE: create schema
      });

      if (submission.status !== "success")
          return { submission: submission.reply() };

      let provider;
      try {
        // FUTURE: call API endpoint
      } catch (error) {
        return { submission: submission.reply({
          formErrors: [parseError(error).message],
        })};
      }
      
      return { submission: submission.reply(), provider };
    }

    case "delete": {
      const submission = parseWithZod(formData, {
        schema: z.object(), // FUTURE: create schema
      });

      if (submission.status !== "success")
        return { submission: submission.reply() };

      try {
        // FUTURE: call API endpoint
      } catch (error) {
        return { submission: submission.reply({
          formErrors: [parseError(error).message],
        })};
      }

      return { submission: submission.reply() };
    }
  }
}

export default function ProviderRoute({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <div>
        <h1>Providers</h1>
        <p className="text-muted-foreground text-sm">
          Use your own provider API keys to access Hebo Gateway
        </p>
      </div>

      <ProvidersList providers={loaderData.providers} />
    </>
  );
}
