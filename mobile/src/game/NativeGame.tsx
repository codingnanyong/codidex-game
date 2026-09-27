import { CHAPTERS, DEX_MONSTERS, chapterStatus, stageStatus } from "@codigdex/game-content/domain/chapters";
import type { MonsterDefinition, QuizQuestion } from "@codigdex/game-core/domain/chapters/types";
import { localize } from "@codigdex/game-core/i18n/locale";
import { loadQuizPack } from "@codigdex/quiz-content";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { mobileAssetSource } from "@/assets";
import { useSave } from "@/state/SaveProvider";
import { PixelButton } from "@/ui/PixelButton";
import { Screen } from "@/ui/Screen";
import { colors, font } from "@/ui/theme";
import { battlePercent, battleQuestions, didPassBattle } from "./battle";
import { DPad } from "./DPad";
import { WorldCanvas, type WorldPosition } from "./WorldCanvas";

type Route = "title" | "world" | "battle" | "result" | "dex" | "settings";

interface BattleResult { correct: number; monster: MonsterDefinition; total: number; passed: boolean }

export function NativeGame() {
  const { capture, hydrated, locale, save } = useSave();
  const [route, setRoute] = useState<Route>("title");
  const [monster, setMonster] = useState<MonsterDefinition>(() => CHAPTERS[0].stages[0]);
  const [result, setResult] = useState<BattleResult>();

  if (!hydrated) {
    return <Screen><View style={styles.loading}><ActivityIndicator color={colors.cyan} /><Text style={styles.muted}>SAVE DATA LOADING</Text></View></Screen>;
  }

  if (route === "title") return <TitleScreen onDex={() => setRoute("dex")} onPlay={() => setRoute("world")} onSettings={() => setRoute("settings")} />;
  if (route === "world") return <WorldScreen onBack={() => setRoute("title")} onBattle={(next) => { setMonster(next); setRoute("battle"); }} onDex={() => setRoute("dex")} />;
  if (route === "dex") return <DexScreen onBack={() => setRoute("title")} />;
  if (route === "settings") return <SettingsScreen onBack={() => setRoute("title")} />;
  if (route === "battle") {
    return <BattleScreen monster={monster} onExit={() => setRoute("world")} onFinish={(correct, total) => {
      const passed = didPassBattle(correct, total);
      if (passed) capture(monster.id);
      setResult({ correct, monster, passed, total });
      setRoute("result");
    }} />;
  }
  return <ResultScreen result={result!} onDex={() => setRoute("dex")} onWorld={() => setRoute("world")} />;
}

function TitleScreen({ onDex, onPlay, onSettings }: { onDex(): void; onPlay(): void; onSettings(): void }) {
  const { locale, save } = useSave();
  const ko = locale === "ko";
  return (
    <Screen>
      <View style={styles.titleLayout}>
        <View style={styles.titleMark}><Text style={styles.titleMarkText}>{"{ }"}</Text></View>
        <View style={styles.titleCopy}>
          <Text style={styles.kicker}>NATIVE CODING ADVENTURE</Text>
          <Text accessibilityRole="header" style={styles.logo}>CODIGDEX</Text>
          <Text style={styles.subtitle}>{ko ? "코드로 버그를 잡고 지식을 수집하세요" : "Catch bugs with code and collect knowledge"}</Text>
          <Text style={styles.muted}>{ko ? `포획 ${save.progress.captures.length}마리 · React Native + Skia` : `${save.progress.captures.length} captured · React Native + Skia`}</Text>
        </View>
        <View style={styles.titleActions}>
          <PixelButton onPress={onPlay}>{ko ? "게임 시작" : "PLAY"}</PixelButton>
          <PixelButton onPress={onDex} variant="secondary">{ko ? "코디덱스" : "CODIGDEX"}</PixelButton>
          <PixelButton compact onPress={onSettings} variant="quiet">{ko ? "설정" : "SETTINGS"}</PixelButton>
        </View>
      </View>
    </Screen>
  );
}

