import SetupBack from './SetupBack'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import './PlanScreen.css'

const plans = [
  { id: 'monthly', name: 'Monthly', description: 'Get a box delivered everyday for a month. (5 days a week)', price: '₹3,999', previousPrice: '₹ 4,499' },
  { id: 'weekly', name: 'Weekly', description: 'Get a box delivered everyday for a week. (5 days a week)', price: '₹999' },
]

export default function PlanScreen({ onBack, onSkip, selectedPlan, onPlanChange, onContinue }) {
  const [notice, setNotice] = useState('')
  return (
    <main className="plan-screen" aria-labelledby="plan-title">
      <div className="status-bar" aria-hidden="true"><span>9:41</span><img src="/assets/status-dark.svg" alt="" width="66.661" height="11.336" /></div>
      <header className="plan-header"><SetupBack onBack={onBack} /><button type="button" onClick={onSkip}>skip.</button></header>
      <div className="plan-character" aria-hidden="true">
        <img className="plan-body" src="/assets/plan-body.svg" alt="" />
        <img className="plan-cheek left" src="/assets/plan-cheek.svg" alt="" />
        <img className="plan-cheek right" src="/assets/plan-cheek.svg" alt="" />
        <img className="plan-eye left" src="/assets/plan-eye-left.svg" alt="" />
        <img className="plan-eye right" src="/assets/plan-eye-right.svg" alt="" />
        <div className="plan-mouth-position"><div className="plan-mouth-rotation"><img src="/assets/plan-mouth.svg" alt="" /></div></div>
      </div>
      <h1 id="plan-title">Choose your Plan</h1>
      <div className="plan-options" role="radiogroup" aria-label="Subscription plan">
        {plans.map(plan => <label className={`plan-option${selectedPlan === plan.id ? ' selected' : ''}`} key={plan.id}>
          <input type="radio" name="subscription-plan" value={plan.id} checked={selectedPlan === plan.id} onChange={() => { onPlanChange(plan.id); setNotice('') }} />
          <span className="plan-copy"><span className="plan-name">{plan.name}</span><span className="plan-description">{plan.description}</span></span>
          <span className="plan-price">{plan.previousPrice && <del>{plan.previousPrice}</del>}<strong>{plan.price}</strong></span>
        </label>)}
        <section className="plan-deposit" aria-labelledby="deposit-title"><h2 id="deposit-title">Returnable amount</h2><p><strong>₹999</strong> of this plan is a deposit. Only a portion of this deposit is refundable, based on the boxes you return clean. The full deposit is not refundable.</p></section>
      </div>
      <Button className="plan-checkout" disabled={!selectedPlan} onClick={onContinue}>Explore my boxes</Button>
      <p className="plan-notice" role="status">{notice || 'Preview only. No payment is collected.'}</p>
    </main>
  )
}
