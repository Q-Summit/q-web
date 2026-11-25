// VRT variants for PersonPhoto. Covers the initials placeholder (no file,
// the fixture sentinel), a /media file that is missing locally (falls back
// to the initials), and a single-word name.
import PersonPhoto from "./PersonPhoto.astro";

const base = { widths: [160, 320], sizes: "10rem" };

export default {
  component: PersonPhoto,
  variants: {
    initials: { ...base, name: "Example Contact" },
    "fixture-sentinel": {
      ...base,
      name: "Sample Person",
      filename: "fixture-missing-photo.webp",
    },
    "missing-file": {
      ...base,
      name: "Robin Placeholder",
      filename: "example-portrait-not-in-git.jpg",
    },
    "single-name": { ...base, name: "Kim" },
  },
};
