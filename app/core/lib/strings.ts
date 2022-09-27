export function pad (subject: string, width: number, padChar: string) {
  padChar = padChar || '0';
  subject = subject + '';
  if (subject.length >= width) {
    return subject;
  }
  return new Array(width - subject.length + 1).join(padChar) + subject;
}