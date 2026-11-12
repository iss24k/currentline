import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Atom, BatteryCharging, BookOpen, Building2,
  ChevronDown, CircleHelp, Cpu, Crosshair, Droplets, Flame, Fuel, GitFork, Layers3, Maximize2,
  Minus, Move3d, Pause, Play, Plus, RotateCcw, Sun, UtilityPole, Wind, X, Zap, createElement,
} from 'lucide';

const library = {
  'arrow-down': ArrowDown, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, 'arrow-up-right': ArrowUpRight,
  atom: Atom, 'battery-charging': BatteryCharging, 'book-open': BookOpen, 'building-2': Building2,
  'chevron-down': ChevronDown, 'circle-help': CircleHelp, cpu: Cpu, crosshair: Crosshair, droplets: Droplets,
  flame: Flame, fuel: Fuel, 'git-fork': GitFork, layers: Layers3, maximize: Maximize2, minus: Minus,
  move: Move3d, pause: Pause, play: Play, plus: Plus, reset: RotateCcw, sun: Sun,
  'utility-pole': UtilityPole, wind: Wind, x: X, zap: Zap,
};

export function icon(name, size = 17) {
  return createElement(library[name], {
    width: size, height: size, 'stroke-width': 1.65, 'aria-hidden': 'true',
  }).outerHTML;
}
