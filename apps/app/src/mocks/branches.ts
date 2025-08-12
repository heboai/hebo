import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~/mocks/db";

if (!db.hasCollection("branches")) {
  db.createCollection("branches");
  db.getCollection("branches").insert({
    name: "main",
    slug: "main",
  });
}

interface Branch {
  name: string;
}

export const branchHandlers = [
  http.post<{ slug: string }>(
    "/api/agents/:slug/branches",
    async ({ request }) => {
      const body = (await request.json()) as Branch;

      const tmpBranch = {
        name: body.name,
        slug: slugify(body.name),
      };

      if (db.getCollection("branches").findBy({ slug: tmpBranch.slug })) {
        return HttpResponse.json(
          { error: "Branch with the same name already exists" },
          { status: 400 },
        );
      }

      const newBranch = db.getCollection("branches").insert(tmpBranch);

      await delay(1500);
      return HttpResponse.json(newBranch, { status: 201 });
    },
  ),

  http.get<{ slug: string }>("/api/agents/:slug/branches", async () => {
    const branches = db.getCollection("branches").records;

    await delay(1000);
    return HttpResponse.json(branches);
  }),
];
