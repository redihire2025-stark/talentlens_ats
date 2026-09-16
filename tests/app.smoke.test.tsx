import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

describe('App', () => {
  it('renders the landing view by default without crashing', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })
})
