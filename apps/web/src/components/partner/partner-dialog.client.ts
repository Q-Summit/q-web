/**
 * The partner pop-up of the partner logos (PartnerDialog.astro, DESIGN.md
 * PARTNER-1). A tile is a plain link to the partner's website; with this
 * script a plain click or Enter opens the pop-up instead, filled from the
 * tile. A click with a modifier key, or with the middle button, still goes
 * straight to the website. The dialog is native and modal, so the browser
 * keeps focus inside, closes on Escape and returns focus to the tile.
 */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** "https://www.example.com/de/" → "example.com", for the website button. */
function websiteHost(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

export function initPartnerDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLDialogElement>("[data-partner-dialog]");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const part = <T extends HTMLElement>(name: string) =>
    dialog.querySelector<T>(`[data-dialog-${name}]`);
  const tier = part("tier");
  const name = part("name");
  const text = part("text");
  const logo = part<HTMLImageElement>("logo");
  const link = part<HTMLAnchorElement>("link");
  const closeButton = part<HTMLButtonElement>("close");
  const hostLabel = dialog.querySelector<HTMLElement>(
    '[data-dialog-link-label="host"]',
  );
  if (!tier || !name || !text || !logo || !link || !closeButton) return;
  const reduced = window.matchMedia(REDUCED_QUERY);

  const tiles = [...root.querySelectorAll<HTMLAnchorElement>("[data-partner]")];
  for (const tile of tiles) {
    // The tile no longer leaves the page on its own.
    tile.setAttribute("aria-label", tile.dataset.partner ?? "");
    tile.setAttribute("aria-haspopup", "dialog");
  }

  function open(tile: HTMLAnchorElement): void {
    // The real logo of the card (in its own colors), else the mark.
    const image =
      tile.querySelector<HTMLImageElement>(".tier-real") ??
      tile.querySelector<HTMLImageElement>("img");
    const hasLogo = Boolean(image) && !tile.hasAttribute("data-missing");
    tier!.textContent = tile.dataset.partnerTier ?? "";
    name!.textContent = tile.dataset.partner ?? "";
    logo!.hidden = !hasLogo;
    // With a logo on the plate the name stays the dialog's title for
    // screen readers only.
    name!.classList.toggle("u-visually-hidden", hasLogo);
    if (hasLogo && image) {
      // A white logo for the dark page would vanish on the pop-up's white
      // plate; the tile then names the regular logo to show instead.
      const original = tile.dataset.partnerLogo;
      logo!.src = original || image.currentSrc || image.src;
      const width = Number(tile.dataset.partnerLogoWidth) || image.width;
      const height = Number(tile.dataset.partnerLogoHeight) || image.height;
      if (width) logo!.width = width;
      if (height) logo!.height = height;
    } else {
      logo!.removeAttribute("src");
    }
    const description = tile.dataset.partnerDescription?.trim() ?? "";
    text!.textContent = description;
    text!.hidden = description === "";
    const href = tile.getAttribute("href") ?? "";
    link!.href = href;
    link!.hidden = href === "" || href === "#";
    // Without a label from the CMS the button names the website itself.
    if (hostLabel && !link!.hidden) {
      hostLabel.textContent = websiteHost(link!.href);
    }

    // Where it forms from: the tile's middle, seen from the viewport's.
    const box = tile.getBoundingClientRect();
    dialog!.style.setProperty(
      "--from-x",
      `${Math.round(box.left + box.width / 2 - window.innerWidth / 2)}px`,
    );
    dialog!.style.setProperty(
      "--from-y",
      `${Math.round(box.top + box.height / 2 - window.innerHeight / 2)}px`,
    );
    dialog!.classList.remove("is-closing");
    dialog!.showModal();
  }

  function close(): void {
    if (!dialog!.open || dialog!.classList.contains("is-closing")) return;
    if (reduced.matches) {
      dialog!.close();
      return;
    }
    dialog!.classList.add("is-closing");
    const panel = dialog!.querySelector("[data-dialog-panel]");
    const done = () => {
      dialog!.classList.remove("is-closing");
      dialog!.close();
    };
    if (panel) panel.addEventListener("animationend", done, { once: true });
    else done();
  }

  root.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const tile = (event.target as Element).closest<HTMLAnchorElement>(
      "[data-partner]",
    );
    if (!tile || !root.contains(tile) || dialog.contains(tile)) return;
    event.preventDefault();
    open(tile);
  });

  closeButton.addEventListener("click", close);
  // A click on the veil, outside the panel.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  // Escape: run the exit before the browser closes it.
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
}
