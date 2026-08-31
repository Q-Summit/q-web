import type {
  KickoffQuizAnswer,
  KickoffQuizQuestion,
  KickoffQuizResult,
} from "../../lib/content";

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
  questions: KickoffQuizQuestion[];
  results: KickoffQuizResult[];
  ui: QuizUi;
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
  selected: (KickoffQuizAnswer | null)[],
  definitions: KickoffQuizResult[],
): Array<KickoffQuizResult & { place: number }> {
  const tallies = new Map<string, number>();
  for (const answer of selected) {
    if (!answer) continue;
    for (const tag of answer.tags) {
      tallies.set(tag, (tallies.get(tag) ?? 0) + 1);
    }
  }

  const byTeam = new Map(definitions.map((result) => [result.team, result]));
  return [...tallies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([team], index) => ({
      team,
      text: byTeam.get(team)?.text ?? "",
      notionHref: byTeam.get(team)?.notionHref ?? "",
      place: index + 1,
    }));
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

function setUpQuiz(root: HTMLElement) {
  const payload = readPayload(root);
  if (!payload || payload.questions.length === 0) return;

  const { questions, results, ui } = payload;
  const startEl = root.querySelector<HTMLElement>("[data-quiz-start]");
  const startButton =
    root.querySelector<HTMLButtonElement>("[data-start-quiz]");
  const cardEl = root.querySelector<HTMLElement>("[data-quiz-card]");
  const resultEl = root.querySelector<HTMLElement>("[data-quiz-result]");
  const kickerEl = root.querySelector<HTMLElement>("[data-question-kicker]");
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

  let currentIndex = 0;
  const selected: (KickoffQuizAnswer | null)[] = new Array(
    questions.length,
  ).fill(null);

  function showPanel(name: "start" | "questions" | "results") {
    setHidden(startEl, name !== "start");
    setHidden(cardEl, name !== "questions");
    setHidden(resultEl, name !== "results");
  }

  function renderQuestion(animate = true) {
    const question = questions[currentIndex];
    kickerEl!.textContent = question.kicker;
    questionEl!.textContent = question.question;
    const percentage = ((currentIndex + 1) / questions.length) * 100;
    progressFill!.style.width = `${percentage}%`;

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
    nextButton!.textContent =
      currentIndex === questions.length - 1 ? ui.showResultLabel : ui.nextLabel;
    nextButton!.disabled = !selected[currentIndex];

    if (animate) {
      optionsEl!.classList.remove("is-folding-in");
      void optionsEl!.offsetWidth;
      optionsEl!.classList.add("is-folding-in");
      window.setTimeout(() => {
        optionsEl!.classList.remove("is-folding-in");
      }, 520);
    }
  }

  function renderResults() {
    const top = scoreAnswers(selected, results);
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
      kicker.textContent = `${ui.placeLabel} ${item.place}`;

      const heading = document.createElement("h4");
      heading.textContent = item.team;

      const description = document.createElement("p");
      description.textContent = item.text;

      copy.append(kicker, heading, description);
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
    if (!selected[currentIndex]) return;
    if (currentIndex === questions.length - 1) {
      renderResults();
      showPanel("results");
      scrollQuizIntoView(resultEl);
      return;
    }
    currentIndex += 1;
    renderQuestion(true);
  });

  restartButton.addEventListener("click", () => {
    selected.fill(null);
    currentIndex = 0;
    showPanel("start");
    scrollQuizIntoView(startEl);
  });
}

export function initKickoffQuiz(): void {
  document
    .querySelectorAll<HTMLElement>("[data-kickoff-quiz]")
    .forEach(setUpQuiz);
}
