import { Loading } from "@hebo/ui"

export default function LoadingPage() {
  // Stack uses React Suspense, which will render this page while user data is being fetched.
  // See: https://nextjs.org/docs/app/api-reference/file-conventions/loading
  return (
    <div className="relative min-h-[200px]">
      <Loading size="md" variant="primary" fullPage />
    </div>
  );
}
