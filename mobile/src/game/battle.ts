import { drawQuizQuestions, quizCountForLevel } from "@codigdex/game-core/domain/dex/quiz";
import type { MonsterDefinition, QuizQuestion } from "@codigdex/game-core/domain/chapters/types";

export const CAPTURE_PASS_RATE = 0.6;

export function battleQuestions(monster: MonsterDefinition, pool: readonly QuizQuestion[], rng: () => number = Math.random) {
  return drawQuizQuestions(pool, quizCountForLevel(monster.level), rng);
}

export function didPassBattle(correct: number, total: number): boolean {
  return total > 0 && correct / total >= CAPTURE_PASS_RATE;
}

export function battlePercent(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}
