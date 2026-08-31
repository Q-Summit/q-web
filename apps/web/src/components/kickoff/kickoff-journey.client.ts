/** Native scroll-snap album: active card, arrows, range slider. */
function setUpJourney(shell: HTMLElement) {
  const album = shell.querySelector<HTMLElement>("[data-album]");
  const cards = album?.querySelectorAll<HTMLElement>("[data-album-card]");
  const prev = shell.querySelector<HTMLButtonElement>("[data-album-prev]");
  const next = shell.querySelector<HTMLButtonElement>("[data-album-next]");
  const range =
    shell.parentElement?.querySelector<HTMLInputElement>("[data-album-range]");

  if (!album || !cards?.length) return;

  let syncingRange = false;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const maxScroll = () => Math.max(0, album.scrollWidth - album.clientWidth);

  const setActiveCards = () => {
    const albumRect = album.getBoundingClientRect();
    const albumCenter = albumRect.left + albumRect.width / 2;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(albumCenter - cardCenter);
      const maxDistance = albumRect.width * 0.62;
      const isActive =
        cardRect.right > albumRect.left &&
        cardRect.left < albumRect.right &&
        distance < maxDistance;
      card.classList.toggle("is-active", isActive);
    });

    const limit = maxScroll();
    const percentage = limit > 0 ? (album.scrollLeft / limit) * 100 : 0;
    if (range && !syncingRange) range.value = String(percentage);

    if (prev) prev.disabled = album.scrollLeft <= 2;
    if (next) next.disabled = album.scrollLeft >= limit - 2;
  };

  const scrollOneCard = (direction: number) => {
    const firstCard = cards[0];
    const styles = window.getComputedStyle(album);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const distance = firstCard.getBoundingClientRect().width + gap;
    album.scrollBy({
      left: direction * distance,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  prev?.addEventListener("click", () => scrollOneCard(-1));
  next?.addEventListener("click", () => scrollOneCard(1));

  let drag: { pointerId: number; startX: number; startScroll: number } | null =
    null;

  album.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    if ((event.target as HTMLElement).closest("button, a, input")) return;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: album.scrollLeft,
    };
    album.setPointerCapture(event.pointerId);
    album.classList.add("is-dragging");
  });

  album.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    album.scrollLeft = drag.startScroll - (event.clientX - drag.startX);
  });

  const endDrag = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag = null;
    album.classList.remove("is-dragging");
  };

  album.addEventListener("pointerup", endDrag);
  album.addEventListener("pointercancel", endDrag);

  range?.addEventListener("input", () => {
    syncingRange = true;
    album.scrollLeft = (Number(range.value) / 100) * maxScroll();
    window.requestAnimationFrame(() => {
      syncingRange = false;
      setActiveCards();
    });
  });

  setActiveCards();
  album.addEventListener(
    "scroll",
    () => window.requestAnimationFrame(setActiveCards),
    { passive: true },
  );
  window.addEventListener("resize", setActiveCards, { passive: true });
}

export function initKickoffJourney(): void {
  if (document.documentElement.hasAttribute("data-vrt")) return;
  document
    .querySelectorAll<HTMLElement>("[data-kickoff-journey]")
    .forEach(setUpJourney);
}
