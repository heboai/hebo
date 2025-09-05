// Throw "Not Found" to render shell
export function clientLoader() {
  throw new Response("Page does not exist", { status: 404, statusText: "Not Found" });
}
