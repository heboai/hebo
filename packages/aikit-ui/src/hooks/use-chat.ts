import { proxy, useSnapshot } from "valtio";

import { ChatState, ChatMessage, ChatActions } from "../types/chat";

// Initial state
const initialState: ChatState = {
  messages: [],
  currentInput: "",
  currentModel: "llama-3.1-8b-instant",
  isLoading: false,
  error: undefined,
};

// Valtio state proxy
const chatState = proxy<ChatState>(initialState);

// Actions
const chatActions: ChatActions = {
  setInput: (text: string) => {
    chatState.currentInput = text;
  },

  setModel: (modelId: string) => {
    chatState.currentModel = modelId;
  },

  addMessage: (message: ChatMessage) => {
    chatState.messages.push(message);
  },

  setMessages: (messages: ChatMessage[]) => {
    chatState.messages = messages;
  },

  clearMessages: () => {
    chatState.messages = [];
    chatState.error = undefined;
  },

  setLoading: (loading: boolean) => {
    chatState.isLoading = loading;
  },

  setError: (error: string | undefined) => {
    chatState.error = error;
  },
};

// Custom hook
export function useChat() {
  const state = useSnapshot(chatState);

  return {
    state,
    actions: chatActions,
  };
}
