import { MoreVertical, Trash } from "lucide-react";

import { Badge } from "@hebo/shared-ui/components/Badge";

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
import { CopyToClipboardButton } from "@hebo/shared-ui/components/code/CopyToClipboardButton";
import { Button } from "@hebo/shared-ui/components/Button";
import { toast } from "sonner";


type BranchesTableProps = {
  agent: {
    slug: String,
    branches?: 
    {
        slug: string,
    }[] 
  }
};

export default function BranchesTable({ agent }: BranchesTableProps) {
  return (
    <div>
        <Table>
            <TableHeader>
                <TableRow>
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
                                <Badge variant="outline">{agent.slug} / {branch.slug}</Badge>
                                <CopyToClipboardButton textToCopy={copyValue} />
                            </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">(Needs API implementation)</TableCell>
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
                                    onSelect={(event) => {
                                    event.preventDefault();
                                    toast.info("Delete coming soon");
                                    }}
                                >
                                    <Trash />
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

        <div>
            <Button
            type="button"
            variant="outline"
            onClick={(event) => {
                event.preventDefault();
                toast.info("Create coming soon");
            }}
            >
            + Create Branch
            </Button>
        </div>
      </div>
  )
}