function WorldScreen({ onBack, onBattle, onDex }: { onBack(): void; onBattle(monster: MonsterDefinition): void; onDex(): void }) {
  const { height, width } = useWindowDimensions();
  const { locale, save } = useSave();
  const captured = useMemo(() => new Set(save.progress.captures.map(({ id }) => id)), [save.progress.captures]);
  const available = CHAPTERS.flatMap((chapter) => chapter.stages.map((stage, index) => ({ chapter, stage, status: stageStatus(chapter, index, captured) })))
    .find(({ status }) => status === "available") ?? { chapter: CHAPTERS.at(-1)!, stage: CHAPTERS.at(-1)!.stages.at(-1)!, status: "cleared" as const };
  const [position, setPosition] = useState<WorldPosition>({ x: 0.2, y: 0.5 });
  const canvasWidth = Math.max(360, width * 0.62);
  const canvasHeight = Math.max(190, height - 120);
  const nearQuest = Math.abs(position.x - 0.83) < 0.16 && Math.abs(position.y - 0.5) < 0.2;
  const ko = locale === "ko";
  return (
    <Screen>
      <View style={styles.topbar}>
        <PixelButton compact onPress={onBack} variant="quiet">← {ko ? "메뉴" : "MENU"}</PixelButton>
        <Text style={styles.topbarTitle}>{localize(available.chapter.place, locale)}</Text>
        <PixelButton compact onPress={onDex} variant="secondary">{ko ? "도감" : "DEX"}</PixelButton>
      </View>
      <View style={styles.worldLayout}>
        <WorldCanvas height={canvasHeight} position={position} width={canvasWidth} />
        <View style={styles.worldHud}>
          <Text style={styles.kicker}>{available.chapter.label}</Text>
          <Text style={styles.hudTitle}>{localize(available.stage.name, locale)}</Text>
          <Text style={styles.body}>{localize(available.stage.briefing, locale)}</Text>
          <View style={styles.hudSpacer} />
          <DPad onMove={(delta) => setPosition((current) => ({
            x: Math.min(0.94, Math.max(0.06, current.x + delta.x)),
            y: Math.min(0.88, Math.max(0.12, current.y + delta.y)),
          }))} />
          <Text style={styles.hint}>{nearQuest ? (ko ? "의뢰 지점에 도착했습니다!" : "Quest marker reached!") : (ko ? "방향키로 빛나는 표식까지 이동하세요" : "Move to the glowing marker")}</Text>
          <PixelButton disabled={!nearQuest} onPress={() => onBattle(available.stage)}>{ko ? "배틀 시작" : "START BATTLE"}</PixelButton>
        </View>
      </View>
    </Screen>
  );
}

function BattleScreen({ monster, onExit, onFinish }: { monster: MonsterDefinition; onExit(): void; onFinish(correct: number, total: number): void }) {
  const { locale } = useSave();
  const [questions, setQuestions] = useState<readonly QuizQuestion[]>();
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<string>();
  const ko = locale === "ko";

  useEffect(() => {
    let active = true;
    void loadQuizPack(monster.quizPackId).then((pack) => {
      if (active) setQuestions(battleQuestions(monster, pack.questions));
    });
    return () => { active = false; };
  }, [monster]);

  if (!questions) return <Screen><View style={styles.loading}><ActivityIndicator color={colors.cyan} /><Text style={styles.muted}>{ko ? "문제 불러오는 중" : "LOADING QUIZ"}</Text></View></Screen>;
  const question = questions[index];
  return (
    <Screen>
      <View style={styles.topbar}>
        <PixelButton compact onPress={onExit} variant="quiet">× {ko ? "나가기" : "EXIT"}</PixelButton>
        <Text style={styles.topbarTitle}>BATTLE {index + 1}/{questions.length}</Text>
        <Text style={styles.score}>{ko ? "정답" : "SCORE"} {correct}</Text>
      </View>
      <View style={styles.battleLayout}>
        <View style={styles.monsterPanel}>
          <Image accessibilityLabel={localize(monster.name, locale)} resizeMode="contain" source={mobileAssetSource(monster.assetKey)} style={styles.battleMonster} />
          <Text style={styles.hudTitle}>{localize(monster.name, locale)}</Text>
          <Text style={styles.muted}>LV.{monster.level} · {localize(monster.classification, locale)}</Text>
        </View>
        <View style={styles.quizPanel}>
          <Text style={styles.kicker}>CODE QUIZ</Text>
          <Text style={styles.question}>{localize(question.prompt, locale)}</Text>
          <View style={styles.answers}>
            {question.choices.map((choice, choiceIndex) => (
              <Pressable
                accessibilityRole="button"
                disabled={locked}
                key={`${index}-${choiceIndex}`}
                onPress={() => answer(choiceIndex)}
                style={({ pressed }) => [styles.answer, pressed && styles.answerPressed, locked && styles.answerLocked]}
              >
                <Text style={styles.answerKey}>{String.fromCharCode(65 + choiceIndex)}</Text>
                <Text style={styles.answerText}>{localize(choice, locale)}</Text>
              </Pressable>
            ))}
          </View>
          {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, feedback === "CORRECT" || feedback === "정답!" ? styles.correct : styles.wrong]}>{feedback}</Text> : null}
        </View>
      </View>
    </Screen>
  );

  function answer(choiceIndex: number) {
    if (locked || !questions) return;
    const hit = choiceIndex === question.answerIndex;
    const nextCorrect = correct + (hit ? 1 : 0);
    setCorrect(nextCorrect);
    setLocked(true);
    setFeedback(hit ? (ko ? "정답!" : "CORRECT") : (ko ? "오답" : "MISS"));
    setTimeout(() => {
      if (index + 1 >= questions.length) onFinish(nextCorrect, questions.length);
      else {
        setIndex((current) => current + 1);
        setFeedback(undefined);
        setLocked(false);
      }
    }, 550);
  }
}

