import { triggeredTask } from "./triggeredTask";
import { taskManager } from "../lib/taskManager";

export async function processIncomingMessage(payload: any) {
  console.log(`Processing incoming message: ${JSON.stringify(payload)}`);
  // Simulate a long-running task
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Trigger another task
  console.log("Triggering another task...");
  taskManager.addTask(() =>
    triggeredTask({ originalPayload: payload, processedAt: new Date() }),
  );

  console.log("Finished processing message.");
}
