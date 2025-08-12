export default function ChatInput() {
  return (
    <form className="flex w-full items-center rounded-md bg-slate-200 p-2 dark:bg-slate-900">
      <label htmlFor="prompt" className="sr-only">
        Enter your prompt
      </label>

      <button
        type="button"
        className="hover:text-blue-600 sm:p-2 dark:text-slate-200 dark:hover:text-blue-600"
        aria-label="Attach file"
      >
        {/* No icon */}
      </button>

      <textarea
        id="prompt"
        rows={1}
        className="mx-2 flex min-h-full w-full rounded-md border border-slate-300 bg-slate-200 p-2 text-base text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none dark:border-slate-300/20 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-400 dark:focus:border-blue-600 dark:focus:ring-blue-600"
        placeholder="Enter your prompt"
      />

      <button
        type="submit"
        className="inline-flex hover:text-blue-600 sm:p-2 dark:text-slate-200 dark:hover:text-blue-600"
        aria-label="Send message"
      >
        {/* No icon */}
      </button>
    </form>
  );
}
