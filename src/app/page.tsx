import { stackServerApp } from "../stack";
import { Footer } from "@/components/auth/Footer";
import HomeContent from "@/components/HomeContent";

export default async function Home() {
  // Protect the page – redirect to /signup if not authenticated
  await stackServerApp.getUser({ or: "redirect" });

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center p-8 pb-20 sm:p-20">
        <HomeContent />
      </main>
      
      <footer className="w-full p-4">
        <Footer />
      </footer>
    </div>
  );
}
