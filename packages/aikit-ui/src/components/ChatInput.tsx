import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@hebo/aikit-ui/_ai-elements/prompt-input";

function ChatInput() {
  return (
    <PromptInput onSubmit={() => {}} className="relative mt-4">
      <PromptInputTextarea onChange={() => {}} value={""} />
      <PromptInputToolbar>
        <PromptInputSubmit
          className="absolute right-1 bottom-1"
          disabled={false}
          status={"ready"}
        />
      </PromptInputToolbar>
    </PromptInput>
  );
}

export default ChatInput;
