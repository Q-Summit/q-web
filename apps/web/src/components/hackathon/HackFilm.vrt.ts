// VRT variants for HackFilm. The gallery renders the static (unpinned) state,
// so this covers the laptop with the first photo and the grid of the rest:
// a full five-photo reel and a single photo (no grid). Photos are swapped for
// placeholders by the spec. See docs/dev/visual-testing.md.
import HackFilm from "./HackFilm.astro";
import { pastPhotos } from "../../assets/media/hackathon";

export default {
  component: HackFilm,
  variants: {
    default: {
      heading: "A glimpse into past Q-Hack events",
      photos: [
        pastPhotos.hallOverview,
        pastPhotos.laptopWork,
        pastPhotos.hallProjection,
        pastPhotos.audience,
        pastPhotos.prizeConfetti,
      ],
    },
    "single-photo": {
      heading: "A glimpse into past Q-Hack events",
      photos: [pastPhotos.hallOverview],
    },
  },
};
