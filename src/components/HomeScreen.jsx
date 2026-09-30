import useSessionState from '../hooks/useSessionState'
import ProfileScreen from './ProfileScreen'
import { UserRound } from 'lucide-react'
import MyBoxesScreen from '@/components/MyBoxesScreen'
import ChildSwitcher from '@/components/ChildSwitcher'
import AddOnsCarousel from '@/components/AddOnsCarousel'
import BoxReturns from '@/components/BoxReturns'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import KidPreferences from './KidPreferences'
import MyKidsScreen from './MyKidsScreen'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import './HomeScreen.css'
import BoxDetailScreen from '@/components/BoxDetailScreen'

const asset = file => `/assets/dash-${file}`
const Icon = ({ file, ...props }) => <img src={asset(file)} alt="" {...props} />
export default function HomeScreen({ childProfiles, preferences, onPreferencesChange, selectedPlan, phone, onAddChild }) {
  const screenRef = useRef(null)
  const scroll = useRef(null)
  const tomorrow = useRef(null)
  const kids = useRef(null)
  const [account, setAccount] = useSessionState('account', { name: '', reminders: true })
  const [activeNav, setActiveNav] = useSessionState('navigation', 'Home')
  const [showBox, setShowBox] = useState(false)
  const [panel, setPanel] = useState(null)
  const [selectedChild, setSelectedChild] = useState(0)
  const [childQuantities, setChildQuantities] = useSessionState('addon-quantities', {})
  const quantities = childQuantities[selectedChild] || [0, 0, 0]
  const [notice, setNotice] = useState('')
  const profiles = childProfiles.length ? childProfiles : [{ name: 'Your little one' }]
  function navigate(name) {
    setActiveNav(name)
    if (name === 'My box' || name === 'My Kids' || name === 'Profile') return
    const top = name === 'Home' ? 0 : (name === 'My box' ? tomorrow.current : kids.current).offsetTop - 12
    scroll.current.scrollTo({ top, behavior: 'smooth' })
  }
  function changeQuantity(index, delta) { setChildQuantities(current => ({ ...current, [selectedChild]: (current[selectedChild] || [0, 0, 0]).map((count, i) => i === index ? Math.max(0, count + delta) : count) })); setNotice('Demo box updated. No purchase has been made.') }
  return <main ref={screenRef} className="home-screen" aria-label="Snack box home">
    <div className="status-bar" aria-hidden="true"><span>9:41</span><img src="/assets/status.svg" alt="" width="66.661" height="11.336" /></div>
    <div className="home-scroll" ref={scroll} inert={showBox || activeNav !== 'Home'}>
      <section className="home-delivery">
        <header className="home-address"><button onClick={() => setPanel({ title: 'Delivery address', text: 'Swarushi Apartment, 42 Maple Ave, Ahmedabad. Sample address shown for this prototype.' })}><Icon file="f3e18.png" className="home-house" /><span><strong>Swarushi Apartment <Icon file="6e08f.svg" /></strong><small>42 Maple Ave, Ahmedabad</small></span></button><button className="home-avatar" aria-label="Your profile" onClick={() => navigate('Profile')} /></header>
        <Icon file="a73fa.svg" className="home-divider" />
        <div className="delivery-arrival"><Icon file="3a50e.svg" /><div><h1>Snacks arriving in 12mins</h1><p>Get your empty boxes ready for collection.</p></div></div>
        <ChildSwitcher profiles={profiles} selectedIndex={selectedChild} onSelect={index => { setSelectedChild(index); setNotice('') }} />
        <div className="driver-card"><div className="driver-row"><Icon file="6ea5a.png" className="driver-photo" /><div className="driver-info"><div>Vikram S. <span className="driver-rating"><Icon file="d7158.svg" />4.9</span></div><p>2 bento boxes</p><p className="driver-distance">1.2 kms away <Icon file="96e43.svg" /> on-time</p></div><div className="driver-actions"><button aria-label="Message driver" onClick={() => setPanel({ title: 'Message Vikram', text: 'Driver messaging is not connected in this prototype.' })}><Icon file="a30b8.svg" /></button><button aria-label="Call driver" onClick={() => setPanel({ title: 'Call Vikram', text: 'Driver calling is not connected in this prototype.' })}><Icon file="60192.svg" /></button></div></div>
          <div className="delivery-map" role="img" aria-label="Demo delivery route in Ahmedabad, 12 minutes away"><Icon file="dbfa7.png" className="map-image" /><span className="map-rider"><Icon file="557ef.png" /></span><Icon file="1aaa0.svg" className="map-route" /><span className="map-time">12 mins away</span></div>
        </div>
      </section>
      <section className="home-tomorrow" ref={tomorrow}><header><div><h2>Tomorrow’s Box</h2><p>changes won’t be allowed after <strong>02:05 h</strong></p></div><button aria-label="Tomorrow’s box options" onClick={() => setPanel({ title: 'Tomorrow’s box', text: 'Moong Dal & Paneer Mini Idlis · Thu, Oct 24 · 9AM drop. Sample schedule for this prototype.' })}><Icon file="fb7c7.svg" /></button></header><div className="tomorrow-meal" role="button" tabIndex={0} aria-label="View tomorrow's box" onClick={() => setShowBox(true)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setShowBox(true) } }}><div className="tomorrow-food"><Icon file="45ccd.png" /></div><span className="tomorrow-date">Thu, Oct 24 • 9AM Drop</span><h3>Moong Dal &amp; Paneer Mini Idlis</h3><p>Soft steamed lentil and paneer bites, served with mashed banana.</p><ul>{['Moong Dal', 'Fruits', 'Paneer', 'Ghee', 'Grated carrot', '+3'].map(item => <li key={item}>{item}</li>)}</ul></div></section>
      <AddOnsCarousel className="home-addons" quantities={quantities} onQuantityChange={changeQuantity} notice={notice} onExplore={() => setPanel({ title: 'Yummy Add-Ons', text: 'The three preview items are available below. The full 12-item catalogue is not connected yet.' })} />
      <BoxReturns onHistory={() => setPanel({ title: 'Return history', text: 'Mon 17 and Wed 19: boxes returned. ₹200 secured, 2 of 3 boxes returned. Demo history.' })} />
      <div ref={kids} className="home-kids"><KidPreferences key={`${activeNav}-${selectedChild}`} profile={{ ...profiles[selectedChild], id: selectedChild }} value={preferences[selectedChild] || {}} onChange={value => onPreferencesChange(selectedChild, value)} /></div>
    </div>
    {activeNav === 'My box' && <div inert={showBox}><MyBoxesScreen profiles={profiles} selectedChild={selectedChild} onChildChange={setSelectedChild} onBack={()=>navigate('Home')} onDetails={()=>setShowBox(true)} onPanel={setPanel}/></div>}
    {activeNav === 'My Kids' && <MyKidsScreen onAddChild={onAddChild} profiles={childProfiles} preferences={preferences} onPreferencesChange={onPreferencesChange} onBack={() => navigate('Home')} onPanel={setPanel} />}
    {activeNav === 'Profile' && <ProfileScreen onAddChild={onAddChild} profiles={childProfiles} phone={phone} selectedPlan={selectedPlan} account={account} onAccountChange={setAccount} onNavigate={navigate} onPanel={setPanel} />}
    <nav className="home-nav" aria-label="Main navigation" inert={showBox}>{[['Home', '3df57.svg'], ['My box', '42133.svg'], ['My Kids', 'ee208.svg'], ['Profile', '3d0bb.svg']].map(([name, file]) => <button key={name} aria-current={activeNav === name ? 'page' : undefined} onClick={() => navigate(name)}>{name === 'Profile' && activeNav === 'Profile' ? <UserRound size={24} strokeWidth={1.8} aria-hidden="true" /> : <img src={name === 'Home' && activeNav !== 'Home' ? '/assets/mybox-1535b.svg' : name === 'My box' && activeNav === 'My box' ? '/assets/mybox-d80fc.svg' : name === 'My Kids' && activeNav === 'My Kids' ? '/assets/kids-nav.svg' : asset(file)} alt="" />}<span>{name}</span></button>)}</nav>
    {showBox && <div className="home-box-detail"><BoxDetailScreen preferences={preferences} quantities={quantities} onQuantityChange={changeQuantity} profiles={profiles} selectedChild={selectedChild} onChildChange={index => { setSelectedChild(index); setNotice('') }} onBack={() => { setShowBox(false) }} /></div>}
    <DialogPrimitive.Root open={!!panel} onOpenChange={open => { if (!open) setPanel(null) }}>
      <DialogPrimitive.Portal container={screenRef}>
      <DialogPrimitive.Backdrop className="home-panel-backdrop" />
      <DialogPrimitive.Popup className="home-panel"><DialogPrimitive.Title>{panel?.title}</DialogPrimitive.Title><DialogPrimitive.Description>{panel?.text}</DialogPrimitive.Description><DialogPrimitive.Close render={<Button />}>Got it</DialogPrimitive.Close></DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  </main>
}
