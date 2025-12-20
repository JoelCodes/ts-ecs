import { createFileRoute, Link } from '@tanstack/solid-router'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  return <ul>
    <li><Link to='/circles'>Circles</Link></li>
    <li><Link to='/chaser'>Chaser</Link></li>
  </ul>
}
