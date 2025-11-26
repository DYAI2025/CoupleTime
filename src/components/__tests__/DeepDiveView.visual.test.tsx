import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DeepDiveView } from '../DeepDiveView'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'

/**
 * Visual test to verify DeepDiveView renders correctly with real i18n data
 * This test uses the actual translation files to ensure integration works
 */
describe('DeepDiveView - Visual Integration', () => {
  it('renders with real i18n data in English', async () => {
    // Set language to English
    await i18n.changeLanguage('en')

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <DeepDiveView />
      </I18nextProvider>
    )

    // Verify the component renders
    expect(container.querySelector('h2')).toBeTruthy()
  })

  it('renders with real i18n data in German', async () => {
    // Set language to German
    await i18n.changeLanguage('de')

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <DeepDiveView />
      </I18nextProvider>
    )

    // Verify the component renders
    expect(container.querySelector('h2')).toBeTruthy()
  })

  it('renders all sections with real data', async () => {
    await i18n.changeLanguage('en')

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <DeepDiveView />
      </I18nextProvider>
    )

    // Should have 3 sections (beforeSession, duringListening, emergency)
    const headings = container.querySelectorAll('h2')
    expect(headings.length).toBe(3)

    // Should have multiple cards
    const cards = container.querySelectorAll('.bg-white')
    expect(cards.length).toBeGreaterThan(0)
  })
})