function ResultScreen({ onDex, onWorld, result }: { onDex(): void; onWorld(): void; result: BattleResult }) {
  const { locale } = useSave();
  const ko = locale === "ko";
  return (
    <Screen>
      <View style={styles.resultLayout}>
        <Image resizeMode="contain" source={mobileAssetSource(result.monster.assetKey)} style={styles.resultMonster} />
        <View style={styles.resultCopy}>
          <Text style={[styles.resultGrade, result.passed ? styles.correct : styles.wrong]}>{result.passed ? (ko ? "포획 성공" : "CAPTURED") : (ko ? "재도전" : "TRY AGAIN")}</Text>
          <Text style={styles.logo}>{battlePercent(result.correct, result.total)}%</Text>
          <Text style={styles.body}>{result.correct}/{result.total} · {localize(result.monster.name, locale)}</Text>
          <Text style={styles.muted}>{result.passed ? (ko ? "코디덱스에 새 카드가 등록되었습니다." : "A new card was registered.") : (ko ? "60% 이상 맞히면 포획할 수 있습니다." : "Score at least 60% to capture it.")}</Text>
        </View>
        <View style={styles.titleActions}>
          <PixelButton onPress={onWorld}>{ko ? "월드로" : "WORLD"}</PixelButton>
          <PixelButton onPress={onDex} variant="secondary">{ko ? "도감 보기" : "OPEN DEX"}</PixelButton>
        </View>
      </View>
    </Screen>
  );
}

