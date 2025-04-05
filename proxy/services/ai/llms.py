import re
from langchain_aws import ChatBedrockConverse
from langchain_openai import ChatOpenAI

# Define regex pattern for AWS Bedrock ARNs
BEDROCK_ARN_PATTERN = re.compile(
    r"arn:aws:bedrock:[a-z0-9-]+:\d+:inference-profile/[a-zA-Z0-9.-]+:\d+"
)

OPENAI_PATTERN = re.compile(
    r"^(gpt-4|gpt-3.5-turbo|gpt-3.5-turbo-16k|gpt-4o|gpt-4o-mini)(-\d{4})?(-\d{2})?(-preview)?$"
)

PROVIDER_MAP = {
    "bedrock": ChatBedrockConverse,
    "openai": ChatOpenAI,
}


# Use a function to determine the provider based on the ARN
def get_provider(model_name):
    if BEDROCK_ARN_PATTERN.match(model_name):
        return PROVIDER_MAP["bedrock"]
    elif OPENAI_PATTERN.match(model_name):
        return PROVIDER_MAP["openai"]
    raise ValueError(f"Unsupported model: {model_name}")


def init_llm(client, model_name, temperature=1, max_tokens=512, **kwargs):
    provider = get_provider(model_name)

    config = {
        "client": client,
        "model": model_name,
        "temperature": temperature,
        **kwargs,
    }

    # Only add max_tokens for non-Bedrock models
    if provider != PROVIDER_MAP["bedrock"]:
        config["max_tokens"] = max_tokens

    return provider(**config)
