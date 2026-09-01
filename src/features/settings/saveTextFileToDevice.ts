/**
 * Handing a file to the browser.
 *
 * The only DOM-poking in this feature, kept in its own module so the hook above
 * it stays a matter of reads and a pure build. There is no API for "save this
 * text as a file" — the way it is done is still an anchor with a `download`
 * attribute pointed at an object URL and clicked in code, which looks like a
 * trick because it is one.
 *
 * The object URL is revoked afterwards. Without that, the whole bundle stays
 * pinned in memory for the life of the document, which on a phone that never
 * gets closed is not nothing.
 */
export function saveTextFileToDevice(fileName: string, fileContents: string): void {
  const fileBlob = new Blob([fileContents], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(fileBlob);

  const downloadLink = document.createElement('a');

  downloadLink.href = objectUrl;
  downloadLink.download = fileName;

  /*
   * Appended before clicking. A detached anchor works in most browsers and not
   * in all of them, and this is not a thing worth discovering on the one phone
   * the app is used on.
   */
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  URL.revokeObjectURL(objectUrl);
}
