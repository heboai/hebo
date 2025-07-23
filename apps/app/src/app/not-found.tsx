import { Logo } from "~/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-center space-y-8 p-4">
      
        <Logo />
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

    </div>
  );
} 
