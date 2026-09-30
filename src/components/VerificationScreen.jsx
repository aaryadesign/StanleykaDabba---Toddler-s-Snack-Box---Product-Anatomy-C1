import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

export default function VerificationScreen({ phone, onEditPhone, onVerified }) {
  const [digits, setDigits] = useState(Array(6).fill(''))
  const [remaining, setRemaining] = useState(80)
  const [notice, setNotice] = useState('Demo verification — no SMS is sent.')
  const inputs = useRef([])
  const formattedPhone = `+91 ${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`
  const complete = digits.every(Boolean)

  useEffect(() => {
    const interval = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(interval)
  }, [])

  function enterDigits(index, value) {
    const numbers = value.replace(/\D/g, '').slice(0, 6 - index)
    const next = [...digits]
    if (!numbers) next[index] = ''
    else [...numbers].forEach((digit, offset) => { next[index + offset] = digit })
    setDigits(next)
    setNotice('')
    if (numbers) inputs.current[Math.min(index + numbers.length, 5)]?.focus()
    // Prototype only: a complete six-digit entry advances without an SMS service.
    if (next.every(Boolean)) onVerified()
  }

  function handleKey(event, index) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      setDigits((current) => current.map((digit, position) => position === index - 1 ? '' : digit))
      inputs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      inputs.current[Math.max(0, Math.min(5, index + (event.key === 'ArrowLeft' ? -1 : 1)))]?.focus()
    }
  }

  function resend() {
    if (remaining) return
    setRemaining(80)
    setDigits(Array(6).fill(''))
    setNotice('New code requested in this demo. No SMS is sent.')
    inputs.current[0]?.focus()
  }

  return (
    <main className="verification-screen" aria-labelledby="verification-title">
      <div className="status-bar" aria-hidden="true">
        <span>9:41</span>
        <img src="/assets/status-dark.svg" alt="" width="66.661" height="11.336" />
      </div>
      <p className="verification-brand">Toddlers’ Snack box</p>
      <img className="verification-character" src="/assets/verify-character.svg" alt="" />
      <div className="verification-copy">
        <h1 id="verification-title">Verify your number</h1>
        <p>Use any 6 digits to preview signup for <button type="button" className="phone-edit" onClick={onEditPhone} aria-label={`Change phone number ${formattedPhone}`}>{formattedPhone}</button></p>
      </div>
      <div className="otp-inputs" role="group" aria-label="Six-digit verification code">
        {digits.map((digit, index) => (
          <Input key={index} ref={(element) => { inputs.current[index] = element }}
            className="otp-digit" aria-label={`Digit ${index + 1}`} type="text" inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'} value={digit}
            onChange={(event) => enterDigits(index, event.target.value)}
            onFocus={(event) => event.target.select()}
            onKeyDown={(event) => handleKey(event, index)}
            onPaste={(event) => { event.preventDefault(); enterDigits(index, event.clipboardData.getData('text')) }} />
        ))}
      </div>
      <p className="resend-copy">Didn’t receive the code?<br />click to <button type="button" onClick={resend} disabled={remaining > 0}>Resend</button>{remaining > 0 && ` in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} secs`}</p>
      <p className="verification-notice" role="status">{complete ? 'Code entered. Live verification is not connected in this prototype.' : notice}</p>
    </main>
  )
}
