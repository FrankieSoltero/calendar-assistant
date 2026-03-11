import { describe, it, expect } from 'vitest'
import { CalendarEvent } from './google-calendar.js'

describe('CalendarEvent interface', () => {
  it('accepts valid calendar event structure', () => {
    const event: CalendarEvent = {
      id: '123',
      title: 'Test Event',
      start: '2025-03-12T09:00:00.000Z',
      end: '2025-03-12T10:00:00.000Z',
      description: 'Test description',
      location: 'Test Location',
      attendees: [
        { email: 'test@example.com', displayName: 'Test User', responseStatus: 'accepted' },
      ],
      colorId: '1',
      htmlLink: 'https://calendar.google.com/event?id=123',
    }

    expect(event.id).toBe('123')
    expect(event.title).toBe('Test Event')
    expect(event.start).toBe('2025-03-12T09:00:00.000Z')
    expect(event.end).toBe('2025-03-12T10:00:00.000Z')
    expect(event.attendees).toHaveLength(1)
    expect(event.attendees![0].email).toBe('test@example.com')
  })

  it('accepts minimal event with only required fields', () => {
    const event: CalendarEvent = {
      id: '456',
      title: 'Minimal Event',
      start: '2025-03-12T09:00:00.000Z',
      end: '2025-03-12T10:00:00.000Z',
    }

    expect(event.id).toBe('456')
    expect(event.title).toBe('Minimal Event')
    expect(event.description).toBeUndefined()
    expect(event.location).toBeUndefined()
    expect(event.attendees).toBeUndefined()
  })

  it('accepts event with multiple attendees', () => {
    const event: CalendarEvent = {
      id: '789',
      title: 'Team Meeting',
      start: '2025-03-12T09:00:00.000Z',
      end: '2025-03-12T10:00:00.000Z',
      attendees: [
        { email: 'alice@example.com', displayName: 'Alice', responseStatus: 'accepted' },
        { email: 'bob@example.com', displayName: 'Bob', responseStatus: 'tentative' },
        { email: 'charlie@example.com', responseStatus: 'declined' },
      ],
    }

    expect(event.attendees).toHaveLength(3)
    expect(event.attendees![0].responseStatus).toBe('accepted')
    expect(event.attendees![1].responseStatus).toBe('tentative')
    expect(event.attendees![2].responseStatus).toBe('declined')
  })
})
