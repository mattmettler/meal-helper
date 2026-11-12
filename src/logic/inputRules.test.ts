import { NOTE_MAX_LENGTH, validateOptionInput, validateTipText } from './inputRules'

describe('validateOptionInput', () => {
  it('rejects a blank name', () => {
    expect(validateOptionInput({ name: '' })).toBe('Give it a name')
  })

  it('rejects a whitespace-only name', () => {
    expect(validateOptionInput({ name: '   ' })).toBe('Give it a name')
  })

  it('accepts a name with no note', () => {
    expect(validateOptionInput({ name: 'Farro' })).toBeNull()
  })

  it('accepts a 40-character note', () => {
    expect(NOTE_MAX_LENGTH).toBe(40)
    expect(validateOptionInput({ name: 'Farro', note: 'a'.repeat(40) })).toBeNull()
  })

  it('rejects a 41-character note', () => {
    expect(validateOptionInput({ name: 'Farro', note: 'a'.repeat(41) })).toBe(
      'Keep the note to 40 characters or fewer',
    )
  })

  it('measures the note after trimming', () => {
    expect(validateOptionInput({ name: 'Farro', note: `  ${'a'.repeat(40)}  ` })).toBeNull()
  })
})

describe('validateTipText', () => {
  it('rejects empty text', () => {
    expect(validateTipText('')).toBe('Write a tip first')
  })

  it('rejects whitespace-only text', () => {
    expect(validateTipText('   ')).toBe('Write a tip first')
  })

  it('accepts text', () => {
    expect(validateTipText('Toast it first')).toBeNull()
  })
})
