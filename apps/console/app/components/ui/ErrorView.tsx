import isNetworkError from "is-network-error";
import { HTTPError, TimeoutError } from "ky";
import {
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router";

import { Button } from "@hebo/ui/components/Button";

export function ErrorView({ error }: { error: unknown }) {
  let details: string | undefined;
  let status: number | undefined;

  if (isRouteErrorResponse(error)) {
    const message =
      typeof error.data === "string" ? error.data : error.data?.message;
    details = `${error.statusText}: ${message}`;
    status = error.status;
  } else if (error instanceof TimeoutError) {
    details = `${error.message}`;
  } else if (isNetworkError(error)) {
    details = `Network error: ${error.message}`;
  } else if (error instanceof HTTPError) {
    details = `${error.response.statusText}: ${error.message}`;
    status = error.response.status;
  } else if (error instanceof Error) {
    details = `${error.message}`;
  }

  // Set error.stack if stack trace exists
  const stack = error instanceof Error && error.stack ? error.stack : undefined;

  // Retryable states
  let retryable =
    !!status && (status >= 500 || [408, 409, 425, 429].includes(status));
  if (!retryable && error instanceof TimeoutError) retryable = true;
  if (!retryable && isNetworkError(error)) retryable = true;

  const navigate = useNavigate();
  const navigation = useNavigation();
  const { pathname, search, hash } = useLocation();

  return (
    <div className="absolute right-0 left-0 mx-auto flex w-full max-w-2xl flex-col gap-1 p-4 pt-12">
      <div className="text-5xl">🙉</div>
      <h1>Something went wrong</h1>
      {details && <p className="text-muted-foreground">{details}</p>}

      {/* FUTURE Move stack trace into details dialog */}
      {import.meta.env.DEV && stack && (
        <pre className="w-full overflow-x-auto py-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}

      {retryable && (
        <Button
          className="w-auto self-start"
          onClick={() =>
            navigate(`${pathname}${search}${hash}`, {
              replace: true,
              viewTransition: true,
            })
          }
          isLoading={navigation.state !== "idle"}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
