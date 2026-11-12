export const NOTE_MAX_LENGTH = 40

export function validateOptionInput(input: { name: string; note?: string }): string | null {
  if (input.name.trim() === '') return 'Give it a name'
  if ((input.note ?? '').trim().length > NOTE_MAX_LENGTH) {
    return `Keep the note to ${NOTE_MAX_LENGTH} characters or fewer`
  }
  return null
}

export function validateTipText(text: string): string | null {
  return text.trim() === '' ? 'Write a tip first' : null
}
