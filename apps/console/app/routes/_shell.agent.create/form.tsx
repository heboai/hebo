import { Form, useActionData, useNavigation } from "react-router";
import { z } from "zod";
import { useForm, getFormProps } from "@conform-to/react";
import { getZodConstraint } from "@conform-to/zod/v4";

import supportedModels from "@hebo/shared-data/json/supported-models";
import { Button } from "@hebo/shared-ui/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hebo/shared-ui/components/Card";
import {
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@hebo/shared-ui/components/Form";
import { Input } from "@hebo/shared-ui/components/Input";
import {
  Select
} from "@hebo/shared-ui/components/Select";

import { useActionDataErrorToast } from "~console/lib/errors";


export const AgentCreateSchema = z.object({
  agentName: ((msg) => z.string(msg).trim().min(1, msg))("Please enter an agent name"),
  defaultModel: z.string(),
});
export type AgentCreateFormValues = z.infer<typeof AgentCreateSchema>;

export function AgentCreateForm() {
  const lastResult = useActionData();
  
  useActionDataErrorToast();
  
  const [form, fields] = useForm<AgentCreateFormValues>({
    lastResult,
    constraint: getZodConstraint(AgentCreateSchema),
    defaultValue: {
      defaultModel: supportedModels[0].name,
    }
  });

  const navigation = useNavigation();

  return (
    <Form method="post" {...getFormProps(form)} className="contents">
      <Card className="sm:max-w-lg min-w-0 w-full border-none bg-transparent shadow-none">

        <CardHeader>
          <CardTitle><h1>Create a new agent</h1></CardTitle>
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
