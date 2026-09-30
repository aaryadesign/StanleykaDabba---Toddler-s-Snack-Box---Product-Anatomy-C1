import SetupBack from './SetupBack'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import './LocationScreen.css'

export default function LocationScreen({ onBack, pinCode, onPinChange, onContinue }) {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function submit(event) {
    event.preventDefault()
    if (!/^[1-9]\d{5}$/.test(pinCode)) {
      setError('Enter a valid 6-digit PIN code.')
      setNotice('')
      return
    }
    setError('')
    onContinue()
  }

  function skip() {
    setError('')
    onContinue()
  }

  return (
    <main className="location-screen" aria-labelledby="location-title">
      <div className="status-bar" aria-hidden="true"><span>9:41</span><img src="/assets/status-dark.svg" alt="" width="66.661" height="11.336" /></div>
      <header className="location-header"><SetupBack onBack={onBack} /><button type="button" onClick={skip}>skip.</button></header>
      <div className="location-art" aria-hidden="true">
        <img className="location-body" src="/assets/location-body.svg" alt="" />
        <img className="location-cheek left" src="/assets/location-cheek-left.svg" alt="" />
        <img className="location-cheek right" src="/assets/location-cheek-right.svg" alt="" />
        <img className="location-eye left" src="/assets/location-eye-left.svg" alt="" />
        <img className="location-eye right" src="/assets/location-eye-right.svg" alt="" />
        <img className="location-mouth" src="/assets/location-mouth.svg" alt="" />
      </div>
      <div className="location-copy"><h1 id="location-title">Where do you live?</h1><p>So we can check if we deliver to your area.</p></div>
      <form className="location-form" onSubmit={submit} noValidate>
        <div className="location-field">
          <label htmlFor="pin-code">Enter your pin code</label>
          <Input id="pin-code" name="postal-code" autoComplete="postal-code" inputMode="numeric" maxLength={6} placeholder="380061" value={pinCode} aria-invalid={!!error} aria-describedby={error ? 'pin-error' : undefined}
            onChange={(event) => { onPinChange(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); setNotice('') }} />
          {error && <p className="location-error" id="pin-error" role="alert">{error}</p>}
        </div>
        <p className="location-notice" role="status">{notice}</p>
        <Button type="submit" className="location-next">Next</Button>
      </form>
    </main>
  )
}
