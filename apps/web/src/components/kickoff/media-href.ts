/** Strip a CMS `/media/filename` href down to the object key. */
export function mediaFilename(href: string): string {
  return href.replace(/^\/media\//, "").trim();
}

export function hasMedia(href: string): boolean {
  return mediaFilename(href).length > 0;
}
