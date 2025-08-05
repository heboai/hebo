# Models Validation Schema

This package provides validation schemas and utilities for the `models` field in the branches table. The models field is a JSON array that follows a specific schema for defining LLM models with routing configurations.

## Schema Overview

The models field follows this structure:

```typescript
[
  {
    "alias": string,           // Unique identifier for the model
    "LLM": string,            // The LLM model name/identifier
    "routing": {
      "type": "cheapest" | "fastest" | "custom",
      // When type is "custom", customEndpoint is required
      "customEndpoint"?: {              // Required when type is "custom"
        "url": string,
        "provider": SupportedProvider,
        "apiKey": string,
        "headers"?: Record<string, string>
      }
    }
  }
]
```

## Supported Providers

- `openai`
- `anthropic`
- `google`
- `azure`
- `aws`
- `cohere`
- `mistral`
- `perplexity`
- `custom`

## Usage

### Basic Validation

```typescript
import { validateModels, validateSingleModel } from "@hebo/db";

// Validate a complete models array
const models = [
  {
    alias: "default",
    LLM: "gpt-4o",
    routing: {
      type: "fastest",
    },
  },
];

try {
  const validatedModels = validateModels(models);
  console.log("Validation passed:", validatedModels);
} catch (error) {
  console.error("Validation failed:", error);
}
```

### Adding Models to Branches

```typescript
import { addModel } from "@hebo/db";

const existingModels = [
  /* existing models */
];
const newModel = {
  alias: "summarizer",
  LLM: "gpt-3.5-turbo",
  routing: {
    type: "cheapest",
  },
};

try {
  const updatedModels = addModel(existingModels, newModel);
  // updatedModels now includes the new model
} catch (error) {
  // Handle validation errors or duplicate alias
}
```

### Updating Models

```typescript
import { updateModel } from "@hebo/db";

const updatedModels = updateModel(existingModels, "default", {
  alias: "vision",
  LLM: "gpt-4o",
  routing: {
    type: "fastest",
  },
});
```

### Removing Models

```typescript
import { removeModel } from "@hebo/db";

const modelsAfterRemoval = removeModel(existingModels, "default");
```

### Helper Functions

```typescript
import { createModel } from "@hebo/db";

// Create a model with cheapest routing
const modelWithCheapest = createModel("condense", "gpt-3.5-turbo", {
  type: "cheapest",
});

// Create a model with fastest routing
const modelWithFastest = createModel("default", "gpt-4o", { type: "fastest" });

// Create a model with custom endpoint
const modelWithCustomEndpoint = createModel("summarizer", "claude-3-sonnet", {
  type: "custom",
  customEndpoint: {
    url: "https://api.anthropic.com/v1/messages",
    provider: "anthropic",
    apiKey: "sk-ant-api03-...",
  },
});
```

## Validation Rules

1. **Alias Uniqueness**: Each model must have a unique alias within a branch
2. **Routing Types**: Must be one of `"cheapest"`, `"fastest"`, or `"custom"`. When type is `"custom"`, `customEndpoint` is required
3. **Required Fields**: `alias`, `LLM`, and `routing` are required
4. **URL Validation**: Custom endpoint URLs must be valid URLs
5. **Minimum Models**: A branch must have at least one model
6. **Provider Validation**: Custom endpoints must use supported providers

## Error Handling

The validation functions throw descriptive errors when validation fails:

- `"Model with alias "xyz" already exists"` - Duplicate alias
- `"Cannot remove the last model from a branch"` - Attempting to remove all models
- `"Model with alias "xyz" not found"` - Model doesn't exist for update/removal
- Zod validation errors for schema violations

## TypeScript Support

All schemas include TypeScript types for full type safety:

```typescript
import type { Models, Model, SupportedProvider } from "@hebo/db";

const models: Models = [
  /* ... */
];
const provider: SupportedProvider = "openai";
```
