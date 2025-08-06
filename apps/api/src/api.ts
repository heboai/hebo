import { db } from "@hebo/db/drizzle";
import { branches } from "@hebo/db/schema/branches";

export const handleGetVersion = async () => {
    const result = await db.select().from(branches).execute();
    return result;
};
