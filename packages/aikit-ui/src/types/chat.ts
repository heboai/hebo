export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
}

export interface ChatState {
  messages: ChatMessage[];
  currentInput: string;
  currentModel: string;
  isLoading: boolean;
  error: string | undefined;
}

export interface ChatActions {
  setInput: (text: string) => void;
  setModel: (modelId: string) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
}

export interface Model {
  id: string;
  name: string;
}

export interface ChatProps {
  models: Model[];
  apiKey: string;
}
