import { Form, useActionData, useNavigation } from "react-router";
import { message, nonEmpty, object, string, pipe, trim, type InferOutput } from "valibot";
import { useForm, getFormProps } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";
import { Button } from "@hebo/ui/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hebo/ui/components/Card";
import {
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@hebo/ui/components/Form";
import { Input } from "@hebo/ui/components/Input";
import {
  Select
} from "@hebo/ui/components/Select";

import { useActionDataErrorToast } from "~console/lib/errors";


export const AgentCreateSchema = object({
  agentName: message(pipe(string(), trim(), nonEmpty()), "Please enter an agent name"),
  defaultModel: string(),
});
export type AgentCreateFormValues = InferOutput<typeof AgentCreateSchema>;

export function AgentCreateForm() {
  const lastResult = useActionData();
  
  useActionDataErrorToast();
  
  const [form, fields] = useForm<AgentCreateFormValues>({
    lastResult,
    constraint: getValibotConstraint(AgentCreateSchema),
    defaultValue: {
      defaultModel: supportedModels[0].name,
    }
  });

  const navigation = useNavigation();

  return (
    <Form method="post" {...getFormProps(form)} className="contents">
      <Card className="sm:max-w-lg min-w-0 w-full border-none bg-transparent shadow-none">

        <CardHeader>
          <CardTitle><h2>Create a new agent</h2></CardTitle>
          <CardDescription>
            Each agent has its own model configuration and API keys. Learn more
            about which model to choose based on Use Case.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="sm:grid sm:grid-cols-[auto_1fr] sm:gap-y-2">

            <FormField field={fields.agentName} className="contents">
              <FormLabel className="sm:w-32">Agent Name</FormLabel>
              <FormControl>
                <Input placeholder="Set an agent name" autoComplete="off" />
              </FormControl>
              <FormMessage className="sm:col-start-2" />
            </FormField>

            <FormField field={fields.defaultModel} className="contents">
              <FormLabel className="sm:w-32">Default Model</FormLabel>
              <FormControl>
                <Select
                  items={supportedModels.map((m) => ({
                    value: m.name,
                    name: (
                        <>
                          {m.displayName}{" "}
                          <span className="text-xs">
                            ({new Intl.NumberFormat("en", {
                              notation: "compact",
                              compactDisplay: "short",
                              maximumFractionDigits: 1,
                            }).format(m.rateLimit)}{" "}
                            free tokens / month)
                          </span>
                        </>
                      ),
                  }))}
                />
              </FormControl>
              <FormMessage className="sm:col-start-2" />
            </FormField>
          </div>

        </CardContent>

        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            isLoading={navigation.state !== "idle"}
          >
            Create
          </Button>
        </CardFooter>

      </Card>
    </Form>
  );
}
