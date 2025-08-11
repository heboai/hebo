import { Static } from "@sinclair/typebox";

import { FromSchema } from "./_typebox/prototypes/from-schema";

type AgentSchema = {
  $id: "agent.schema.json";
  $schema: "https://json-schema.org/draft/2020-12/schema";
  type: "object";
  required: ["slug", "name", "models"];
  properties: {
    slug: {
      type: "string";
      minLength: 1;
    };
    name: {
      type: "string";
      minLength: 1;
    };
    models: {
      type: "array";
      items: {
        type: "object";
        required: ["alias", "canonicalName"];
        properties: {
          alias: {
            type: "string";
            minLength: 1;
          };
          canonicalName: {
            $ref: "models.schema.json#/$defs/ModelCanonicalName";
          };
          endpoint: {
            type: "object";
            properties: {
              url: {
                type: "string";
                format: "uri";
              };
              provider: {
                enum: ["aws", "custom"];
              };
              apiKey: {
                type: "string";
                minLength: 1;
              };
            };
            required: ["url", "provider", "apiKey"];
          };
        };
      };
    };
  };
};

// Convert plain JSON Schema -> TypeBox TSchema
export type Agent = Static<ReturnType<typeof FromSchema<AgentSchema>>>;
