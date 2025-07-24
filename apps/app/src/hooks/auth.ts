"use client"

import { useSnapshot } from "valtio";

import { isStackAuth, stackApp } from "~/lib/auth";
import { authState } from "~/stores/auth";

export function useAuth(redirect?: boolean) {
     if (isStackAuth) {
        if (redirect) {
            stackApp.useUser({or: "redirect"})
        } else {
            stackApp.useUser()
        }
    }

    return useSnapshot(authState);;
}
