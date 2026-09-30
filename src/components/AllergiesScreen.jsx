import SetupBack from './SetupBack'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import './AllergiesScreen.css'

const choices = ['Tree Nut', 'Gluten-Free', 'Vegan', 'Dairy-Free']

export default function AllergiesScreen({ onBack, preferences = {}, childProfiles, onSave, onContinue }) {
  const [childIndex, setChildIndex] = useState(0)
  const saved = preferences[childIndex] || {}
  const selected = saved.allergies || []
  const setSelected = change => onSave(childIndex, { ...saved, allergies: typeof change === 'function' ? change(selected) : change })
  const custom = selected.filter(item => !choices.includes(item))
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const dislikes = Array.isArray(saved.dislikes) ? saved.dislikes.join(', ') : saved.dislikes || ''
  const setDislikes = value => onSave(childIndex, { ...saved, dislikes: value })
  const [notice, setNotice] = useState('')
  const childName = childProfiles[childIndex]?.name || 'your little one'

  function toggle(choice) {
    setSelected(current => current.includes(choice) ? current.filter(value => value !== choice) : [...current, choice])
    setNotice('')
  }

  function addCustom(event) {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return
    const existing = [...choices, ...custom].find(item => item.toLowerCase() === value.toLowerCase())
    const choice = existing || value

    setSelected(current => current.includes(choice) ? current : [...current, choice])
    setDraft('')
    setAdding(false)
  }

  function finish() {

    if (childIndex + 1 < childProfiles.length) {
      setChildIndex(current => current + 1)
      setAdding(false)
      setNotice('')
    } else {
      onContinue()
    }
  }

  return (
    <main className={`allergies-screen${adding ? ' is-adding' : ''}`} aria-labelledby="allergies-title">
      <div className="status-bar" aria-hidden="true"><span>9:41</span><img src="/assets/status-dark.svg" alt="" width="66.661" height="11.336" /></div>
      <header className="allergies-header"><SetupBack onBack={() => childIndex > 0 ? setChildIndex(childIndex - 1) : onBack()} /><button type="button" onClick={() => finish(true)}>skip.</button></header>
      <img className="allergies-character" src="/assets/allergy-character.svg" alt="" width="478" height="806" />
      <h1 id="allergies-title">Does {childName} have any allergies?</h1>
      <div className="allergies-options" aria-label="Allergies and dietary preferences">
        {[...choices, ...custom].map(choice => <button key={choice} type="button" className={`allergy-chip${selected.includes(choice) ? ' selected' : ''}`} aria-pressed={selected.includes(choice)} onClick={() => toggle(choice)}>
          <span className="allergy-chip-label"><span className="allergy-nut"><img src="/assets/allergy-nut.png" alt="" /></span>{choice}</span>
          {selected.includes(choice) && <img className="allergy-symbol" src="/assets/allergy-close.svg" alt="" width="14" height="14" />}
        </button>)}
        <button className="allergy-chip add" type="button" onClick={() => setAdding(!adding)} aria-expanded={adding}><img className="allergy-symbol" src="/assets/allergy-plus.svg" alt="" width="14" height="14" />Add yours</button>
      </div>
      {adding && <form className="allergy-custom" onSubmit={addCustom}><Input aria-label="Add an allergy or preference" placeholder="e.g. Sesame" maxLength={24} value={draft} onChange={event => setDraft(event.target.value)} autoFocus /><Button type="submit" disabled={!draft.trim()}>Add</Button><button type="button" onClick={() => { setAdding(false); setDraft('') }} aria-label="Cancel adding preference">×</button></form>}
      <section className="allergies-dislikes">
        <div><label htmlFor="dislikes">Anything they just don't like?</label><p id="dislikes-help">Not an allergy, just their taste. You can update this later.</p></div>
        <textarea id="dislikes" aria-describedby="dislikes-help" placeholder="Broccoli, milk, spicy, etc." value={dislikes} onChange={event => { setDislikes(event.target.value); setNotice('') }} />
      </section>
      <p className="allergies-notice" role="status">{notice}</p>
      <Button className="allergies-next" onClick={() => finish()}>{childIndex + 1 < childProfiles.length ? `Next child (${childIndex + 1}/${childProfiles.length})` : 'Continue'}</Button>
    </main>
  )
}
