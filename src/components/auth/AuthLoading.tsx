import { Loading } from "@/components/ui/loading"

export function AuthLoading() {
  return (
    <div className="relative min-h-[400px]">
      <Loading size="lg" variant="primary" fullPage />
    </div>
  )
} 