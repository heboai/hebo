import { useRef, type FormEvent } from "react";

export function APITester() {
  const responseInputRef = useRef<HTMLTextAreaElement>(null);

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const endpoint = formData.get("endpoint") as string;
      const url = new URL(endpoint, location.href);
      const method = formData.get("method") as string;
      const res = await fetch(url, { method });

      const data = await res.json();
      responseInputRef.current!.value = JSON.stringify(data, undefined, 2);
    } catch (error) {
      responseInputRef.current!.value = String(error);
    }
  };

  return (
    <div className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-4 text-left">
      <form
        onSubmit={testEndpoint}
        className="flex w-full items-center gap-2 rounded-xl border-2 border-[#fbf0df] bg-[#1a1a1a] p-3 font-mono transition-colors duration-300 focus-within:border-[#f3d5a3]"
      >
        <select
          name="method"
          className="min-w-0 cursor-pointer appearance-none rounded-lg bg-[#fbf0df] px-3 py-1.5 text-sm font-bold text-[#1a1a1a] transition-colors duration-100 hover:bg-[#f3d5a3]"
        >
          <option value="GET" className="py-1">
            GET
          </option>
          <option value="PUT" className="py-1">
            PUT
          </option>
        </select>
        <input
          type="text"
          name="endpoint"
          defaultValue="/api/hello"
          className="w-full flex-1 border-0 bg-transparent px-2 py-1.5 font-mono text-base text-[#fbf0df] placeholder-[#fbf0df]/40 outline-none focus:text-white"
          placeholder="/api/hello"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-lg border-0 bg-[#fbf0df] px-5 py-1.5 font-bold whitespace-nowrap text-[#1a1a1a] transition-all duration-100 hover:-translate-y-px hover:bg-[#f3d5a3]"
        >
          Send
        </button>
      </form>
      <textarea
        ref={responseInputRef}
        readOnly
        placeholder="Response will appear here..."
        className="min-h-[140px] w-full resize-y rounded-xl border-2 border-[#fbf0df] bg-[#1a1a1a] p-3 font-mono text-[#fbf0df] placeholder-[#fbf0df]/40 focus:border-[#f3d5a3]"
      />
    </div>
  );
}
