import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveClass(...classNames: string[]): R
      toHaveStyle(style: Record<string, string | number>): R
      toHaveTextContent(text: string | RegExp): R
      toBeVisible(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeRequired(): R
      toBeInvalid(): R
      toBeValid(): R
      toHaveFocus(): R
      toHaveValue(value?: string | string[] | number): R
      toBeChecked(): R
      toBePartiallyChecked(): R
      toHaveDescription(text?: string | RegExp): R
    }
  }
} 