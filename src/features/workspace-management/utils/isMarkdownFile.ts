export default function isMarkdownFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.md');
}
