import { useState } from "react";

import { Badge } from "@hebo/shared-ui/components/Badge";
import { Button } from "@hebo/shared-ui/components/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hebo/shared-ui/components/Table";

import type { ApiKey } from "~console/lib/auth/types";

import { RevokeApiKeyDialog } from "./revoke";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@hebo/shared-ui/components/DropdownMenu";
import { MoreVertical } from "lucide-react";


export function ApiKeysTable({ apiKeys }: { apiKeys: ApiKey[] }) {
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No API keys yet.
              </TableCell>
            </TableRow>
          ) : (
            apiKeys.map((key) => {
              const status = key.expiresAt.getTime() <= Date.now() ? "Expired" : "Active";
              const isExpired = status === "Expired";

              return (
                <TableRow key={key.id}>
                  <TableCell>{key.description}</TableCell>
                  <TableCell className="align-middle">
                    <Badge
                      variant="outline"
                      className={
                        isExpired
                          ? "border-destructive/50 text-destructive"
                          : "border-emerald-500/40 text-emerald-500"
                      }
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="truncate">{key.key}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {key.expiresAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {key.createdAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Branch actions">
                          <MoreVertical className="size-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => {
                            setSelectedKey(key);
                            setRevokeOpen(true);
                            }}
                          >
                          Revoke
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <RevokeApiKeyDialog
        open={revokeOpen}
        apiKey={selectedKey}
        onOpenChange={(open) => {
          setRevokeOpen(open);
          if (!open) setSelectedKey(null);
        }}
      />
    </div>
  );
}
