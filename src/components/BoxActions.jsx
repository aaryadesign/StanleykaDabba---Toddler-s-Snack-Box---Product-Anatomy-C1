import { Button } from '@/components/ui/button'

export default function BoxActions({ onPanel }) {
  return <footer className="box-actions" aria-label="Box management">
    <Button className="box-change-items" onClick={() => onPanel({ title: 'Change items', text: 'Item customisation is the next step in this prototype. Your current box has not been changed.' })}>Change items</Button>
    <button type="button" className="box-manage-plan" onClick={() => onPanel({ title: 'Pause or cancel', text: 'Subscription management is not connected yet. Your plan remains unchanged.' })}>Pause or cancel subscription <span aria-hidden="true">›</span></button>
  </footer>
}
