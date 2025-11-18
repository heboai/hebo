import { useState } from "react";
import { MoreVertical, Trash } from "lucide-react";

import { Badge } from "@hebo/shared-ui/components/Badge";
import { Button } from "@hebo/shared-ui/components/Button";
import { CopyToClipboardButton } from "@hebo/shared-ui/components/code/CopyToClipboardButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hebo/shared-ui/components/DropdownMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hebo/shared-ui/components/Table";

import DeleteBranchDialog from "./delete";


type BranchesTableProps = {
  agent: {
    slug: string;
    branches?: {
      slug: string;
      updated_by?: string,
      updated_at?: Date;
    }[];
  };
};

export default function BranchesTable({ agent }: BranchesTableProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBranchSlug, setSelectedBranchSlug] = useState<string | undefined>(undefined);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="">
            <TableHead className="w-1/3">Branch</TableHead>
            <TableHead className="hidden sm:table-cell">Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agent.branches!.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No branches yet.
              </TableCell>
            </TableRow>
          ) : (
            agent.branches!.map((branch) => {
              const copyValue = `${agent.slug}/${branch.slug}`;
              return (
                <TableRow key={branch.slug}>
                  <TableCell className="align-middle">
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {agent.slug} / {branch.slug}
                      </Badge>
                      <CopyToClipboardButton textToCopy={copyValue} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {`${branch.updated_by ?? "Dummy User"} (${(branch.updated_at ?? new Date(0)).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })})`}
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
                            setSelectedBranchSlug(branch.slug);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash aria-hidden="true" />
                          Delete
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

      <DeleteBranchDialog
        open={deleteOpen}
        branchSlug={selectedBranchSlug}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedBranchSlug(undefined);
        }}
      />
    </div>
  );
}
