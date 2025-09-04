import { isRouteErrorResponse } from "react-router";

export function ErrorView({ error }: { error: unknown }) {
  let title = "Something went wrong";
  let details: string | undefined;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    details = typeof error.data === "string" ? error.data : error.data?.message;
    title = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    details = error.message;
    if (import.meta.env.DEV && error.stack) stack = error.stack;
  }

  return (
    <div className="absolute right-0 left-0 mx-auto flex w-full max-w-2xl flex-col gap-1 pt-12">
      <div className="text-5xl">🙉</div>
      <h1>{title}</h1>
      {details && <p className="text-muted-foreground">{details}</p>}
      {stack && (
        <pre className="w-full overflow-x-auto text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </div>
  );
}
