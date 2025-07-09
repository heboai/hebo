import { db } from "@hebo/db";
import { version } from "@hebo/db";


export const handleGetVersion = async () => {
    const result = await db.select().from(version).execute();
    return result;
};