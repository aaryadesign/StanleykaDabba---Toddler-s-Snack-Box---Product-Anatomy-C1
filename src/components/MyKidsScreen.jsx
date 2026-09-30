import KidPreferences from './KidPreferences'
import './MyKidsScreen.css'
import AddChildDrawer from './AddChildDrawer'

export default function MyKidsScreen({ onAddChild, profiles, preferences, onPreferencesChange, onBack, onPanel }) {
  return <section className="mykids-screen" aria-label="My Kids">
    <div className="status-bar" aria-hidden="true"><span>8:45</span><img src="/assets/status-dark.svg" alt="" /></div>
    <header className="mykids-header">
      <button aria-label="Back to home" onClick={onBack}><img src="/assets/box-123e4.svg" alt="" /></button>
      <h1>My Kids</h1>
      <button aria-label="My Kids options" onClick={() => onPanel({ title: 'Your kids’ preferences', text: 'Update allergies, likes, and dislikes for each child here. Changes are saved for this session and also appear on Home.' })}><img src="/assets/box-74b47.svg" alt="" /></button>
    </header>
    <div className="mykids-scroll">
      <section className="mykids-banner"><h2>Manage your kids Allergies and dislikes from here.</h2><img src="/assets/kids-banner.png" alt="" /></section>
      <AddChildDrawer count={profiles.length} onSave={onAddChild} />
      {profiles.map((profile, index) => <KidPreferences key={index} profile={profile} value={preferences[index] || {}} onChange={value => onPreferencesChange(index, value)} />)}
    </div>
  </section>
}
