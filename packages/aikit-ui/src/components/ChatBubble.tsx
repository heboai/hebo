interface ChatBubbleProps {
  avatarSrc: string;
  message: React.ReactNode;
  isUser?: boolean; // to style differently if needed
}

export function ChatBubble({
  avatarSrc,
  message,
  isUser = false,
}: ChatBubbleProps) {
  return (
    <div
      className={`flex flex-row px-2 py-4 sm:px-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <img
          className="mr-2 flex h-8 w-8 rounded-full sm:mr-4"
          src={avatarSrc}
          alt="avatar"
        />
      )}

      <div
        className={`max-w-3xl rounded-xl p-4 text-sm leading-6 ${
          isUser
            ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-300"
            : "bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-300"
        }`}
      >
        <p>{message}</p>
      </div>

      {isUser && (
        <img
          className="ml-2 flex h-8 w-8 rounded-full sm:ml-4"
          src={avatarSrc}
          alt="avatar"
        />
      )}
    </div>
  );
}
