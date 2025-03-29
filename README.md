# Hebo AI

## Introduction

Hebo AI is a platform designed for building and deploying AI agents. It provides a robust environment for creating intelligent conversational agents that can be easily integrated into various applications. Whether you're a business user looking to enhance customer interactions or a developer aiming to leverage AI capabilities, Hebo AI offers the tools and flexibility you need.

## Core Features

- **AI Agent Creation**: Hebo AI allows users to create sophisticated AI agents tailored to specific needs.
- **Rapid Iteration**: Quickly iterate on agent designs with comprehensive control over their behavior and responses.
- **Integrated Knowledge Base**: Seamlessly add and manage knowledge to enhance agent capabilities.

## High-level Architecture
```mermaid
flowchart TD
    web[Web UI] & cli[CLI] -- Managing --> core[Core]
    core --> db[(DB)]
    web & cli -- Testing--> proxy[Proxy]
    proxy --> llm[LLM]
    core -- Vectors --> proxy
    user[Chat User] -- Conversing --> proxy
```

## Getting Started

1. **Create an Account**: Visit [app.hebo.ai](https://app.hebo.ai) to create an account.
2. **Add Knowledge**: Start adding knowledge to your AI agents to improve their performance and relevance.

### For Developers

1. **Obtain API Keys**: Access your API keys to integrate Hebo AI into your applications.
2. **Integrate API Calls**: Use the provided proxy API calls to interact with your AI agents programmatically.

## Support

Join our community on Discord for support and discussions: [Hebo AI Discord Channel](https://discord.gg/cCJtXZRU5p)

## Contributing

We welcome contributions from the community! To get started:

1. Choose an issue from our [issue tracker](https://github.com/heboai/hebo/issues).
2. Open a pull request with your proposed changes.

We look forward to your contributions!