import { render, screen } from '@testing-library/react'
import HomeContent from '../HomeContent'

// Mock the child components
jest.mock('@/components/auth/UserDisplay', () => ({
  __esModule: true,
  default: () => <div data-testid="user-display">User Display</div>,
}))

jest.mock('@/components/common/Logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}))

jest.mock('@/components/common/InstallCommand', () => ({
  InstallCommand: () => <div data-testid="install-command">Install Command</div>,
}))

jest.mock('@/components/common/NewButton', () => ({
  NewButton: () => <div data-testid="new-button">New Button</div>,
}))

describe('HomeContent', () => {
  it('renders all main components', () => {
    render(<HomeContent />)
    
    // Check if all main components are rendered
    expect(screen.getByTestId('logo')).toBeInTheDocument()
    expect(screen.getByTestId('user-display')).toBeInTheDocument()
    expect(screen.getByTestId('install-command')).toBeInTheDocument()
    expect(screen.getByTestId('new-button')).toBeInTheDocument()
  })

  it('renders the learn more link with correct attributes', () => {
    render(<HomeContent />)
    
    const learnMoreLink = screen.getByText('learn more')
    expect(learnMoreLink).toBeInTheDocument()
    expect(learnMoreLink).toHaveAttribute('href', 'https://docs.hebo.ai/hebo_eval')
    expect(learnMoreLink).toHaveAttribute('target', '_blank')
    expect(learnMoreLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the description text', () => {
    render(<HomeContent />)
    
    expect(screen.getByText(/Works with any LLM \/ agent framework/)).toBeInTheDocument()
  })
}) 