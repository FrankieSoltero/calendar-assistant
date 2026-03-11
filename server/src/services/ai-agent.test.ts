import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildSystemPrompt, ChatMessage } from './ai-agent.js'
import { CalendarEvent } from './google-calendar.js'

describe('buildSystemPrompt', () => {
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Team Meeting',
      start: '2025-03-12T09:00:00.000Z',
      end: '2025-03-12T10:00:00.000Z',
      description: 'Weekly team sync',
      location: 'Conference Room A',
      colorId: '1',
      htmlLink: 'https://calendar.google.com/event?id=1',
    },
    {
      id: '2',
      title: 'Lunch with Client',
      start: '2025-03-12T12:00:00.000Z',
      end: '2025-03-12T13:00:00.000Z',
      attendees: [
        { email: 'client@example.com', displayName: 'John Client', responseStatus: 'accepted' },
      ],
    },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    // Set a fixed date for consistent testing
    vi.setSystemTime(new Date('2025-03-12T08:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('includes today\'s date in the prompt', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')
    
    expect(prompt).toContain('Today is')
    expect(prompt).toContain('Wednesday')
    expect(prompt).toContain('March')
    expect(prompt).toContain('12')
  })

  it('includes date reference for next 14 days', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')
    
    expect(prompt).toContain('<date_reference>')
    expect(prompt).toContain('</date_reference>')
    expect(prompt).toContain('Wednesday')
    expect(prompt).toContain('Thursday')
  })

  it('includes calendar events in JSON format', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')
    
    expect(prompt).toContain('<calendar_events>')
    expect(prompt).toContain('</calendar_events>')
    expect(prompt).toContain('Team Meeting')
    expect(prompt).toContain('Lunch with Client')
    expect(prompt).toContain('Conference Room A')
  })

  it('enriches events with dayOfWeek field', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')
    
    expect(prompt).toContain('"dayOfWeek":')
  })

  it('includes critical rules about day-of-week', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')
    
    expect(prompt).toContain('Critical rules')
    expect(prompt).toContain('NEVER compute day-of-week from a date')
  })

  it('includes email formatting instructions', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')
    
    expect(prompt).toContain('```email')
    expect(prompt).toContain('Subject:')
  })

  it('handles empty events array', () => {
    const prompt = buildSystemPrompt([], 'America/Los_Angeles')
    
    expect(prompt).toContain('<calendar_events>')
    expect(prompt).toContain('[]')
    expect(prompt).toContain('</calendar_events>')
  })

  it('includes capabilities section', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')
    
    expect(prompt).toContain('Your capabilities')
    expect(prompt).toContain('Schedule analysis')
    expect(prompt).toContain('Email drafting')
    expect(prompt).toContain('Scheduling suggestions')
  })

  it('includes formatting rules', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')
    
    expect(prompt).toContain('Formatting rules')
    expect(prompt).toContain('markdown')
  })

  it('handles events without optional fields', () => {
    const minimalEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Simple Event',
        start: '2025-03-12T09:00:00.000Z',
        end: '2025-03-12T10:00:00.000Z',
      },
    ]
    
    const prompt = buildSystemPrompt(minimalEvents, 'America/Los_Angeles')
    
    expect(prompt).toContain('Simple Event')
    expect(prompt).toContain('"dayOfWeek":')
  })

  it('generates correct date reference format', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')

    // Should have 14 days in date reference
    const dateRefMatch = prompt.match(/\w{3},? \w{3} \d{1,2}/g)
    expect(dateRefMatch?.length).toBeGreaterThanOrEqual(14)
  })

  it('includes the user time zone in the prompt', () => {
    const prompt = buildSystemPrompt(mockEvents, 'America/Los_Angeles')

    expect(prompt).toContain('America/Los_Angeles')
  })
})
