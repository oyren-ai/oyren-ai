export default function isTexFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.tex');
}
