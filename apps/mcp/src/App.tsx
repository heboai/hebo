import { APITester } from "./APITester";
import "./index.css";
import logo from "./logo.svg";
import reactLogo from "./react.svg";

export function App() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl p-8 text-center">
      <div className="mb-8 flex items-center justify-center gap-8">
        <img
          src={logo}
          alt="Bun Logo"
          className="h-24 scale-120 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]"
        />
        <img
          src={reactLogo}
          alt="React Logo"
          className="h-24 animate-[spin_20s_linear_infinite] p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa]"
        />
      </div>

      <h1 className="my-4 text-5xl leading-tight font-bold">Bun + React</h1>
      <p>
        Edit{" "}
        <code className="rounded bg-[#1a1a1a] px-2 py-1 font-mono">
          src/App.tsx
        </code>{" "}
        and save to test HMR
      </p>
      <APITester />
    </div>
  );
}

export default App;
