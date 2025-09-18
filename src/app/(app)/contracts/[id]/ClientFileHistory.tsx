"use client";

import { useRouter } from "next/navigation";
import FileHistory from "@/components/FileHistory";

export default function ClientFileHistory(
  props: React.ComponentProps<typeof FileHistory>
) {
  const router = useRouter();
  return <FileHistory {...props} onChanged={() => router.refresh()} />;
}

