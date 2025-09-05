import isNetworkError from "is-network-error";
import { HTTPError, TimeoutError } from "ky";
import { useEffect, useRef } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { toast } from "sonner";

export function parseError(error: unknown) {
  let message: string | undefined;
  let status: number | undefined;

  if (isRouteErrorResponse(error)) {
    const msg =
      typeof error.data === "string" ? error.data : error.data?.message;
    message = `${error.statusText}: ${msg}`;
    status = error.status;
  } else if (error instanceof TimeoutError) {
    message = `${error.message}`;
  } else if (isNetworkError(error)) {
    message = `Network error: ${error.message}`;
  } else if (error instanceof HTTPError) {
    message = `${error.response.statusText}: ${error.message}`;
    status = error.response.status;
  } else if (error instanceof Error) {
    message = `${error.message}`;
  }

  const stack = error instanceof Error && error.stack ? error.stack : undefined;

  let retryable =
    !!status && (status >= 500 || [408, 409, 425, 429].includes(status));
  if (!retryable && error instanceof TimeoutError) retryable = true;
  if (!retryable && isNetworkError(error)) retryable = true;

  return { message, status, stack, retryable };
}

export function useErrorToast() {
  const error = useRouteError();
  const hasToastRef = useRef(false);

  useEffect(() => {
    if (error && !hasToastRef.current) {
      toast.error(parseError(error).message);
      hasToastRef.current = true;
    }
  }, [error]);
}
