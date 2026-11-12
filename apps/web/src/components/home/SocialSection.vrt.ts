// VRT variants for the home LinkedIn / Instagram section: both profiles
// with the four empty frames (the launch state), one profile only, and a
// long heading. Posts need real media, so the filled state is not a
// variant. See docs/dev/visual-testing.md.
import SocialSection from "./SocialSection.astro";

const social = {
  eyebrow: "Sample eyebrow",
  heading: "Sample social heading",
  intro: "Sample copy about what the two channels show.",
  linkedinLabel: "Follow on sample one",
  instagramLabel: "Follow on sample two",
  posts: [],
};

export default {
  component: SocialSection,
  variants: {
    default: {
      social,
      linkedinHref: "#linkedin",
      instagramHref: "#instagram",
    },
    "one-profile": {
      social,
      linkedinHref: "#linkedin",
    },
    "long-copy": {
      social: {
        ...social,
        heading: "A long sample heading that wraps between the two marks",
        intro:
          "A longer sample introduction that runs over two lines, so the copy between the two glass marks shows how it wraps on every screen.",
      },
      linkedinHref: "#linkedin",
      instagramHref: "#instagram",
    },
  },
};
