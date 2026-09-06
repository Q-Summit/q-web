import { EVENTS } from "../../lib/analytics/events";
import type {
  ErstiQuizAnswer,
  ErstiQuizQuestion,
  ErstiQuizResult,
  StudyProgram,
  StudyStep,
} from "./ersti-quiz.config";

interface QuizUi {
  questionLabel: string;
  ofLabel: string;
  backLabel: string;
  nextLabel: string;
  showResultLabel: string;
  placeLabel: string;
  teamLinkLabel: string;
}

interface QuizPayload {
  questions: ErstiQuizQuestion[];
  results: ErstiQuizResult[];
  study: StudyStep & { programs: StudyProgram[] };
  teamOrder: string[];
  ui: QuizUi;
}

interface ScoredResult extends ErstiQuizResult {
  place: number;
  total: number;
  fivePointMatches: number;
  fourPointMatches: number;
}

const MEDALS = ["🥇", "🥈", "🥉"] as const;

function readPayload(root: HTMLElement): QuizPayload | null {
  const node = root.querySelector<HTMLScriptElement>(
    "script[data-quiz-payload]",
  );
  if (!node?.textContent) return null;
  try {
    return JSON.parse(node.textContent) as QuizPayload;
  } catch {
    return null;
  }
}

function scoreAnswers(
  selected: (ErstiQuizAnswer | null)[],
  definitions: ErstiQuizResult[],
  teamOrder: string[],
): ScoredResult[] {
  const tallies = new Map<
    string,
    { total: number; fivePointMatches: number; fourPointMatches: number }
  >();

  for (const answer of selected) {
    if (!answer) continue;
    for (const match of answer.matches) {
      const current = tallies.get(match.team) ?? {
        total: 0,
        fivePointMatches: 0,
        fourPointMatches: 0,
      };
      current.total += match.points;
      if (match.points === 5) current.fivePointMatches += 1;
      if (match.points === 4) current.fourPointMatches += 1;
      tallies.set(match.team, current);
    }
  }

  const byTeam = new Map(definitions.map((result) => [result.team, result]));
  const order = new Map(teamOrder.map((team, index) => [team, index]));

  return [...tallies.entries()]
    .map(([team, score]) => ({
      team,
      lead: byTeam.get(team)?.lead ?? "",
      description: byTeam.get(team)?.description ?? "",
      notionHref: byTeam.get(team)?.notionHref ?? "",
      ...score,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        b.fivePointMatches - a.fivePointMatches ||
        b.fourPointMatches - a.fourPointMatches ||
        (order.get(a.team) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.team) ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, 3)
    .map((item, index) => ({ ...item, place: index + 1 }));
}

function setHidden(el: Element | null, hidden: boolean) {
  if (!el) return;
  if (hidden) el.setAttribute("hidden", "");
  else el.removeAttribute("hidden");
}

function scrollQuizIntoView(target: Element) {
  window.setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

function bindComingSoon(root: HTMLElement) {
  root
    .querySelectorAll<HTMLAnchorElement>("[data-application-cta]")
    .forEach((cta) => {
      if (cta.dataset.applicationBound === "true") return;
      cta.dataset.applicationBound = "true";
      cta.addEventListener("click", (event) => {
        if (cta.dataset.applicationOpen === "true") return;
        event.preventDefault();
        cta.textContent = cta.dataset.comingSoonLabel || "Coming Soon";
        cta.setAttribute("aria-disabled", "true");
        cta.classList.add("is-coming-soon");
      });
    });
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function setUpQuiz(root: HTMLElement) {
  const payload = readPayload(root);
  if (!payload || payload.questions.length === 0) return;

  const { questions, results, study, teamOrder, ui } = payload;
  const startEl = root.querySelector<HTMLElement>("[data-quiz-start]");
  const startButton =
    root.querySelector<HTMLButtonElement>("[data-start-quiz]");
  const cardEl = root.querySelector<HTMLElement>("[data-quiz-card]");
  const resultEl = root.querySelector<HTMLElement>("[data-quiz-result]");
  const kickerEl = root.querySelector<HTMLElement>("[data-question-kicker]");
  const contextEl = root.querySelector<HTMLElement>("[data-question-context]");
  const questionEl = root.querySelector<HTMLElement>("[data-question]");
  const optionsEl = root.querySelector<HTMLElement>("[data-options]");
  const progressFill = root.querySelector<HTMLElement>("[data-progress-fill]");
  const backButton = root.querySelector<HTMLButtonElement>("[data-back]");
  const nextButton = root.querySelector<HTMLButtonElement>("[data-next]");
  const resultList = root.querySelector<HTMLElement>("[data-result-list]");
  const restartButton = root.querySelector<HTMLButtonElement>("[data-restart]");

  if (
    !startEl ||
    !startButton ||
    !cardEl ||
    !resultEl ||
    !kickerEl ||
    !contextEl ||
    !questionEl ||
    !optionsEl ||
    !progressFill ||
    !backButton ||
    !nextButton ||
    !resultList ||
    !restartButton
  ) {
    return;
  }

  bindComingSoon(root);

  const totalSteps = questions.length + 1;
  let currentIndex = 0;
  let selectedStudyProgram = "";
  const selected: (ErstiQuizAnswer | null)[] = new Array(questions.length).fill(
    null,
  );

  function showPanel(name: "start" | "questions" | "results") {
    setHidden(startEl, name !== "start");
    setHidden(cardEl, name !== "questions");
    setHidden(resultEl, name !== "results");
  }

  function setProgress() {
    const percentage = ((currentIndex + 1) / totalSteps) * 100;
    progressFill!.style.width = `${percentage}%`;
  }

  function animateOptions() {
    optionsEl!.classList.remove("is-folding-in");
    void optionsEl!.offsetWidth;
    optionsEl!.classList.add("is-folding-in");
    window.setTimeout(() => {
      optionsEl!.classList.remove("is-folding-in");
    }, 520);
  }

  function renderStudyStep(animate = true) {
    kickerEl!.textContent = study.kicker;
    contextEl!.textContent = study.helper;
    setHidden(contextEl, false);
    questionEl!.textContent = study.question;
    setProgress();
    optionsEl!.replaceChildren();

    const field = document.createElement("div");
    field.className = "quiz-study-field";

    const shell = document.createElement("div");
    shell.className = "quiz-study-search";

    const icon = document.createElement("span");
    icon.className = "quiz-study-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "⌕";

    const input = document.createElement("input");
    input.className = "quiz-study-input";
    input.type = "search";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = study.placeholder;
    input.value = selectedStudyProgram;
    input.setAttribute("aria-label", study.placeholder);
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");

    const chevron = document.createElement("span");
    chevron.className = "quiz-study-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "⌄";

    const list = document.createElement("div");
    list.className = "quiz-study-results";
    list.setAttribute("role", "listbox");
    list.hidden = true;

    const normalizedPrograms = study.programs.map((program) => ({
      program,
      haystack: normalizeSearch([program.label, ...program.aliases].join(" ")),
    }));

    const chooseProgram = (program: StudyProgram) => {
      selectedStudyProgram = program.label;
      input.value = program.label;
      shell.classList.add("is-selected");
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      nextButton!.disabled = false;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    };

    const renderList = (query: string) => {
      const normalizedQuery = normalizeSearch(query);
      const matches = normalizedPrograms
        .filter(({ haystack }) =>
          normalizedQuery ? haystack.includes(normalizedQuery) : true,
        )
        .slice(0, 10);

      list.replaceChildren();

      if (matches.length === 0) {
        const empty = document.createElement("p");
        empty.className = "quiz-study-empty";
        empty.textContent = "No matching study program found.";
        list.append(empty);
      } else {
        for (const { program } of matches) {
          const option = document.createElement("button");
          option.type = "button";
          option.className = "quiz-study-option";
          option.setAttribute("role", "option");
          option.setAttribute(
            "aria-selected",
            String(program.label === selectedStudyProgram),
          );
          option.textContent = program.label;
          option.addEventListener("click", () => chooseProgram(program));
          option.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            const options = Array.from(
              list.querySelectorAll<HTMLButtonElement>(".quiz-study-option"),
            );
            const index = options.indexOf(option);
            const nextIndex =
              event.key === "ArrowDown"
                ? Math.min(options.length - 1, index + 1)
                : Math.max(0, index - 1);
            options[nextIndex]?.focus();
          });
          list.append(option);
        }
      }

      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    };

    input.addEventListener("focus", () => renderList(input.value));
    input.addEventListener("input", () => {
      selectedStudyProgram = "";
      shell.classList.remove("is-selected");
      nextButton!.disabled = true;
      renderList(input.value);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
        return;
      }
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      renderList(input.value);
      list.querySelector<HTMLButtonElement>(".quiz-study-option")?.focus();
    });

    shell.append(icon, input, chevron);
    field.append(shell, list);
    optionsEl!.append(field);

    backButton!.disabled = false;
    nextButton!.textContent = ui.showResultLabel;
    nextButton!.disabled = !selectedStudyProgram;
    if (selectedStudyProgram) shell.classList.add("is-selected");
    if (animate) animateOptions();
  }

  function renderQuestion(animate = true) {
    if (currentIndex === questions.length) {
      renderStudyStep(animate);
      return;
    }

    const question = questions[currentIndex];
    kickerEl!.textContent = question.kicker;
    contextEl!.textContent = question.context ?? "";
    setHidden(contextEl, !question.context);
    questionEl!.textContent = question.question;
    setProgress();

    optionsEl!.replaceChildren();
    question.answers.forEach((answer, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.style.setProperty("--delay", `${index * 65}ms`);
      if (selected[currentIndex]?.id === answer.id) {
        button.classList.add("is-selected");
      }

      const badge = document.createElement("span");
      badge.className = "quiz-option-badge";
      badge.textContent = answer.id;

      const text = document.createElement("span");
      text.className = "quiz-option-text";
      text.textContent = answer.text;

      button.append(badge, text);
      button.addEventListener("click", () => {
        selected[currentIndex] = answer;
        optionsEl!.querySelectorAll(".quiz-option").forEach((option) => {
          option.classList.toggle("is-selected", option === button);
        });
        nextButton!.disabled = false;
      });
      optionsEl!.append(button);
    });

    backButton!.disabled = currentIndex === 0;
    nextButton!.textContent = ui.nextLabel;
    nextButton!.disabled = !selected[currentIndex];

    if (animate) animateOptions();
  }

  function renderResults(top: ScoredResult[]) {
    resultList!.replaceChildren();

    for (const item of top) {
      const card = document.createElement(item.notionHref ? "a" : "article");
      card.className = `result-team result-team--${item.place}`;
      if (item.notionHref) {
        (card as HTMLAnchorElement).href = item.notionHref;
        (card as HTMLAnchorElement).target = "_blank";
        (card as HTMLAnchorElement).rel = "noreferrer";
        card.setAttribute("aria-label", `${item.team}: ${ui.teamLinkLabel}`);
      }

      const place = document.createElement("div");
      place.className = "result-place";
      place.textContent = MEDALS[item.place - 1] ?? String(item.place);

      const copy = document.createElement("div");
      const kicker = document.createElement("p");
      kicker.className = "result-team-kicker";
      kicker.textContent =
        item.place === 1 ? "Perfect Match" : "Also a great fit";

      const heading = document.createElement("h4");
      heading.textContent = item.team;

      const lead = document.createElement("p");
      lead.className = "result-team-lead";
      lead.textContent = item.lead;

      const description = document.createElement("p");
      description.className = "result-team-description";
      description.textContent = item.description;

      copy.append(kicker, heading, lead, description);
      if (item.notionHref) {
        const linkLabel = document.createElement("span");
        linkLabel.className = "result-team-link";
        linkLabel.textContent = ui.teamLinkLabel;
        copy.append(linkLabel);
      }

      card.append(place, copy);
      resultList!.append(card);
    }
  }

  startButton.addEventListener("click", () => {
    startEl.classList.add("is-leaving");
    window.setTimeout(() => {
      currentIndex = 0;
      selected.fill(null);
      selectedStudyProgram = "";
      renderQuestion(true);
      showPanel("questions");
      startEl.classList.remove("is-leaving");
      scrollQuizIntoView(cardEl);
    }, 240);
  });

  backButton.addEventListener("click", () => {
    if (currentIndex === 0) return;
    currentIndex -= 1;
    renderQuestion(true);
  });

  nextButton.addEventListener("click", () => {
    if (currentIndex === questions.length) {
      if (!selectedStudyProgram) return;

      const top = scoreAnswers(selected, results, teamOrder);

      nextButton!.setAttribute("data-ph-event", EVENTS.ersti_quiz_completed);
      nextButton!.setAttribute(
        "data-ph-prop-study-program",
        selectedStudyProgram,
      );
      nextButton!.setAttribute("data-ph-prop-match-1", top[0]?.team ?? "");
      nextButton!.setAttribute("data-ph-prop-match-2", top[1]?.team ?? "");
      nextButton!.setAttribute("data-ph-prop-match-3", top[2]?.team ?? "");

      renderResults(top);
      showPanel("results");
      scrollQuizIntoView(resultEl);
      return;
    }

    if (!selected[currentIndex]) return;
    currentIndex += 1;
    renderQuestion(true);
  });

  restartButton.addEventListener("click", () => {
    selected.fill(null);
    selectedStudyProgram = "";
    currentIndex = 0;
    nextButton.removeAttribute("data-ph-event");
    nextButton.removeAttribute("data-ph-prop-study-program");
    nextButton.removeAttribute("data-ph-prop-match-1");
    nextButton.removeAttribute("data-ph-prop-match-2");
    nextButton.removeAttribute("data-ph-prop-match-3");
    showPanel("start");
    scrollQuizIntoView(startEl);
  });
}

export function initKickoffQuiz(): void {
  document
    .querySelectorAll<HTMLElement>("[data-kickoff-quiz]")
    .forEach(setUpQuiz);
}
