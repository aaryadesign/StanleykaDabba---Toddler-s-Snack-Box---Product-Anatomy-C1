import useSessionState from '../hooks/useSessionState'
import SetupBack from './SetupBack'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import BirthdayCalendar from './BirthdayCalendar'
import './ChildProfileScreen.css'

function parseBirthday(value) {
  const match = value.match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match.map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && date <= new Date() && year >= 1900 ? date : null
}

export default function ChildProfileScreen({ onBack, initialChildren = [], onContinue }) {
  const [name, setName] = useSessionState('draft-child-name', '')
  const [birthday, setBirthday] = useSessionState('draft-child-birthday', '')
  const [gender, setGender] = useSessionState('draft-child-gender', '')
  const [children, setChildren] = useSessionState('children', initialChildren)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const nameInput = useRef(null)

  function saveChild(addAnother) {
    const nextErrors = {}
    if (!name.trim()) nextErrors.name = 'Enter your baby’s name.'
    if (!parseBirthday(birthday)) nextErrors.birthday = 'Enter a valid birth date (DD/MM/YYYY), not in the future.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { if (nextErrors.name) nameInput.current?.focus(); else document.getElementById('child-birthday')?.focus(); return }
    const nextChildren = [...children, { name: name.trim(), birthday, gender }]
    setChildren(nextChildren)
    setName('')
    setBirthday('')
    setGender('')
    setNotice(addAnother ? `${name.trim()} added. Tell us about your next kiddo.` : '')
    if (!addAnother) onContinue(nextChildren)
    if (addAnother) nameInput.current?.focus()
  }

  function next(event) {
    event.preventDefault()
    if (children.length && !name.trim() && !birthday.trim()) {
      setErrors({})
      onContinue(children)
    } else saveChild(false)
  }

  return (
    <main className="child-screen" aria-labelledby="child-title">
      <div className="status-bar" aria-hidden="true"><span>9:41</span><img src="/assets/status-dark.svg" alt="" width="66.661" height="11.336" /></div>
      <header className="child-header"><SetupBack onBack={() => onBack(children)} /><button type="button" onClick={() => onContinue(children)}>skip.</button></header>
      <div className="child-art" aria-hidden="true">
        <img className="child-body" src="/assets/child-body.svg" alt="" />
        <img className="child-cheek left" src="/assets/child-cheek.svg" alt="" />
        <img className="child-cheek right" src="/assets/child-cheek.svg" alt="" />
        <img className="child-eye left" src="/assets/child-eye-left.svg" alt="" />
        <img className="child-eye right" src="/assets/child-eye-right.svg" alt="" />
        <div className="child-mouth-position"><div className="child-mouth-rotation"><img src="/assets/child-mouth.svg" alt="" /></div></div>
      </div>
      <h1 id="child-title">Tell us about your<br />little one</h1>
      <form className="child-form" onSubmit={next} noValidate>
        {children.length > 0 && <ul className="added-children" aria-label="Added children">
          {children.map((child, index) => <li key={index} className="added-child-pill" title={child.name}>
            <span className="added-child-check" aria-hidden="true">✓</span><span>{child.name}</span>
          </li>)}
        </ul>}
        <div className="child-fields">
          <div className="child-field">
            <label htmlFor="child-name">What’s your baby’s name?</label>
            <Input ref={nameInput} id="child-name" value={name} placeholder="Arav" maxLength={80} autoComplete="off" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'child-name-error' : undefined}
              onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: '' })); setNotice('') }} />
            {errors.name && <p className="child-error" id="child-name-error" role="alert">{errors.name}</p>}
          </div>
          <div className="child-field">
            <label htmlFor="child-birthday">Date of Birth</label>
            <div className="child-date-control">
              <Input id="child-birthday" value={birthday} placeholder="01/ 11 / 2025" inputMode="numeric" maxLength={14} aria-invalid={!!errors.birthday} aria-describedby={errors.birthday ? 'child-birthday-error' : undefined}
                onChange={(event) => { setBirthday(event.target.value); setErrors((current) => ({ ...current, birthday: '' })); setNotice('') }} />
              <div className="birthday-picker">
                <div className="birthday-icon"><img src="/assets/birthday-cake.png" alt="" /></div>
                <button type="button" className="birthday-trigger" aria-label="Choose date of birth" aria-expanded={calendarOpen} onClick={() => setCalendarOpen(!calendarOpen)} />
              </div>
              {calendarOpen && <BirthdayCalendar onClose={() => setCalendarOpen(false)} onSelect={(value) => { setBirthday(value); setErrors((current) => ({ ...current, birthday: '' })); setNotice(''); setCalendarOpen(false) }} />}
            </div>
            {errors.birthday && <p className="child-error" id="child-birthday-error" role="alert">{errors.birthday}</p>}
          </div>
          <fieldset className="child-gender"><legend>Gender <span>(optional)</span></legend><div>{['boy', 'girl'].map(option => <label key={option}><input type="radio" name="child-gender" value={option} checked={gender === option} onChange={() => setGender(option)} /><span>{option === 'boy' ? 'Boy' : 'Girl'}</span></label>)}</div></fieldset>
        </div>
        <p className="sr-only" role="status">{notice}</p>
        <div className="child-actions">
          <Button className="child-add" type="button" onClick={() => saveChild(true)}>One more kiddo to add</Button>
          <Button className="child-next" type="submit">Next</Button>
        </div>
      </form>
    </main>
  )
}
