import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { DocsButton } from "./DocsButton";
import { Logo } from "@/components/common/Logo";

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left side - Auth Components */}
            <div className="w-full md:w-[38.125%] flex flex-col min-h-screen md:min-h-0 p-6 md:p-8">
                <div className="flex flex-col flex-1">
                    {/* Main Content */}
                    <main className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-full max-w-[400px]">
                            {/* Logo and Title */}
                            <Logo className="mb-2" />

                            {/* Description */}
                            <p className="text-base font-light mb-8">
                                The fastest way to build & scale agents
                            </p>

                            {children}
                            <div className="flex items-center gap-2 mb-2 mt-4">
                                <Image
                                    src="/no-credit-card.svg"
                                    alt="No Credit Card Required"
                                    width={24}
                                    height={24}
                                    priority
                                />
                                <span className="text-base text-left">
                                    No credit card required
                                </span>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Right side - Marketing Message */}
            <aside className="
            hidden md:flex md:w-[61.875%]
            items-center justify-center
            px-[clamp(1.5rem,12vw,15rem)]
            pt-[clamp(2rem,10vh,12.5rem)]
            pb-[clamp(2rem,8vh,10rem)]
            bg-[var(--color-marketing-500)]
            relative
            ">
                <Link
                    href="https://docs.hebo.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-6 right-6"
                >
                    <DocsButton />
                </Link>
                <div className="max-w-[422px] space-y-6 text-left">
                    {/* decorative opening quote */}
                    <div className="relative">
                        <Image
                            src="/quote.png"
                            alt="Decorative Quote"
                            width={50}
                            height={50}
                            className="absolute -top-6 -left-6 select-none pointer-events-none z-0"
                        />
                        <p className="text-gray-500 text-xl font-regular leading-tight relative z-10">
                            The <span className="font-bold text-black">computing power</span> driving advances in <span className="font-bold text-black">generative AI</span> is projected to <span className="font-bold text-black">increase</span> by <span className="font-bold text-black">a millionfold</span> over the next decade.
                        </p>
                    </div>

                    {/* quote author */}
                    <figcaption className="flex items-center justify-left gap-4">
                        <Image src="/huang.png" alt="" width={72} height={72} className="rounded-full" />
                        <div className="text-left">
                            <p className="text-lg text-gray-700">Jensen Huang <br /> CEO Nvidia</p>
                        </div>
                    </figcaption>
                </div>
            </aside>
        </div>
    );
}