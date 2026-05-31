"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BikesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.toString();
    router.replace(q ? `/?${q}` : "/");
  }, [router, searchParams]);

  return null;
}

export default function BikesPage() {
  return (
    <Suspense fallback={null}>
      <BikesRedirect />
    </Suspense>
  );
}
