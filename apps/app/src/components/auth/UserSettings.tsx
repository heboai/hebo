"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { AccountSettings } from '@stackframe/stack';
import { Suspense } from "react";
import { Loading } from "@/components/ui/loading";

export const UserSettings = () => {
    const [open, setOpen] = React.useState(true)
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const router = useRouter()

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            router.push('/')
        }
    }

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[1000px] p-6 md:p-8 bg-white shadow-lg rounded-lg">
                    <DialogHeader className="mb-4">
                        <DialogTitle>Account Settings</DialogTitle>
                        <DialogDescription>
                            Manage your account settings and preferences.
                        </DialogDescription>
                    </DialogHeader>
                    <Suspense fallback={<Loading size="md" variant="primary" />}>
                        <AccountSettings
                            fullPage={false}
                        />
                    </Suspense>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent className="p-6 bg-white shadow-lg rounded-t-lg">
                <DrawerHeader className="text-left mb-4">
                    <DrawerTitle>Account Settings</DrawerTitle>
                    <DrawerDescription>
                        Manage your account settings and preferences.
                    </DrawerDescription>
                </DrawerHeader>
                <Suspense fallback={<Loading size="md" variant="primary" />}>
                    <AccountSettings
                        fullPage={false}
                    />
                </Suspense>
            </DrawerContent>
        </Drawer>
    )
} 