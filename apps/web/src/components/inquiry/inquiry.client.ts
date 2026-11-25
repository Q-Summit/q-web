/**
 * Partner inquiry form behavior (DESIGN.md INQUIRY-1). Small and dependency
 * free (MOTION-4 is about animation, but the same spirit applies: a form
 * needs no framework).
 *
 *   - `?type=company|media|initiative|speaker` preselects the type tile; an unknown
 *     or missing value selects nothing.
 *   - The topic chips follow the chosen type (lib/partner-inquiry.ts).
 *   - Submit validates the required fields, writes each error as text right
 *     under its field and focuses the first one (which reads its message
 *     aloud through its ARIA description).
 *
 * FRONTEND ONLY: a complete form moves on to the thank-you screen, with a
 * preview of what was filled in ("View your inquiry"). Nothing is sent: no
 * fetch, no mailto, no storage, no analytics event.
 */
import {
  TYPING,
  TYPING_ORDER,
  keystrokeDelay,
  INQUIRY_REQUIRED_FIELDS,
  INQUIRY_TYPE_PARAM,
  inquirySummary,
  parseInquiryType,
  topicsForType,
  validateInquiry,
  type InquiryErrors,
  type InquiryField,
  type InquiryValues,
} from "../../lib/partner-inquiry";

function readValues(form: HTMLFormElement): InquiryValues {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "");
  return {
    type: text("type"),
    topics: data.getAll("topics").map(String),
    name: text("name"),
    email: text("email"),
    message: text("message"),
    consent: data.get("consent") !== null,
  };
}

function isRequiredField(value: string | undefined): value is InquiryField {
  return (INQUIRY_REQUIRED_FIELDS as readonly string[]).includes(value ?? "");
}

/**
 * The thank-you screen: after a complete, valid send the form leaves and the
 * card shows "Thank you" in its place. The card keeps the height the form
 * had, up to a calm cap set in CSS (a long form on a phone would otherwise
 * leave a tall, empty card), and the heading takes focus so a keyboard or
 * screen reader user lands on the message instead of on a control that is
 * gone. The form is only hidden, not reset.
 */
function showThanks(form: HTMLFormElement, values: InquiryValues): void {
  const card = form.closest<HTMLElement>(".inq-card");
  const thanks = card?.querySelector<HTMLElement>("[data-thanks]");
  if (!card || !thanks) return;
  card.style.setProperty("--inq-sent-height", `${card.offsetHeight}px`);
  card.classList.add("is-sent");
  form.hidden = true;
  thanks.hidden = false;
  fillSummary(thanks, values);
  const heading = thanks.querySelector<HTMLElement>("[data-thanks-title]");
  heading?.focus({ preventScroll: true });
  // The card was as tall as the form: bring its top back under the header.
  card.scrollIntoView({ block: "start", behavior: "auto" });
}

/**
 * The preview under the thank-you message: a button that opens and closes a
 * read-only list of what the visitor sent. The list is built with textContent
 * only, so nothing a visitor typed can become markup.
 */
function fillSummary(thanks: HTMLElement, values: InquiryValues): void {
  const list = thanks.querySelector<HTMLElement>("[data-summary-list]");
  const panel = thanks.querySelector<HTMLElement>("[data-summary]");
  const toggle = thanks.querySelector<HTMLButtonElement>(
    "[data-summary-toggle]",
  );
  if (!list || !panel || !toggle) return;
  list.replaceChildren();
  for (const row of inquirySummary(values)) {
    const term = document.createElement("dt");
    term.textContent = row.label;
    const detail = document.createElement("dd");
    detail.textContent = row.value;
    list.append(term, detail);
  }
  panel.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "View your inquiry";
  if (toggle.dataset.wired) return;
  toggle.dataset.wired = "true";
  toggle.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Hide your inquiry" : "View your inquiry";
    if (open) panel.scrollIntoView({ block: "nearest", behavior: "auto" });
  });
}

