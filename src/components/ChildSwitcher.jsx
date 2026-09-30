import { useEffect, useId, useRef, useState } from 'react'
import './ChildSwitcher.css'

export default function ChildSwitcher({ profiles, selectedIndex, onSelect }) {
  const [open, setOpen] = useState(false)
  const pickerId = useId()
  const root = useRef(null)
  const trigger = useRef(null)
  const selected = profiles[selectedIndex]
  const options = useRef([])
  const multiple = profiles.length > 1
  useEffect(() => {
    if (!open) return
    function dismiss(event) { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])
  return <div className="child-switcher-wrap" ref={root} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); trigger.current.focus() } }}>
    <button ref={trigger} className="child-switcher" type="button" aria-expanded={open} aria-controls={pickerId} aria-label={`Switch child, currently ${selected.name}`} disabled={!multiple} onClick={() => setOpen(!open)} onKeyDown={event => { if (multiple && event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); requestAnimationFrame(() => options.current[selectedIndex]?.focus()) } }}>
      <span className={`child-avatar child-color-${selectedIndex % 4}`} aria-hidden="true">{selected.name?.slice(0, 1).toUpperCase() || '★'}</span>
      <span className="child-switcher-label"><span className="child-for">Viewing box for</span><span className="child-switcher-name" title={selected.name} aria-live="polite">{selected.name}</span></span>
      <span className="child-switch-action">{multiple ? `Switch · ${profiles.length} kids` : '1 child'} {multiple && <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
    </button>
    <div className={`child-picker-expansion${open ? ' is-open' : ''}`} id={pickerId} inert={!open} aria-hidden={!open}><div className="child-picker-clip"><div className="child-picker">
      <div className="child-picker-heading">Switch child <span>{profiles.length} {profiles.length === 1 ? 'child' : 'children'}</span></div>
      <div className="child-picker-list" role="group" aria-label="Choose a child">
        {profiles.map((profile, index) => <button ref={el => { options.current[index] = el }} onKeyDown={event => { if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? profiles.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + profiles.length) % profiles.length; options.current[next]?.focus() } }} key={profile.id || index} type="button" aria-pressed={index === selectedIndex} onClick={() => { onSelect(index); setOpen(false); trigger.current.focus() }}>
          <span className={`child-avatar child-color-${index % 4}`} aria-hidden="true">{profile.name?.slice(0, 1).toUpperCase() || '★'}</span>
          <span className="child-option-name">{profile.name || 'Your little one'}</span>
          {index === selectedIndex && <span className="child-selected-label">Selected</span>}
          {index === selectedIndex && <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>)}
      </div>
    </div></div></div>
  </div>
}
