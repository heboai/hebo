"use client";

import { BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocsButton() {
  return (
    <Button variant="secondary">
      <BookCheck className="h-5 w-5 shrink-0" />
      Docs
    </Button>
  );
}
