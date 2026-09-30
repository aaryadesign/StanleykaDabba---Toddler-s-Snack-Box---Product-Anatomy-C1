import BoxActions from './BoxActions'
import ChildSwitcher from '@/components/ChildSwitcher'
import AddOnsCarousel from '@/components/AddOnsCarousel'
import BoxReturns from '@/components/BoxReturns'
import { useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import './BoxDetailScreen.css'

const ingredients = [['Banana', 'db83c.png'], ['Paneer', 'be3f4.png'], ['Ghee', '4c496.png'], ['Moong Dal', '700a0.png'], ['Grated carrot', 'e5413.png']]
const nutrition = [
  ['calories', '180 kcal', 'about 17% of daily energy needs'], ['protein', '4g', 'about 32% of daily need'],
  ['healthy fats', '3g', 'from ghee and paneer'], ['carbohydrates', '20g', 'from dal, banana, and carrot'],
  ['iron', '1.5mg', 'supports growth and focus'], ['calcium', '60mg', 'for strong bones and teeth'],
  ['sugar', '4g natural', 'from banana, 0g added'], ['salt', '0mg added', 'kept out on purpose'],
]
const BoxIcon = ({ file, ...props }) => <img src={`/assets/box-${file}`} alt="" {...props} />

export default function BoxDetailScreen({ preferences = {}, profiles, selectedChild, onChildChange, onBack, quantities, onQuantityChange }) {
  const childName = profiles[selectedChild]?.name || 'Your little one'
  const allergies = preferences[selectedChild]?.allergies || []
  const screenRef = useRef(null)
  const [panel, setPanel] = useState(null)
  return <main className="box-screen" ref={screenRef} aria-label="Tomorrow’s box details">
    <div className="status-bar" aria-hidden="true"><span>8:45</span><img src="/assets/status-dark.svg" alt="" width="66.661" height="11.336" /></div>
    <header className="box-header"><button aria-label="Back to previous screen" onClick={onBack}><BoxIcon file="123e4.svg" /></button><div><h1>{childName}’s Box for tomorrow</h1><p>Thursday, Oct 24 <BoxIcon file="312ca.svg" />9 AM Drop</p></div><button aria-label="Box options" onClick={() => setPanel({ title: 'Box options', text: 'Use Change Items or Pause/ Cancel at the bottom to manage this demo box.' })}><BoxIcon file="74b47.svg" /></button></header>
    <div className="box-scroll">
      <div className="box-child-selector"><ChildSwitcher profiles={profiles} selectedIndex={selectedChild} onSelect={onChildChange} /></div>
      <section className="box-hero"><div className="box-hero-copy"><h2>Moong Dal &amp; Paneer Mini Idlis</h2><p>Soft steamed lentil and paneer bites, served with mashed banana.</p><div><span>30% Daily Nutrition</span><span>40% Daily Protein</span></div></div><div className="box-food"><BoxIcon file="2dd89.png" /></div></section>
      <section className="box-ingredients"><h2>Ingredients</h2><ul>{ingredients.map(([name, file], index) => <li key={name}><span className={`ingredient-icon ingredient-${index}`}><BoxIcon file={file} /></span>{name}</li>)}</ul></section>
      <section className="box-nutrition"><h2>What {childName} gets from this box</h2><div>{nutrition.map(([label, value, detail]) => <article key={label}><p>{label} <strong>{value}</strong></p><small>{detail}</small></article>)}</div></section>
      <section className="box-friendly"><h2>{childName}’s saved preferences</h2><p>These are the dietary preferences you selected. This sample box has not been checked against them.</p><div>{allergies.length ? allergies.map(item => <span key={item}>{item}</span>) : <span>No dietary preferences added</span>}</div></section>
      <AddOnsCarousel quantities={quantities} onQuantityChange={onQuantityChange} onExplore={() => setPanel({ title: 'Yummy Add-Ons', text: 'The three preview items are available below. The full 12-item catalogue is not connected yet.' })} />
      <BoxReturns onHistory={() => setPanel({ title: 'Return history', text: 'Mon 17 and Wed 19: boxes returned. ₹200 secured, 2 of 3 boxes returned. Demo history.' })} />
      <section className="box-delivery"><h2>Delivery by 9 AM</h2><div><img src="/assets/dash-f3e18.png" alt="" /><div><strong>Swarushi Apartment</strong><p>42 Maple Ave, Ahmedabad</p></div><button onClick={() => setPanel({ title: 'Delivery address', text: 'This is a sample delivery address. Address editing will be connected when its design is added.' })}>Change</button></div></section>
    </div>
    <BoxActions onPanel={setPanel} />
    <Dialog.Root open={!!panel} onOpenChange={open => { if (!open) setPanel(null) }}><Dialog.Portal container={screenRef}><Dialog.Backdrop className="home-panel-backdrop" /><Dialog.Popup className="home-panel"><Dialog.Title>{panel?.title}</Dialog.Title><Dialog.Description>{panel?.text}</Dialog.Description><Dialog.Close render={<Button />}>Got it</Dialog.Close></Dialog.Popup></Dialog.Portal></Dialog.Root>
  </main>
}

