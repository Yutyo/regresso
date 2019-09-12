///<reference path="util.ts"/>
const buffer = {
  foragers: 0,
  foraging: 0,
  hunters: 0,
  hunting: 0,
  loggers: 0,
  wood: 0,
}

const fetchWood = () => {
  const people = 1
  population.ready -= people
  const time = DAY * 0.6
  setTimeout(bring('wood', people, 3, 0.05), time)
  buffer.loggers++
  initBuffer()
  updateView()
  startTrail(time, 'forageTemplate', true)
}

const forage = () => {
  const people = 1
  population.ready -= people
  const time = DAY * 0.4
  setTimeout(bring('foraging', people, foragingReturns, 0), time)
  buffer.foragers++
  initBuffer()
  updateView()
  startTrail(time, 'forageTemplate', true)
}

const hunt = () => {
  const people = 2
  population.ready -= people
  const time = DAY * 1.2
  setTimeout(bring('hunting', people, 8, 0.1), time)
  buffer.hunters += people
  initBuffer()
  updateView()
  startTrail(time, 'huntTrail', true)
}

const bring = (action, partySize, amount, risk) => () => {
  buffer[action] += amount
  initBuffer()
  const die = Math.random() < risk * attackChance
  if (!die) {
    population.ready += partySize
  } else {
    log(`Wild animals killed 1 person while ${action == 'wood' ? 'logging' : action}`, 'red', '💀', 'info')
    population.ready += partySize - 1
    population.total -= 1
    bury()
    blink('population', 'red')
  }

  if (!projects.weapons.unlocked && (die || action === 'hunting')) {
    projects.weapons.unlocked = true
    log('Hunters found dangerous animals; they could use some extra protection', 'blue', '🛡', 'info')
    blink('projects', 'blink')
    renderProject('weapons')
  }
  if (action === 'foraging' && resources.food > 80 && !huntingEnabled) {
    show('#hunt')
    blink('hunt', 'blink')
    huntingEnabled = true
    log('Animals were sighted far in the valleys, hunting may be possible.', 'blue', '🏹', 'info')
  }
  if (action === 'wood' && !projects.carpentry.unlocked && resources.wood > 5) {
    projects.carpentry.unlocked = true
    log('Develop carpentry to process wood more efficiently', 'blue', '🔨', 'info')
    renderProject('carpentry')
    blink('projects', 'blink')
  }
  if (!smokeEnabled && action === 'wood') {
    $('animate').beginElement()
    smokeEnabled = true
    log('The crew rejoices the arrival of wood for cooking and heating.', null, '🔥', 'info')
    dayEvents.push(() => {
      if (resources.wood > 0) {
        resources.wood = Math.max(0, resources.wood - 2)
        blink('wood', 'red')
      }
    })
  }

  updateView()
}

const setupClickHandlers = () => {
  on($('#chop-wood'), 'click', () => fetchWood())
  on($('#forage'), 'click', () => forage())
  on($('#hunt'), 'click', () => hunt())
}


const initBuffer = () => {
  clearInterval(bufferInterval)
  bufferInterval = setInterval(() => {
    if (buffer.foraging) {
      log(`+${buffer.foraging}🍒.`, 'green', '🌾', 'tasks')
      resources.food += buffer.foraging
      buffer.foraging = 0
      blink('food', 'green')
    }
    if (buffer.hunting) {
      log(`+${buffer.hunting}🍒.`, 'green', '🏹', 'tasks')
      resources.food += buffer.hunting
      buffer.hunting = 0
      blink('food', 'green')
    }
    if (buffer.wood) {
      log(`+${buffer.wood}🌳.`, 'green', '🌳', 'tasks')
      resources.wood += buffer.wood
      buffer.wood = 0
      blink('wood', 'green')
    }

    if (buffer.foragers) {
      log(`${buffer.foragers}👤 left for foraging.`, null, '🌾', 'tasks')
      buffer.foragers = 0
    }
    if (buffer.hunters) {
      log(`${buffer.hunters}👥 left for hunting .`, null, '🏹', 'tasks')
      buffer.hunters = 0
    }
    if (buffer.loggers) {
      log(`${buffer.loggers}👤 left for logging.`, null, '🌳', 'tasks')
      buffer.loggers = 0
    }

    updateView()
  }, bufferTimeout)
}

const blink = (resource, name) => {
  $(`#${resource}`).classList.add(name)
  setTimeout(() => {
    $(`#${resource}`).classList.remove(name)
  }, name === 'no' ? 400 : 100);
}

const updateFood = () => {
  let diff = resources.food - population.total

  if (diff >= 0) {
    population.hungry = population.starving
    population.starving = 0
    resources.food = diff
  } else {
    const dead = Math.min(population.starving, -diff)
    if (dead > 0) {
      log(`${dead} died from starvation.`, 'red', '💀', 'info')
      population.total -= dead
      population.ready -= dead
      population.starving = 0
      blink('population', 'red')
      bury()
    }
    
    const starving = Math.min(population.hungry, -diff)
    if (starving > 0) {
      population.starving = starving
      log(`${starving} are starving and can't work.`, 'red', '😔', 'info')
    } else {
      log(`People are getting hungry`, null, '💭', 'info')
    }
    population.hungry = Math.min(population.total - starving, -diff)
    resources.food = 0
  }
}

const enoughPeople = (min) => {
  return (population.ready - population.starving) >= min
}

const nextDay = () => {
  updateDate()
  updateFood()
  
  if ((population.total) < 1) {
    log(`Your population was decimated`, 'red', '☠️', 'info')
    stopGame()
    updateView()
    return
  }


  dayEvents.forEach(event => event())

  updateView()
}

const dayCycle = () => {
  $('#island').classList.toggle('night')
}
