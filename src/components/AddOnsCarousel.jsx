import { useEffect, useRef } from 'react'
import './AddOnsCarousel.css'

// Quantity indices remain stable across every screen using this catalogue.
const products = [
  { index: 0, name: 'Guava & Chia', detail: 'Cold-pressed • 120ml', image: '5e5ce.png' },
  { index: 2, name: 'Mango & Passionfruit', detail: 'Fresh • 150ml', image: 'e5e0c.png' },
  { index: 1, name: 'Guava & Chia', detail: 'Cold-pressed • 120ml', image: '24779.png' },
]

export default function AddOnsCarousel({ className = '', quantities, onQuantityChange, onExplore, notice }) {
  const carouselRef = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    const carousel = carouselRef.current
    function wheel(event) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? carousel.clientWidth : 1)
      const max = carousel.scrollWidth - carousel.clientWidth
      if ((delta > 0 && carousel.scrollLeft < max - 1) || (delta < 0 && carousel.scrollLeft > 1)) {
        event.preventDefault()
        carousel.scrollLeft += delta
      }
    }
    carousel.addEventListener('wheel', wheel, { passive: false })
    return () => carousel.removeEventListener('wheel', wheel)
  }, [])

  function startDrag(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button')) return
    const carousel = event.currentTarget
    drag.current = { x: event.clientX, left: carousel.scrollLeft, scale: carousel.getBoundingClientRect().width / carousel.offsetWidth }
    carousel.setPointerCapture(event.pointerId)
    carousel.classList.add('is-dragging')
    event.preventDefault()
  }

  function moveDrag(event) {
    if (!drag.current) return
    event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x) / drag.current.scale
  }

  function endDrag(event) {
    drag.current = null
    event.currentTarget.classList.remove('is-dragging')
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function scrollWithKeyboard(event) {
    if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    event.currentTarget.scrollBy({ left: event.key === 'ArrowRight' ? 150 : -150, behavior: 'smooth' })
  }

  return <section className={`addons-section ${className}`}>
    <header><h2>Yummy Add-Ons</h2><button type="button" onClick={onExplore}>Explore All (12)</button></header>
    <p>Tucked right into tomorrow's box</p>
    <div ref={carouselRef} className="addon-carousel" role="region" aria-label="Add-ons, scroll horizontally for more" tabIndex={0} onKeyDown={scrollWithKeyboard} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      {products.map(({ index, name, detail, image }) => <article className="addon-card" key={image}>
        <div className={`addon-image addon-image-${index}`}><img src={`/assets/dash-${image}`} alt={name} draggable={false} /></div>
        <h3 title={name}>{name}</h3><p>{detail}</p>
        <footer><strong>₹65</strong>
          {quantities[index] ? <div className="addon-quantity">
            <button type="button" aria-label={`Remove ${name} item ${index + 1}`} onClick={() => onQuantityChange(index, -1)}>−</button>
            <span aria-live="polite">{quantities[index]}</span>
            <button type="button" aria-label={`Add another ${name} item ${index + 1}`} onClick={() => onQuantityChange(index, 1)}>+</button>
          </div> : <button type="button" aria-label={`Add ${name} item ${index + 1}`} onClick={() => onQuantityChange(index, 1)}>+ Add</button>}
        </footer>
      </article>)}
    </div>
    {notice && <p className="addon-notice" role="status">{notice}</p>}
  </section>
}
