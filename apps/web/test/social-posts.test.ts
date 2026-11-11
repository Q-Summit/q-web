import { describe, expect, it } from "vitest";

import { HOME_POST_FRAMES, latestPosts } from "../src/lib/social-posts";

describe("posts on the home page", () => {
  it("shows four posts", () => {
    expect(HOME_POST_FRAMES).toBe(4);
  });

  it("puts the row added last at the far left", () => {
    expect(latestPosts(["first", "second", "third"])).toEqual([
      "third",
      "second",
      "first",
    ]);
  });

  it("moves every post one place right when a new one is added, and drops the oldest", () => {
    const before = ["a", "b", "c", "d"];
    expect(latestPosts(before)).toEqual(["d", "c", "b", "a"]);
    expect(latestPosts([...before, "e"])).toEqual(["e", "d", "c", "b"]);
    expect(latestPosts([...before, "e", "f"])).toEqual(["f", "e", "d", "c"]);
  });

  it("shows fewer posts while the list is short, and none for an empty one", () => {
    expect(latestPosts(["only"])).toEqual(["only"]);
    expect(latestPosts([])).toEqual([]);
  });

  it("leaves the list itself untouched", () => {
    const list = ["a", "b", "c", "d", "e"];
    latestPosts(list);
    expect(list).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("takes another number of frames", () => {
    expect(latestPosts(["a", "b", "c"], 2)).toEqual(["c", "b"]);
    expect(latestPosts(["a", "b", "c"], 0)).toEqual([]);
  });
});
