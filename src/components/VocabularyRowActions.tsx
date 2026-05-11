"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Volume2 } from "lucide-react";

type Props = { wordLemma: string };

export function VocabularyRowActions({ wordLemma }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(wordLemma);
    utter.lang = "en-US";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  const remove = () => {
    if (!confirm(`从生词本移除 "${wordLemma}"？`)) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/vocabulary?wordLemma=${encodeURIComponent(wordLemma)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("删除失败");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button variant="ghost" size="icon" onClick={speak} title="朗读">
        <Volume2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={remove}
        disabled={pending}
        title="移除"
      >
        <Trash2 className="h-4 w-4 text-destructive/70" />
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
