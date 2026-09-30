import './HomeScreen.css'
const Icon = ({ file, ...props }) => <img src={`/assets/dash-${file}`} alt="" {...props} />
export default function BoxReturns({ onHistory }) {
  return (
    <section className="home-returns"><header><div><h2>Secure your next ₹100,</h2><p>get your box ready for return!</p></div><button onClick={onHistory}><Icon file="e211a.svg" />History</button></header><div className="return-days">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => <div className={`return-day day-${index}`} key={day}><span>{day}</span>{index === 3 && <Icon file="9ebc5.svg" className="return-today" />}<div><span className="return-icon"><Icon file={index === 0 || index === 2 ? 'bdbb6.svg' : index === 1 ? 'd3316.svg' : '52c3e.svg'} /></span><strong>{17 + index}</strong></div></div>)}</div><footer><span><strong>₹200</strong> secured so far</span><span><strong>2/3</strong> box returned</span></footer></section>
  )
}

