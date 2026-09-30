import { useState } from 'react'
import { UserRound, Pencil, ChevronRight, MapPin, Bell, Smile, Package, CircleHelp, Heart, Check } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import './ProfileScreen.css'

function ProfileRow({ icon: Icon, title, description, onClick, children }) {
  const content = <><span className="profile-row-icon"><Icon size={20} strokeWidth={1.8} /></span><span className="profile-row-copy"><strong>{title}</strong><small>{description}</small></span>{children || <ChevronRight size={18} aria-hidden="true" />}</>
  return onClick ? <button className="profile-row" onClick={onClick}>{content}</button> : <div className="profile-row">{content}</div>
}

export default function ProfileScreen({ profiles, phone, selectedPlan, account, onAccountChange, onNavigate, onPanel }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(account.name)
  const [saved, setSaved] = useState(false)
  const names = profiles.map(child => child.name).filter(Boolean)
  return <section className="profile-screen" aria-label="Your profile">
    <div className="status-bar" aria-hidden="true"><span>8:45</span><img src="/assets/status-dark.svg" alt="" /></div>
    <header className="profile-header"><button aria-label="Back to home" onClick={() => onNavigate('Home')}><img src="/assets/box-123e4.svg" alt="" /></button><h1>Profile</h1><span /></header>
    <div className="profile-scroll">
      <section className="profile-identity">
        <div className="profile-identity-top"><span className="profile-avatar"><UserRound size={30} strokeWidth={1.7} /></span><div><p>Your snack-time crew</p><h2>{account.name || 'Hello, snack parent!'}</h2><span className="profile-phone">{phone ? `+91 ${phone}` : 'Your family account'}</span></div><button className="profile-edit" aria-label="Edit your name" onClick={() => { setDraft(account.name); setEditing(!editing); setSaved(false) }}><Pencil size={17} /></button></div>
        {editing && <form className="profile-edit-form" onSubmit={event => { event.preventDefault(); if (!draft.trim()) return; onAccountChange({ ...account, name: draft.trim() }); setEditing(false); setSaved(true) }}><label htmlFor="parent-name">Your name</label><Input id="parent-name" value={draft} onChange={event => setDraft(event.target.value)} maxLength={60} required autoFocus placeholder="What should we call you?"/><div><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit">Save name</Button></div></form>}
        <div className="profile-family"><Heart size={14} aria-hidden="true"/><span>{names.length ? `Made with care for ${names.join(' & ')}` : 'Good food. Happy little humans.'}</span></div>
      </section>
      {saved && <p className="profile-saved" role="status"><Check size={14}/>Name updated</p>}
      <button className="profile-plan" onClick={() => onNavigate('My box')}><span className="profile-plan-icon"><Package size={25}/></span><span><small>YOUR BOXES</small><strong>{!selectedPlan ? 'Explore' : selectedPlan === 'weekly' ? 'Weekly' : 'Monthly'} goodness</strong><span>View upcoming & previous boxes</span></span><ChevronRight size={20}/></button>
      <section className="profile-group"><h2>Your family</h2><div className="profile-card">
        <ProfileRow icon={Smile} title="My kids" description={names.length ? `${names.length} ${names.length === 1 ? 'child' : 'children'} · Allergies & food preferences` : 'Allergies & food preferences'} onClick={() => onNavigate('My Kids')}/>
        <ProfileRow icon={MapPin} title="Delivery address" description="Swarushi Apartment, Ahmedabad" onClick={() => onPanel({title:'Delivery address',text:'Swarushi Apartment, 42 Maple Ave, Ahmedabad. This is the sample delivery address for this prototype.'})}/>
      </div></section>
      <section className="profile-group"><h2>Make it yours</h2><div className="profile-card"><ProfileRow icon={Bell} title="Snack reminders" description="A heads-up before your next box"><button className="profile-toggle" role="switch" aria-label="Snack reminders" aria-checked={account.reminders} onClick={() => onAccountChange({...account, reminders: !account.reminders})}><span/></button></ProfileRow></div><p className="profile-setting-note">Your preference is saved for this session.</p></section>
      <section className="profile-support"><span className="profile-support-icon"><CircleHelp size={25}/></span><div><h2>A little help?</h2><p>We’re here for you and your little ones.</p><button onClick={() => onPanel({title:'How can we help?',text:'For box details, open My box. To update food preferences, open My Kids. Live support is not connected in this prototype.'})}>Help & support <ChevronRight size={15}/></button></div></section>
      <p className="profile-signature">Little boxes. Lots of love.<Heart size={12} aria-hidden="true"/></p>
    </div>
  </section>
}
