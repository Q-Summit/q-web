import { describe, expect, it } from "vitest";
import { breadcrumbLd } from "../src/lib/seo";

describe("breadcrumbLd", () => {
  it("numbers the trail and makes URLs absolute", () => {
    const ld = breadcrumbLd("https://q-summit.com", [
      { name: "Home", path: "/" },
      { name: "Startups", path: "/whyq/startups/" },
    ]);
    expect(ld).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://q-summit.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Startups",
          item: "https://q-summit.com/whyq/startups/",
        },
      ],
    });
  });
});
