import { useState } from "react";
import { MoreVertical, Trash } from "lucide-react";

import { Badge } from "@hebo/shared-ui/components/Badge";
import { Button } from "@hebo/shared-ui/components/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@hebo/shared-ui/components/Dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hebo/shared-ui/components/DropdownMenu";
import { Input } from "@hebo/shared-ui/components/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hebo/shared-ui/components/Table";
import { CopyToClipboardButton } from "@hebo/shared-ui/components/code/CopyToClipboardButton";
import { Form, useActionData, useNavigation } from "react-router";
import { Alert, AlertTitle } from "@hebo/shared-ui/components/Alert";
import { FormControl, FormField, FormLabel, FormMessage } from "@hebo/shared-ui/components/Form";
import { getFormProps, useForm } from "@conform-to/react";
import { literal, object, type InferOutput } from "valibot";
import { getValibotConstraint } from "@conform-to/valibot";
import { useActionDataErrorToast } from "~console/lib/errors";


export function createBranchDeleteSchema(branchSlug: string) {
  return object({
    slugConfirm: literal(branchSlug, "You must type your EXACT branch slug"),
  });
}
export type AgentDeleteFormValues = InferOutput<ReturnType<typeof createBranchDeleteSchema>>;

type BranchesTableProps = {
  agent: {
    slug: string,
    branches?: 
    {
        slug: string,
        name?: string,
    }[] 
  }
};

export default function BranchesTable({ agent }: BranchesTableProps) {

  const lastResult = useActionData();

  useActionDataErrorToast();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [form, fields] = useForm<AgentDeleteFormValues>({
    lastResult,
    constraint: getValibotConstraint(createBranchDeleteSchema(selectedBranch)),
  });

  const navigation = useNavigation();

  return (
    <div>
        {/* FUTURE: Generalize table styles */}
        <Table className="rounded-lg overflow-hidden [&_td]:px-4 [&_th]:px-4">
            <TableHeader className="bg-secondary">
                <TableRow className="">
                    <TableHead className="w-1/3">Branch</TableHead>
                    <TableHead className="hidden sm:table-cell">Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="bg-background">
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
                                    onSelect={() => {
                                      setSelectedBranch(branch.slug);
                                      setDeleteOpen(true);
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

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-md bg-sidebar">
            <Form method="post" {...getFormProps(form)} className="contents">
              <DialogHeader>
                <DialogTitle>Delete branch</DialogTitle>
                <DialogDescription>
                  This will delete your branch irreversibly.
                </DialogDescription>
              </DialogHeader>
              <Alert variant="destructive">
                <AlertTitle>
                  <strong>Warning:</strong> This action is not reversible.
                  Be certain.
                </AlertTitle>
              </Alert>

              <FormField field={fields.slugConfirm}>
                <FormLabel>
                  <div>
                    To confirm, type{" "}
                    <strong>{selectedBranch}</strong> in
                    the box below:
                  </div>
                </FormLabel>
                <FormControl>
                  <Input autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormField>

              <DialogFooter>
                <DialogClose>
                  <Button
                    type="button"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="destructive"
                  isLoading={navigation.state !== "idle"}
                >
                  Delete
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
      </Dialog>
    </div>
  )
}
