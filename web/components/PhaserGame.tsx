"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@codigdex/game-core/i18n/locale";
import { devicePixelsPerGamePixel, imageRenderingFor } from "@/lib/phaser/displayScale";
import { LOCALE_CHANGE_EVENT } from "@/lib/phaser/i18nEvents";

const ACCESSIBLE_COPY: Readonly<
  Record<Locale, { label: string; controls: string; loading: string; ready: string; failed: string }>
> = {
  ko: {
    label: "코딩덱스 코딩 교육 게임",
    controls: "Enter 또는 Space로 시작하고, 방향키나 WASD로 이동합니다.",
    loading: "게임을 불러오는 중입니다.",
    ready: "게임을 시작할 준비가 되었습니다.",
    failed: "게임을 불러오지 못했습니다.",
  },
  en: {
    label: "Codigdex coding education game",
    controls: "Press Enter or Space to start, then move with the arrow keys or WASD.",
    loading: "Loading the game.",
    ready: "The game is ready to play.",
    failed: "The game could not be loaded.",
  },
};

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [bootState, setBootState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const onLocaleChange = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (isLocale(next)) setLocale(next);
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;

    // Phaser's FIT mode sizes the canvas box to the container; pick the
    // interpolation that stays even at whatever scale that works out to.
    const syncRendering = () => {
      const canvas = gameRef.current?.canvas;
      if (!canvas) return;
      const scale = devicePixelsPerGamePixel(
        canvas.getBoundingClientRect().width,
        window.devicePixelRatio,
        canvas.width
      );
      canvas.style.imageRendering = imageRenderingFor(scale);
    };

    async function boot() {
      const [{ default: PhaserLib }, { createGameConfig }] = await Promise.all([
        import("phaser"),
        import("@/lib/phaser/config"),
      ]);
      if (cancelled || !containerRef.current) return;
      const game = new PhaserLib.Game(createGameConfig(containerRef.current));
      gameRef.current = game;
      game.events.once(PhaserLib.Core.Events.READY, () => {
        if (cancelled || !containerRef.current) return;
        setBootState("ready");
        observer = new ResizeObserver(() => {
          game.scale.refresh();
          syncRendering();
        });
        observer.observe(containerRef.current);
        game.scale.refresh();
        syncRendering();
      });
    }

    boot().catch((err) => {
      console.error("[PhaserGame] boot failed", err);
      if (!cancelled) setBootState("failed");
    });
    // Browser zoom and moving between monitors change the pixel ratio without
    // necessarily resizing the canvas box.
    window.addEventListener("resize", syncRendering);

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener("resize", syncRendering);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const copy = ACCESSIBLE_COPY[locale];
  const status = bootState === "ready" ? copy.ready : bootState === "failed" ? copy.failed : copy.loading;

  return (
    <>
      <div
        ref={containerRef}
        className="pixel-canvas mx-auto"
        role="application"
        tabIndex={0}
        aria-label={copy.label}
        aria-describedby="codigdex-controls codigdex-status"
        aria-busy={bootState === "loading"}
      />
      <p id="codigdex-controls" className="sr-only">
        {copy.controls}
      </p>
      <p id="codigdex-status" className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </>
  );
}
