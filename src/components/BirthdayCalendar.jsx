import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function BirthdayCalendar({ onSelect, onClose }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  function moveMonth(offset) {
    const date = new Date(year, month + offset, 1)
    setYear(date.getFullYear()); setMonth(date.getMonth())
  }
  return <div className="birthday-calendar" role="dialog" aria-label="Choose date of birth" onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
    <div className="calendar-header">
      <Button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</Button>
      <span>{new Date(year, month).toLocaleString('en', { month: 'short' })}</span>
      <input aria-label="Birth year" type="number" min="1900" max={today.getFullYear()} value={year} onChange={(event) => { const value = Number(event.target.value); if (value >= 1900 && value <= today.getFullYear()) setYear(value) }} />
      <Button type="button" aria-label="Next month" disabled={year === today.getFullYear() && month >= today.getMonth()} onClick={() => moveMonth(1)}>›</Button>
      <Button type="button" aria-label="Close calendar" onClick={onClose}>×</Button>
    </div>
    <div className="calendar-days">
      {['S','M','T','W','T','F','S'].map((day, index) => <span key={index}>{day}</span>)}
      {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} />)}
      {Array.from({ length: days }, (_, index) => { const day = index + 1; return <button key={day} type="button" disabled={new Date(year, month, day) > today} aria-label={`${day} ${new Date(year, month).toLocaleString('en', { month: 'long' })} ${year}`} onClick={() => onSelect(`${String(day).padStart(2, '0')}/ ${String(month + 1).padStart(2, '0')} / ${year}`)}>{day}</button> })}
    </div>
  </div>
}
