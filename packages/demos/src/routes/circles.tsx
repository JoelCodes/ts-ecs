import { createFileRoute } from "@tanstack/solid-router";
import { Circles } from "../games/Circles";

export const Route = createFileRoute('/circles')({
  component: Circles,
})

