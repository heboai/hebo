
import { Avatar } from "@hebo/shared-ui/components/Avatar";
import { Button } from "@hebo/shared-ui/components/Button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle
} from "@hebo/shared-ui/components/Item";
import { HelpCircle } from "lucide-react";
import { Bedrock, Groq, Vertex } from "~console/components/ui/Icons";

const ProviderIcons = {
  bedrock: Bedrock,
  vertex: Vertex,
  groq: Groq,
} as const;


type Provider = {
  slug: string;
  name: string;
};

export function ProvidersList({ providers }: { providers: Provider[] }) {
    return (
        <div className="flex flex-col gap-4">
            {providers.map((provider) => {
                return (
                    <Item key={provider.slug} variant="outline" className="bg-background">
                        <ItemMedia>
                            <Avatar>
                                {(() => {
                                    const Icon = ProviderIcons[provider.slug as (keyof typeof ProviderIcons)] ?? HelpCircle;
                                    return <Icon size={32} />;
                                })()}
                            </Avatar>
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>{provider.name}</ItemTitle>
                        </ItemContent>
                        <ItemActions>
                            <Button size="sm" variant="outline">
                                Configure
                            </Button>
                        </ItemActions>
                    </Item>
                );
            })}
        </div>
    );
}
