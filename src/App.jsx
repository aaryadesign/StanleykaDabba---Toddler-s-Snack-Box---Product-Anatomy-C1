import useSessionState from './hooks/useSessionState'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import VerificationScreen from '@/components/VerificationScreen'
import ChildProfileScreen from '@/components/ChildProfileScreen'
import LocationScreen from '@/components/LocationScreen'
import AllergiesScreen from '@/components/AllergiesScreen'
import MealPreviewScreen from '@/components/MealPreviewScreen'
import PlanScreen from '@/components/PlanScreen'
import HomeScreen from '@/components/HomeScreen'
import './App.css'

function Artwork() {
  return (
    <div className="hero-viewport">
      <div className="hero-canvas">
        <div className="status-bar" aria-hidden="true">
          <span>9:41</span>
          <img src="/assets/status.svg" alt="" width="66.661" height="11.336" />
        </div>
        <div className="character age-safe" role="img" aria-label="Age safe">
          <div className="age-outer">
            <div className="age-art"><img src="/assets/age-safe.svg" alt="" /></div>
            <span>Age safe</span>
          </div>
        </div>
        <div className="character protein" role="img" aria-label="Protein rich">
          <div className="protein-inner"><img src="/assets/protein.svg" alt="" /><span>Protein<br />Rich</span></div>
        </div>
        <h1>Healthy snacks<br />toddlers actually eat</h1>
        <p className="brand">Toddlers’ Snack box</p>
        <div className="character no-salt" role="img" aria-label="No added salt">
          <div className="salt-inner"><img src="/assets/no-salt.svg" alt="" /><span>No added<br />salt</span></div>
        </div>
        <div className="character no-sugar" role="img" aria-label="No added sugar">
          <div className="sugar-inner"><img src="/assets/no-sugar.svg" alt="" /><span>No added<br />sugar</span></div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [phone, setPhone] = useSessionState('phone', '')
  const [message, setMessage] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [screen, setScreen] = useSessionState('screen', 'welcome')
  const [children, setChildren] = useSessionState('children', [])
  const [pinCode, setPinCode] = useSessionState('pin', '')
  const [selectedPlan, setSelectedPlan] = useSessionState('plan', 'monthly')
  const [preferences, setPreferences] = useSessionState('preferences', {})

  const [returnToFamily, setReturnToFamily] = useSessionState('return-to-family', false)

  function continueFromChildren(savedChildren) {
    setChildren(savedChildren)
    setScreen(returnToFamily ? 'home' : 'location')
    setReturnToFamily(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setInvalid(true)
      setMessage('Enter a valid 10-digit Indian mobile number.')
      return
    }
    setInvalid(false)
    setMessage('')
    setScreen('verification')
  }

  return (
    <div className="device-stage">
      <div className="phone-frame">
        <div className="phone-display" key={screen}>
    {screen === 'home' ? <HomeScreen onAddChild={child => setChildren(current => [...current, child])} phone={phone} childProfiles={children} preferences={preferences} selectedPlan={selectedPlan} onPreferencesChange={(index, values) => setPreferences(current => ({ ...current, [index]: values }))} /> : screen === 'plan' ? <PlanScreen onBack={() => setScreen('meal-preview')} onSkip={() => { setSelectedPlan(null); setScreen('home') }} onContinue={() => setScreen('home')} selectedPlan={selectedPlan} onPlanChange={setSelectedPlan} /> : screen === 'meal-preview' ? <MealPreviewScreen onBack={() => setScreen('allergies')} onSkip={() => { setSelectedPlan(null); setScreen('home') }} onSubscribe={() => setScreen('plan')} childName={children[0]?.name} /> : screen === 'allergies' ? <AllergiesScreen preferences={preferences} onBack={() => setScreen('location')} onContinue={() => setScreen('meal-preview')} childProfiles={children} onSave={(index, values) => setPreferences(current => ({ ...current, [index]: values }))} /> : screen === 'location' ? <LocationScreen onBack={() => setScreen('child-profile')} pinCode={pinCode} onPinChange={setPinCode} onContinue={() => setScreen('allergies')} /> : screen === 'child-profile' ? <ChildProfileScreen onBack={savedChildren => { setChildren(savedChildren); setScreen(returnToFamily ? 'home' : 'verification'); setReturnToFamily(false) }} initialChildren={children} onContinue={continueFromChildren} /> : screen === 'verification' ? <VerificationScreen phone={phone} onEditPhone={() => setScreen('welcome')} onVerified={() => setScreen('child-profile')} /> : <main className="welcome-screen">
      <Artwork />
      <form className="signup-panel" onSubmit={handleSubmit} noValidate>
        <div className="phone-field">
          <label htmlFor="phone">Phone number</label>
          <div className={`phone-control${invalid ? ' has-error' : ''}`}>
            <span className="country-code">+91</span>
            <span aria-hidden="true">|</span>
            <Input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national"
              aria-invalid={invalid} aria-describedby={message ? 'phone-feedback privacy-note' : 'privacy-note'}
              placeholder="Enter your phone number" value={phone} maxLength={10}
              onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '').slice(0, 10)); setMessage(''); setInvalid(false) }} />
          </div>
          {message && <p id="phone-feedback" className={`feedback${invalid ? ' error' : ''}`} role={invalid ? 'alert' : 'status'}>{message}</p>}
        </div>
        <div className="signup-actions">
          <Button className="start-button" type="submit">Let’s Start</Button>
          <p id="privacy-note">Used only to verify your account and send delivery updates.</p>
        </div>
      </form>
    </main>}
        </div>
      </div>
    </div>
  )
}
