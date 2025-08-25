export async function triggeredTask(data: any) {
  console.log("Triggered task running with data:", data);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second processing
  console.log("Triggered task finished.");
}
