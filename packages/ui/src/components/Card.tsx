import {
  Card as ShadCnCard,
  CardContent as ShadCnCardContent,
  CardFooter as ShadCnCardFooter,
  CardHeader as ShadCnCardHeader,
  CardTitle as ShadCnCardTitle,
} from "../_shadcn/ui/card";
import { cn } from "../lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <ShadCnCard className={cn("py-5", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <ShadCnCardContent className={cn("px-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <ShadCnCardFooter className={cn("px-5", className)} {...props} />;
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <ShadCnCardHeader className={cn("px-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ShadCnCardTitle className={cn("font-medium", className)} {...props} />
  );
}

export { CardAction, CardDescription } from "../_shadcn/ui/card";
