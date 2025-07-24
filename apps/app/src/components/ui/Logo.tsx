import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/hebo-icon.png"
        alt="Hebo AI Logo"
        width={32}
        height={32}
        priority
      />
      <span className="text-lg font-semibold">hebo.ai</span>
    </div>
  );
}
