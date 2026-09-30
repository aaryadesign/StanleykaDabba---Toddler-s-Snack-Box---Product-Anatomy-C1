import ChildSwitcher from './ChildSwitcher'
import './MyBoxesScreen.css'
const title = 'Moong Dal & Paneer Mini Idlis'
const description = 'Soft steamed lentil and paneer bites, served with mashed banana.'
function Meal({ tomorrow, onOpen }) {
  return <div className={'tomorrow-meal' + (tomorrow ? '' : ' current-meal')} role="button" tabIndex={0} aria-label={tomorrow ? "View tomorrow's box" : "View today's box"} onClick={onOpen} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}>
    <div className="tomorrow-food"><img src="/assets/dash-45ccd.png" alt="" /></div>
    {tomorrow && <span className="tomorrow-date">Thu, Oct 24 • 9AM Drop</span>}
    <h3>{title}</h3><p>{description}</p><ul>{['Moong Dal','Fruits','Paneer','Ghee','Grated carrot','+3'].map(item => <li key={item}>{item}</li>)}</ul>
  </div>
}
export default function MyBoxesScreen({profiles, selectedChild, onChildChange, onBack, onDetails, onPanel}) {
  return <section className="myboxes-screen" aria-label="My Box overview">
    <div className="status-bar" aria-hidden="true"><span>8:45</span><img src="/assets/status-dark.svg" alt="" /></div>
    <header className="myboxes-header"><button aria-label="Back to home" onClick={onBack}><img src="/assets/box-123e4.svg" alt="" /></button><h1>My Box</h1><button aria-label="My box options" onClick={()=>onPanel({title:'My Box',text:'Choose a child to see their boxes and open tomorrow’s box to manage it.'})}><img src="/assets/box-74b47.svg" alt="" /></button></header>
    <div className="myboxes-scroll">
      <div className="box-child-selector"><ChildSwitcher profiles={profiles} selectedIndex={selectedChild} onSelect={onChildChange}/></div>
      <section className="myboxes-today"><header><h2>Today’s Box</h2><span>Arriving in 12 mins</span></header><Meal onOpen={()=>onPanel({title: `${profiles[selectedChild].name}’s box today`,text: title + '. Your demo delivery is arriving in 12 minutes.'})}/>
        <img className="myboxes-divider" src="/assets/mybox-ed455.svg" alt="" />
        <div className="driver-row"><img className="driver-photo" src="/assets/dash-6ea5a.png" alt="Vikram"/><div className="driver-info"><div>Vikram S. <span className="driver-rating"><img src="/assets/dash-d7158.svg" alt=""/>4.9</span></div><p>2 bento boxes</p><p className="driver-distance">1.2 kms away <img src="/assets/mybox-7fd26.svg" alt=""/> on-time</p></div><div className="driver-actions">{[['Message','4de1a'],['Call','2c765']].map(([label,file])=><button key={label} aria-label={label+' driver'} onClick={()=>onPanel({title:label+' Vikram',text:'Driver contact is not connected in this prototype.'})}><img src={'/assets/mybox-'+file+'.svg'} alt=""/></button>)}</div></div>
      </section>
      <section className="home-tomorrow"><header><div><h2>Tomorrow’s Box</h2><p>changes won’t be allowed after <strong>02:05h</strong></p></div><button aria-label="Tomorrow’s box options" onClick={onDetails}><img src="/assets/dash-fb7c7.svg" alt=""/></button></header><Meal tomorrow onOpen={onDetails}/></section>
      {[0,1,2,3].map(index=><article className="myboxes-history" key={index}><p className="myboxes-date">Thursday, Oct 24</p><div><div className="history-food"><div><img src="/assets/dash-45ccd.png" alt=""/></div></div><div><h2>{title}</h2><p>{description}</p><button onClick={()=>onPanel({title: `${profiles[selectedChild].name}’s previous box`,text:title+'. This is a sample box from the prototype history.'})}>View details</button></div></div></article>)}
    </div>
  </section>
}



