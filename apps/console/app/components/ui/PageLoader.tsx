import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

export function PageLoader() {
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => {
        setProgress(100);
        const r = setTimeout(() => setProgress(0), 400);
        return () => clearTimeout(r);
      });
      return () => clearTimeout(t);
    }

    const id = setInterval(() => {
      // eslint-disable-next-line sonarjs/pseudo-random
      setProgress((p) => Math.min(p + Math.random() * 10, 90));
    }, 200);

    return () => clearInterval(id);
  }, [isLoading]);

  return (
    <div
      className="fixed top-0 left-0 h-[2px] bg-blue-200 transition-all duration-300 ease-out"
      style={{ width: `${progress}%`, opacity: progress === 0 ? 0 : 1 }}
    />
  );
}
