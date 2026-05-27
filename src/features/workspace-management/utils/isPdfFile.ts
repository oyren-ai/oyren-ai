export default function isPdfFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
}
