export function toUnixTimestamp(date: Date) {
  return Math.floor(date.getTime() / 1000);
}