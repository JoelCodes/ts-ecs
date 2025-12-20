import { Link } from '@tanstack/solid-router'

export default function Header() {

  return (
    <div class='navbar'>
      <Link to='/' class='btn btn-ghost'>Home</Link>
      <Link to='/circles'>Circles</Link>
      <Link to='/chaser'>Chaser</Link>
    </div>
  )
}