function DexScreen({ onBack }: { onBack(): void }) {
  const { locale, save } = useSave();
  const captured = useMemo(() => new Set(save.progress.captures.map(({ id }) => id)), [save.progress.captures]);
  const ko = locale === "ko";
  return (
    <Screen>
      <View style={styles.topbar}><PixelButton compact onPress={onBack} variant="quiet">← {ko ? "메뉴" : "MENU"}</PixelButton><Text style={styles.topbarTitle}>CODIGDEX · {captured.size}/{DEX_MONSTERS.length}</Text><View style={styles.topbarGap} /></View>
      <ScrollView contentContainerStyle={styles.dexGrid}>
        {DEX_MONSTERS.map((entry) => {
          const unlocked = captured.has(entry.id);
          return (
            <View key={entry.id} style={[styles.dexCard, unlocked && styles.dexCardCaptured]}>
              <Text style={styles.number}>NO.{entry.dexNumber}</Text>
              {unlocked ? <Image resizeMode="contain" source={mobileAssetSource(entry.assetKey)} style={styles.dexMonster} /> : <View style={styles.dexUnknown}><Text style={styles.dexQuestion}>?</Text></View>}
              <Text numberOfLines={1} style={styles.dexName}>{unlocked ? localize(entry.name, locale) : "???"}</Text>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

function SettingsScreen({ onBack }: { onBack(): void }) {
  const { clearProgress, locale, setLocale } = useSave();
  const ko = locale === "ko";
  return (
    <Screen>
      <View style={styles.topbar}><PixelButton compact onPress={onBack} variant="quiet">← {ko ? "메뉴" : "MENU"}</PixelButton><Text style={styles.topbarTitle}>{ko ? "설정" : "SETTINGS"}</Text><View style={styles.topbarGap} /></View>
      <View style={styles.settingsPanel}>
        <Text style={styles.hudTitle}>{ko ? "언어" : "LANGUAGE"}</Text>
        <View style={styles.settingsRow}>
          <PixelButton onPress={() => setLocale("ko")} variant={locale === "ko" ? "primary" : "secondary"}>한국어</PixelButton>
          <PixelButton onPress={() => setLocale("en")} variant={locale === "en" ? "primary" : "secondary"}>English</PixelButton>
        </View>
        <Text style={styles.hudTitle}>{ko ? "저장 데이터" : "SAVE DATA"}</Text>
        <PixelButton onPress={clearProgress} variant="danger">{ko ? "진행도 초기화" : "RESET PROGRESS"}</PixelButton>
        <Text style={styles.hint}>{ko ? "게임 진행도는 기기에 자동 저장됩니다." : "Progress is saved automatically on this device."}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", flex: 1, gap: 16, justifyContent: "center" },
  muted: { color: colors.muted, fontFamily: font, fontSize: 11, lineHeight: 17, textAlign: "center" },
  titleLayout: { alignItems: "center", flex: 1, flexDirection: "row", gap: 34, justifyContent: "center" },
  titleMark: { alignItems: "center", backgroundColor: colors.panelRaised, borderColor: colors.cyan, borderRadius: 22, borderWidth: 3, height: 150, justifyContent: "center", transform: [{ rotate: "3deg" }], width: 150 },
  titleMarkText: { color: colors.cyan, fontFamily: font, fontSize: 38, fontWeight: "900" },
  titleCopy: { maxWidth: 390 },
  titleActions: { gap: 10, minWidth: 180 },
  kicker: { color: colors.cyan, fontFamily: font, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
  logo: { color: colors.text, fontFamily: font, fontSize: 38, fontWeight: "900", letterSpacing: 3, marginVertical: 8 },
  subtitle: { color: colors.blue, fontFamily: font, fontSize: 15, lineHeight: 22, marginBottom: 13 },
  topbar: { alignItems: "center", flexDirection: "row", height: 52, justifyContent: "space-between" },
  topbarTitle: { color: colors.text, fontFamily: font, fontSize: 15, fontWeight: "800" },
  topbarGap: { width: 90 },
  worldLayout: { flex: 1, flexDirection: "row", gap: 14 },
  worldHud: { backgroundColor: colors.panel, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flex: 1, padding: 14 },
  hudTitle: { color: colors.text, fontFamily: font, fontSize: 17, fontWeight: "800", marginVertical: 7 },
  body: { color: colors.text, fontFamily: font, fontSize: 11, lineHeight: 17 },
  hudSpacer: { flex: 1 },
  hint: { color: colors.amber, fontFamily: font, fontSize: 9, lineHeight: 14, marginVertical: 8, textAlign: "center" },
  battleLayout: { flex: 1, flexDirection: "row", gap: 16 },
  monsterPanel: { alignItems: "center", backgroundColor: colors.panel, borderColor: colors.border, borderRadius: 14, borderWidth: 1, justifyContent: "center", width: "34%" },
  battleMonster: { height: 190, width: 190 },
  quizPanel: { backgroundColor: colors.panel, borderColor: colors.cyan, borderRadius: 14, borderWidth: 1, flex: 1, padding: 18 },
  question: { color: colors.text, fontFamily: font, fontSize: 16, fontWeight: "700", lineHeight: 23, marginBottom: 14, marginTop: 9 },
  answers: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  answer: { alignItems: "center", backgroundColor: colors.panelRaised, borderColor: colors.border, borderRadius: 9, borderWidth: 1, flexDirection: "row", minHeight: 54, padding: 10, width: "48%" },
  answerPressed: { borderColor: colors.cyan, transform: [{ translateY: 2 }] },
  answerLocked: { opacity: 0.6 },
  answerKey: { color: colors.cyan, fontFamily: font, fontSize: 15, fontWeight: "900", marginRight: 10 },
  answerText: { color: colors.text, flex: 1, fontFamily: font, fontSize: 11, lineHeight: 16 },
  feedback: { fontFamily: font, fontSize: 14, fontWeight: "900", textAlign: "right" },
  correct: { color: colors.cyan },
  wrong: { color: colors.danger },
  score: { color: colors.amber, fontFamily: font, fontSize: 12, fontWeight: "800" },
  resultLayout: { alignItems: "center", flex: 1, flexDirection: "row", gap: 32, justifyContent: "center" },
  resultMonster: { height: 220, width: 220 },
  resultCopy: { maxWidth: 330 },
  resultGrade: { fontFamily: font, fontSize: 18, fontWeight: "900", letterSpacing: 2 },
  dexGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", paddingBottom: 24 },
  dexCard: { backgroundColor: colors.panel, borderColor: colors.border, borderRadius: 10, borderWidth: 1, padding: 8, width: 128 },
  dexCardCaptured: { borderColor: colors.cyan },
  number: { color: colors.blue, fontFamily: font, fontSize: 8 },
  dexMonster: { height: 84, width: "100%" },
  dexUnknown: { alignItems: "center", height: 84, justifyContent: "center" },
  dexQuestion: { color: colors.border, fontFamily: font, fontSize: 38 },
  dexName: { color: colors.text, fontFamily: font, fontSize: 10, fontWeight: "700", textAlign: "center" },
  settingsPanel: { alignSelf: "center", backgroundColor: colors.panel, borderColor: colors.border, borderRadius: 14, borderWidth: 1, gap: 14, marginTop: 24, maxWidth: 520, padding: 22, width: "80%" },
  settingsRow: { flexDirection: "row", gap: 12 },
});
