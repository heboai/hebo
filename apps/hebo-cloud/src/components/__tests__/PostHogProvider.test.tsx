import { render, screen } from '@testing-library/react'
import { PostHogProvider } from '../PostHogProvider'
import posthog from 'posthog-js'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

// Mock posthog-js
jest.mock('posthog-js', () => ({
  init: jest.fn(),
  capture: jest.fn(),
}))

// Mock posthog-js/react
jest.mock('posthog-js/react', () => ({
  usePostHog: jest.fn(),
  PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}))

describe('PostHogProvider', () => {
  const mockPathname = '/test-path'
  const mockSearchParams = new URLSearchParams('?param=value')
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue(mockPathname)
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
  })

  it('initializes PostHog with correct configuration', () => {
    render(
      <PostHogProvider>
        <div>Test Child</div>
      </PostHogProvider>
    )

    expect(posthog.init).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
      {
        api_host: '/ingest',
        ui_host: 'https://eu.posthog.com',
        capture_pageview: false,
        capture_pageleave: true,
        capture_exceptions: true,
        debug: process.env.NODE_ENV === 'development',
      }
    )
  })

  it('renders children correctly', () => {
    render(
      <PostHogProvider>
        <div data-testid="test-child">Test Child</div>
      </PostHogProvider>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
  })

  it('captures pageview with correct URL', () => {
    const mockPosthog = {
      capture: jest.fn(),
    }

    ;(usePostHog as jest.Mock).mockReturnValue(mockPosthog)

    render(
      <PostHogProvider>
        <div>Test Child</div>
      </PostHogProvider>
    )

    expect(mockPosthog.capture).toHaveBeenCalledWith('$pageview', {
      $current_url: `${window.origin}${mockPathname}?${mockSearchParams.toString()}`,
    })
  })
}) 