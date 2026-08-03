export function linesToList(v) {
  return v.split('\n').map((s) => s.trim()).filter(Boolean)
}
