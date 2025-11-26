import { http, HttpResponse } from "msw";

import { db } from "~console/mocks/db";

const SUPPORTED_PROVIDERS: Record<string, { name: string }> = {
  bedrock: { name: "Amazon Bedrock" },
  cohere: { name: "Cohere" },
  vertex: { name: "Google Vertex AI" },
  groq: { name: "Groq" },
};

export const providerHandlers = [
  http.get("/api/v1/providers", async () => {
    const providers = [];

    for (const slug in SUPPORTED_PROVIDERS) {
      const configuredProvider = db.providers.findFirst((q) =>
        q.where({ slug: slug }),
      );

      if (configuredProvider) {
        providers.push(configuredProvider);
      } else {
        providers.push({
          slug,
          name: SUPPORTED_PROVIDERS[slug].name,
          config: undefined,
          created_by: "",
          created_at: undefined,
          updated_by: "",
          updated_at: undefined,
        });
      }
    }

    return HttpResponse.json(providers);
  }),

  http.put<{ slug: string }>(
    "/api/v1/providers/:slug/config",
    async ({ params, request }) => {
      const body = (await request.json()) as unknown;

      const provider = await db.providers.create({
        slug: params.slug,
        name: SUPPORTED_PROVIDERS[params.slug].name,
        config: body,
      });

      return HttpResponse.json(provider, { status: 201 });
    },
  ),

  http.delete<{ slug: string }>(
    "/api/v1/providers/:slug/config",
    async ({ params }) => {
      db.providers.delete((q) => q.where({ slug: params.slug }));

      return new HttpResponse(undefined, { status: 200 });
    },
  ),
];
