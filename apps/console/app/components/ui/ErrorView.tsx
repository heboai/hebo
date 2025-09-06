import {
  useLocation,
  useNavigate,
  useNavigation,
  useRouteError,
} from "react-router";

import { Button } from "@hebo/ui/components/Button";

import { parseError } from "~console/lib/errors";

export function ErrorView() {
  const error = useRouteError();
  const { message, stack, retryable } = parseError(error);

  const navigate = useNavigate();
  const navigation = useNavigation();
  const { pathname, search, hash } = useLocation();

  return (
    <div className="absolute right-0 left-0 mx-auto flex w-full max-w-2xl flex-col gap-1 p-4 pt-12">
      <div className="text-5xl">🙉</div>
      <h1>Something went wrong</h1>
      {message && <p className="text-muted-foreground">{message}</p>}

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
