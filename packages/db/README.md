# @hebo/db

Usage example.

```ts
import { db } from "@hebo/db/drizzle";
import { agents } from "@hebo/db/schema/agents";

const allAgents = await db.select().from(agents);
```
