import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const allergyOptions = ['Tree Nut', 'Gluten-Free', 'Vegan', 'Dairy-Free']
const list = value => Array.isArray(value) ? value : (value || '').split(',').map(item => item.trim()).filter(Boolean)

export default function KidPreferences({ profile, value, onChange }) {
  const instanceId = useId()
  const [tab, setTab] = useState('dislikes')
  const [tasteText, setTasteText] = useState(() => ({ likes: list(value.likes).join(', '), dislikes: list(value.dislikes).join(', ') }))
  const [customAllergy, setCustomAllergy] = useState(false)
  const [allergyDraft, setAllergyDraft] = useState('')
  const [feedback, setFeedback] = useState('')
  const tabs = useRef({})
  const likes = list(value.likes)
  const dislikes = list(value.dislikes)
  const allergies = value.allergies || []
  const gender = profile.gender || ''
  const isGirl = gender === 'girl'
  const asset = file => `/assets/dash-${file}`
  const kidIcon = (file, pinkFile, props = {}) => <img src={isGirl ? '/assets/kid-pink-' + pinkFile + '.svg' : asset(file)} alt="" {...props} />

  function update(patch) { onChange({ ...value, ...patch }); setFeedback('Saved for this session') }
  function editTaste(text) {
    const foods = [...new Map(list(text).map(food => [food.toLowerCase(), food])).values()]
    setTasteText(current => ({ ...current, [tab]: text }))
    update({ [tab]: foods })
  }
  function chooseTab(next) { setTab(next); setFeedback('') }
  const birthday = profile.birthday?.split('/').map(Number)
  let age = ''
  if (birthday?.length === 3) {
    const today = new Date()
    let years = today.getFullYear() - birthday[2]
    if (today.getMonth() + 1 < birthday[1] || (today.getMonth() + 1 === birthday[1] && today.getDate() < birthday[0])) years--
    age = years < 1 ? 'Under 1 year' : `${years} year${years === 1 ? '' : 's'} old`
  }
  return <section className="home-kid" data-gender={gender}>
    <header><h2>{profile.name || 'Your little one'}</h2>{age && <span>{age}</span>}</header>
    {kidIcon('901c3.svg', 'divider', { className: 'kid-divider' })}
    <h3>Allergies</h3>
    <div className="kid-allergies">{[...new Set([...allergyOptions, ...allergies])].map(item => <button type="button" key={item} aria-pressed={allergies.includes(item)} onClick={() => update({ allergies: allergies.includes(item) ? allergies.filter(a => a !== item) : [...allergies, item] })}>
      <span className="allergy-nut"><img src="/assets/allergy-nut.png" alt="" /></span>{item}{allergies.includes(item) && kidIcon('b7868.svg', 'close')}
    </button>)}<button className="kid-add-allergy" type="button" onClick={() => setCustomAllergy(!customAllergy)} aria-expanded={customAllergy}>{kidIcon('4f9de.svg', 'plus')}Add yours</button></div>
    {customAllergy && <form className="kid-add-form" onSubmit={event => { event.preventDefault(); const food = allergyDraft.trim(); if (!food) return; if (!allergies.some(item => item.toLowerCase() === food.toLowerCase())) update({ allergies: [...allergies, food] }); setAllergyDraft(''); setCustomAllergy(false) }}><Input aria-label="Custom allergy" value={allergyDraft} onChange={event => setAllergyDraft(event.target.value)} maxLength={40} placeholder="Add an allergy" autoFocus /><Button type="submit">Add</Button></form>}
    <div className="kid-tastes">

      <div className="taste-tabs" role="tablist" aria-label="Food preferences">{['likes', 'dislikes'].map(type => <button key={type} ref={element => { tabs.current[type] = element }} role="tab" type="button" id={`taste-${instanceId}-${type}`} aria-selected={tab === type} aria-controls={`taste-panel-${instanceId}`} tabIndex={tab === type ? 0 : -1} onClick={() => chooseTab(type)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'likes' : event.key === 'End' ? 'dislikes' : type === 'likes' ? 'dislikes' : 'likes'; chooseTab(next); tabs.current[next].focus() } }}>{type === 'likes' ? 'Likes' : 'Dislikes'} <span>{type === 'likes' ? likes.length : dislikes.length}</span></button>)}</div>
      <div role="tabpanel" id={`taste-panel-${instanceId}`} aria-labelledby={`taste-${instanceId}-${tab}`} className="taste-panel">
        <label htmlFor={`taste-input-${instanceId}`}>{tab === 'likes' ? 'Anything they especially love?' : "Anything they just don't like?"}</label>
        <p id={`taste-help-${instanceId}`}>Not an allergy, just their taste. You can update this later.</p>
        <textarea id={`taste-input-${instanceId}`} aria-describedby={`taste-help-${instanceId}`} placeholder={tab === 'likes' ? 'Banana, paneer, carrots, etc.' : 'Broccoli, milk, spicy, etc.'} value={tasteText[tab]} onChange={event => editTaste(event.target.value)} />
      </div><span className="sr-only" role="status">{feedback}</span>
    </div>
  </section>
}

