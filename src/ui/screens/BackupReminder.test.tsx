import { render, screen } from '@testing-library/react'
import { BackupReminder } from './BackupReminder'

describe('BackupReminder', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<BackupReminder reminder={{ show: false, lastBackupAt: null }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('says there is no backup yet when none was ever made', () => {
    render(<BackupReminder reminder={{ show: true, lastBackupAt: null }} />)
    expect(screen.getByText('No backup yet')).toBeInTheDocument()
  })

  it('says it has been a while when the last backup is old', () => {
    render(<BackupReminder reminder={{ show: true, lastBackupAt: 1000 }} />)
    expect(screen.getByText("It's been a while since your last backup")).toBeInTheDocument()
  })
})
