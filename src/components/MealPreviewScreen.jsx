import SetupBack from './SetupBack'
import { Button } from '@/components/ui/button'
import './MealPreviewScreen.css'

const ingredients = ['Moong Dal', 'Paneer', 'Grated carrot', 'Ghee', 'Banana']

export default function MealPreviewScreen({ onBack, onSkip, childName = 'your little one', onSubscribe }) {
  const notice = ''

  return (
    <main className="meal-screen" aria-labelledby="meal-title">
      <div className="status-bar" aria-hidden="true"><span>9:41</span><img src="/assets/status-dark.svg" alt="" width="66.661" height="11.336" /></div>
      <header className="meal-header"><SetupBack onBack={onBack} /><button type="button" onClick={onSkip}>skip.</button></header>
      <div className="meal-character" aria-hidden="true">
        <img className="meal-body" src="/assets/meal-body.svg" alt="" />
        <img className="meal-cheek left" src="/assets/meal-cheek-left.svg" alt="" />
        <img className="meal-cheek right" src="/assets/meal-cheek-right.svg" alt="" />
        <div className="meal-mouth-position"><div className="meal-mouth-rotation"><img src="/assets/meal-mouth.svg" alt="" /></div></div>
        <img className="meal-eye left" src="/assets/meal-eye-left.svg" alt="" />
        <img className="meal-eye right" src="/assets/meal-eye-right.svg" alt="" />
      </div>
      <h1 id="meal-title">Here's what {childName}<br />gets tomorrow</h1>
      <p className="meal-description">Sample meal preview. Covers roughly <strong>50%</strong> of {childName}'s daily protein &amp; nutrition need</p>
      <article className="meal-card" aria-labelledby="meal-name">
        <h2 id="meal-name">Moong Dal &amp;<br />Paneer Mini Idlis</h2>
        <p>Soft steamed lentil and paneer bites, served with mashed banana.</p>
        <img className="meal-box" src="/assets/meal-box.png" alt="Snack box with mini idlis and mashed banana" width="306" height="306" />
        <ul aria-label="Ingredients">{ingredients.map(ingredient => <li key={ingredient}>{ingredient}</li>)}</ul>
      </article>
      <Button className="meal-subscribe" onClick={onSubscribe}>Subscribe to get this delivered</Button>
      <p className="meal-notice" role="status">{notice}</p>
    </main>
  )
}