function initInquiryForm(form: HTMLFormElement): void {
  // Native bubbles would replace our messages; the browser's own checks stay
  // in place for the no-JavaScript case.
  form.noValidate = true;

  const topicList = form.querySelector<HTMLElement>("[data-topics]");
  let attempted = false;

  const wrapper = (field: InquiryField) =>
    form.querySelector<HTMLElement>(`[data-field="${field}"]`);
  const controls = (field: InquiryField) =>
    Array.from(
      form.querySelectorAll<HTMLInputElement>(`input[name="${field}"]`),
    );

  function showError(field: InquiryField, message: string): void {
    const box = wrapper(field);
    const error = box?.querySelector<HTMLElement>("[data-error]");
    const text = error?.querySelector<HTMLElement>("[data-error-text]");
    if (!box || !error || !text) return;
    text.textContent = message;
    error.hidden = false;
    box.classList.add("has-error");
    // Radios sit in a group the fieldset already describes; aria-invalid is
    // not a radio attribute.
    for (const control of controls(field)) {
      if (control.type !== "radio")
        control.setAttribute("aria-invalid", "true");
    }
  }

  function clearError(field: InquiryField): void {
    const box = wrapper(field);
    const error = box?.querySelector<HTMLElement>("[data-error]");
    const text = error?.querySelector<HTMLElement>("[data-error-text]");
    if (!box || !error || !text) return;
    text.textContent = "";
    error.hidden = true;
    box.classList.remove("has-error");
    for (const control of controls(field))
      control.removeAttribute("aria-invalid");
  }

  function render(errors: InquiryErrors, only?: InquiryField): void {
    for (const field of INQUIRY_REQUIRED_FIELDS) {
      if (only && field !== only) continue;
      const message = errors[field];
      if (message) showError(field, message);
      else clearError(field);
    }
  }

  function syncTopics(): void {
    if (!topicList) return;
    const type =
      form.querySelector<HTMLInputElement>('input[name="type"]:checked')
        ?.value ?? null;
    const allowed = topicsForType(type);
    const chips = new Map<string, HTMLElement>();
    for (const chip of topicList.querySelectorAll<HTMLElement>(
      "[data-topic]",
    )) {
      if (chip.dataset.topic) chips.set(chip.dataset.topic, chip);
    }
    // Shown chips follow the type's own order; the rest are hidden and
    // cleared, so a hidden topic is never sent along.
    for (const key of allowed) {
      const chip = chips.get(key);
      if (!chip) continue;
      chip.hidden = false;
      topicList.append(chip);
    }
    for (const [key, chip] of chips) {
      if (allowed.includes(key)) continue;
      chip.hidden = true;
      const input = chip.querySelector<HTMLInputElement>("input");
      if (input) input.checked = false;
    }
  }

  const preset = parseInquiryType(
    new URLSearchParams(window.location.search).get(INQUIRY_TYPE_PARAM),
  );
  if (preset) {
    const radio = form.querySelector<HTMLInputElement>(
      `input[name="type"][value="${preset}"]`,
    );
    if (radio) radio.checked = true;
  }
  syncTopics();

  form.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name === "type") {
      syncTopics();
    }
  });

  // After a first attempt, fix errors as the visitor types: only the field
  // being edited is re-checked, so untouched fields do not light up.
  const recheck = (event: Event) => {
    if (!attempted) return;
    const target = event.target;
    if (!(
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    )) {
      return;
    }
    if (!isRequiredField(target.name)) return;
    const errors = validateInquiry(readValues(form));
    render(errors, target.name);
  };
  form.addEventListener("input", recheck);
  form.addEventListener("change", recheck);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    attempted = true;

    const values = readValues(form);
    const errors = validateInquiry(values);
    render(errors);

    const failed = INQUIRY_REQUIRED_FIELDS.filter((field) => errors[field]);
    const first = failed[0];
    if (first) {
      controls(first)[0]?.focus();
      // Bring the group's label into view too, not just the bare control.
      wrapper(first)?.scrollIntoView({ block: "center", behavior: "auto" });
      return;
    }

    // TODO(backend): hand `values` to whatever receives an inquiry once form
    // handling is decided (owed ADR, architecture/09). Until then nothing is
    // sent: a complete form only moves on to the thank-you screen.
    showThanks(form, values);
    // The details now live only in the preview, not in hidden fields.
    form.reset();
  });
}

/**
 * Example text typing (DESIGN.md INQUIRY-1): the placeholders of the fields
 * ("Jane Doe", "jane@company.com", ...) are typed out once, key by key, field by
 * field. It is the real placeholder that grows, so when the last key lands the
 * text simply is the placeholder, with the same face, size and color as in a
 * browser without JavaScript. No layout moves: the fields have a fixed size.
 *
 * Starts when the fields scroll into view. Stops at once, with every
 * placeholder complete, as soon as the visitor focuses, clicks or types in the
 * form. Reduced motion skips it and shows the full texts from the start.
 */
function initPlaceholderTyping(form: HTMLFormElement): void {
  if (!form.hasAttribute("data-typing-pending")) return;
  const fields = TYPING_ORDER.map((name) =>
    form.elements.namedItem(name),
  ).filter(
    (el): el is HTMLInputElement | HTMLTextAreaElement =>
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement,
  );
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = form.querySelector<HTMLElement>(".inq-fields");
  if (
    reduced ||
    fields.length === 0 ||
    !start ||
    !("IntersectionObserver" in window)
  ) {
    // Until now the CSS kept the texts hidden; show them as they are.
    form.removeAttribute("data-typing-pending");
    return;
  }

  const full = new Map(fields.map((field) => [field, field.placeholder]));
  // A field that already holds a value (autofill, a restored page) shows no
  // placeholder anyway: leave it out.
  const queue = fields.filter((field) => !field.value);
  for (const field of queue) field.placeholder = "";
  form.removeAttribute("data-typing-pending");

  let timer = 0;
  let finished = false;
  const interruptions = ["focusin", "pointerdown", "keydown"] as const;

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    observer.disconnect();
    for (const [field, text] of full) field.placeholder = text;
    for (const type of interruptions) form.removeEventListener(type, finish);
  };
  for (const type of interruptions) form.addEventListener(type, finish);

  let fieldIndex = 0;
  let typed = 0;
  const step = () => {
    if (finished) return;
    const field = queue[fieldIndex];
    if (!field) {
      finish();
      return;
    }
    const text = full.get(field) ?? "";
    if (typed < text.length) {
      typed += 1;
      field.placeholder = text.slice(0, typed);
      timer = window.setTimeout(
        step,
        keystrokeDelay(text.charAt(typed - 1), Math.random()),
      );
    } else {
      fieldIndex += 1;
      typed = 0;
      timer = window.setTimeout(step, TYPING.fieldPauseMs);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      timer = window.setTimeout(step, TYPING.startDelayMs);
    },
    { threshold: 0.35 },
  );
  observer.observe(start);
}

const form = document.querySelector<HTMLFormElement>("[data-inquiry-form]");
if (form) initInquiryForm(form);
if (form) initPlaceholderTyping(form);
