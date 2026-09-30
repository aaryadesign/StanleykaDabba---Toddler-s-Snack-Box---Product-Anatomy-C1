import { useId, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import './AddChildDrawer.css'

export default function AddChildDrawer({ count, onSave }) {
  const id = useId()
  const trigger = useRef(null)
  const nameField = useRef(null)
  const dateField = useRef(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [gender, setGender] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  function close() { setOpen(false); trigger.current?.focus() }
  function save(event) {
    event.preventDefault()
    const match = birthday.match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/)
    const [, day, month, year] = match || []
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    const next = {}
    if (!name.trim()) next.name = 'Enter your child’s name.'
    if (!match || date.getDate() !== Number(day) || date.getMonth() + 1 !== Number(month) || !Number.isFinite(date.getTime()) || date > new Date() || date.getFullYear() < 1900) next.birthday = 'Choose a valid date of birth, not in the future.'
    setErrors(next)
    if (next.name) { nameField.current?.focus(); return }
    if (next.birthday) { dateField.current?.focus(); return }
    onSave({ name: name.trim(), birthday: `${day}/${month}/${year}`, gender })
    setNotice(`${name.trim()} added.`)
    close()
  }
  return <div className="add-child-section">
    <div className="kids-list-heading"><h2>{count ? `Your kids (${count})` : 'Let’s add your first child'}</h2><Button ref={trigger} aria-expanded={open} aria-controls={id} onClick={() => { if (open) close(); else { setName(''); setBirthday(''); setGender(''); setErrors({}); setNotice(''); setOpen(true) } }}>{open ? 'Close' : '+ Add child'}</Button></div>
    <div className="add-child-drawer" data-open={open} id={id} inert={!open} onTransitionEnd={event => { if (open && event.target === event.currentTarget && event.propertyName === 'grid-template-rows') nameField.current?.focus({ preventScroll: true }) }} onKeyDown={event => { if(event.key === 'Escape') { event.preventDefault(); close() } }}>
      <div className="add-child-drawer-inner"><form className="add-child-form" onSubmit={save} noValidate aria-label="Add a child">
        <div className="add-child-intro"><h3>A new little snacker</h3><p>Add their details. You can set food preferences below.</p></div>
        <div className="add-child-field"><label htmlFor={`${id}-name`}>Child’s name</label><Input ref={nameField} id={`${id}-name`} value={name} onChange={e => {setName(e.target.value);setErrors({...errors,name:''})}} placeholder="Enter their name" maxLength={80} autoComplete="off" aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-name-error` : undefined}/>{errors.name && <p id={`${id}-name-error`} className="add-child-error" role="alert">{errors.name}</p>}</div>
        <div className="add-child-field"><label htmlFor={`${id}-birthday`}>Date of birth</label><Input ref={dateField} id={`${id}-birthday`} type="text" inputMode="numeric" placeholder="DD/MM/YYYY" maxLength={14} value={birthday} onChange={e => {setBirthday(e.target.value);setErrors({...errors,birthday:''})}} aria-invalid={!!errors.birthday} aria-describedby={errors.birthday ? `${id}-date-error` : undefined}/>{errors.birthday && <p id={`${id}-date-error`} className="add-child-error" role="alert">{errors.birthday}</p>}</div>
        <fieldset className="add-child-gender"><legend>Gender <span>(optional)</span></legend><div>{['boy','girl'].map(option => <label key={option}><input type="radio" name={`${id}-gender`} value={option} checked={gender === option} onChange={() => setGender(option)}/>{option === 'boy' ? 'Boy' : 'Girl'}</label>)}</div></fieldset>
        <div className="add-child-actions"><Button type="button" variant="ghost" onClick={close}>Cancel</Button><Button type="submit">Add child</Button></div>
      </form></div>
    </div><span className="sr-only" role="status">{notice}</span>
  </div>
}
