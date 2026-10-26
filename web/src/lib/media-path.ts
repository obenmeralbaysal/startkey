/** Site path for a stored image. Absolute and remote values are left unchanged. */
export function absoluteMedia(value: string, directory: string): string {
  const file = value.trim();
  if (file === "" || file.startsWith("/") || file.startsWith("http://") || file.startsWith("https://")) {
    return file;
  }

  return `/media/${directory}/${file.replace(/^\/+/, "")}`;
}
