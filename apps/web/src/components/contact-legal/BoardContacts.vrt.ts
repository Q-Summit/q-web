// VRT variants for BoardContacts. The board photo is a fixed asset baked
// into the component markup (not a prop), so every variant renders it; the
// stress here is the member list and paragraph length, not images.
import BoardContacts from "./BoardContacts.astro";
import type { BoardMember } from "../../lib/content";

const member = (
  overrides: Partial<BoardMember> & Pick<BoardMember, "name">,
): BoardMember => ({
  role: "Board Member",
  email: "board@example.com",
  linkLabel: "Send an email",
  ...overrides,
});

export default {
  component: BoardContacts,
  variants: {
    default: {
      heading: "Meet the board",
      paragraphs: [
        "Our board leads the conference year-round, from partner relations to program curation.",
      ],
      members: [
        member({ name: "Lena Brandt", role: "Chair" }),
        member({ name: "Felix Neumann", role: "Head of Partnerships" }),
        member({ name: "Sophie Krueger", role: "Head of Program" }),
        member({ name: "David Adler", role: "Head of Finance" }),
      ],
    },
    "long-copy": {
      heading: "Meet the board members organizing this year's conference",
      paragraphs: [
        "Our board is a group of student volunteers who spend a full year planning every part of Q-Summit, from the first partner conversation to the closing keynote on stage.",
        "Reach out directly if you have a question about a specific area of the conference; each board member owns one part of the program end to end.",
      ],
      members: [
        member({
          name: "Lena Brandt",
          role: "Chair and Head of Overall Conference Strategy",
          linkLabel: "Send Lena an email about partnerships or press",
        }),
      ],
    },
    empty: {
      heading: "Meet the board",
      paragraphs: ["Board contacts will be published closer to the event."],
      members: [],
    },
  },
};
