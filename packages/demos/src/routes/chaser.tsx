import { createFileRoute } from '@tanstack/solid-router'
import { Chaser } from '../games/Chaser'

export const Route = createFileRoute('/chaser')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Chaser/>
}
