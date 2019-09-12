///<reference path="util.ts"/>
const buffer = {
  foragers: 0,
  foraging: 0,
  hunters: 0,
  hunting: 0,
  loggers: 0,
  wood: 0,
}

const printScore = () => {
  const days = (date.getTime() - initialDate.getTime()) / (1000 * 60 * 60 * 24)
  const left = $('#leave').disabled
  const completed = $a('.project.done').length

  const score = [
    'Days taken', days,
    'Population saved', population.total,
    'Projects completed', completed,
    'Went back to the sea', left ? 'Yes' : 'No',
  ]

  if (left) {
    score.push('Survived wrath of god')
    score.push(godsWrath <= godsWrathThereshold ? 'Yes' : 'No')
  }

  const total = Math.ceil(
    (population.total * 25 + completed * 7 + (left ? 10 : 0)) * (1 - godsWrath) * (30 / days)
  )

  $('#score-board .modal .content').innerHTML = score.map(
    value => `<span>${value}</span>`
  ).join('') + `<p>Final Score</p><p>${total} pts</p>`
  show('#score-board')
  $('body').classList.add('blured')
}

const bring = (action, partySize, amount, risk) => () => {
  buffer[action] += amount
  initBuffer()
  const die = Math.random() < risk * attackChance
  if (!die) {
    population.ready += partySize
  } else {
    log(`Wild animals killed ${makeDeadPerson().name} while ${action == 'wood' ? 'logging' : action}`, 'red', '💀', 'info')
    population.ready += partySize - 1
    population.total -= 1
    blink('population', 'red')
  }

  if (!projects.weapons.unlocked && (die || action === 'hunting')) {
    projects.weapons.unlocked = true
    log('Hunters found dangerous animals; they could use some extra protection', 'blue', '🛡', 'info')
    blink('projects', 'blink')
    renderProject('weapons')
  }
  if (!huntingEnabled && (resources.food + buffer.foraging) > 80) {
    show('#hunt')
    blink('hunt', 'blink')
    huntingEnabled = true
    log('Animals were sighted far in the valleys, hunting may be possible.', 'blue', '🏹', 'info')
  }
  if (action === 'wood') {
    if (!projects.carpentry.unlocked && (resources.wood + buffer.wood) > 5) {
      projects.carpentry.unlocked = true
      log('Develop carpentry to process wood more efficiently', 'blue', '🔨', 'info')
      renderProject('carpentry')
      blink('projects', 'blink')
    }
    if (!smokeEnabled) {
      $('animate').beginElement()
      smokeEnabled = true
      log('The crew rejoices the arrival of wood for cooking and heating.', null, '🔥', 'info')
      dayEvents.push(() => {
        if (resources.wood > 0) {
          resources.wood = Math.max(0, resources.wood - 2)
          if (!projects.carpentry.done) {
            blink('wood', 'red')
          }
        }
      })
    }
  }

  updateView()
}

function restart () {
  $('body').classList.remove('blured')
  resetGame()
  init()
}

const handlers = {
  leave: () => {
    log(`${population.total} people board the caravela and get ready for departure`, null, '⛵️', 'info')
    $('#ship').classList.add('go')
    $('#leave').disabled = true
    hide('#fishTrail')
    hide('#boatTrail')
    population.ready = 0
    updateView()
    clearAllTimers()
  
    if (godsWrath > 0.2) {
      timeout(() => {
        log('A violent storm suddenly forms. The ship capsizes and sinks. There were no survivors.', null, '⛈', 'info')
        population.total = 0
        updateView()
        stopGame();
        timeout(printScore, 5000);
      }, 7000)
    } else {
      timeout(() => {
        log('The journey back was long. They experienced perfect weather and ideal winds.', null, '🌤', 'info')
        log('Fim.', null, '🌅', 'info')
        timeout(printScore, 5000);
      }, 7000)
    }
  },
  fetchWood: () => {
    const people = 1
    population.ready -= people
    const time = DAY * 0.6
    timeout(bring('wood', people, 3, 0.03), time)
    buffer.loggers++
    initBuffer()
    updateView()
    startTrail(time, 'forageTemplate', true)
  },
  
  pray: () => {
    population.ready -= 1
    isPraying = true
    timeout(() => {
      population.ready += 1
      isPraying = false
      godsWrath = godsWrath*0.7
      const person = getRandomPerson()
      log(`${person.name} is feeling envigorated after a day at the house of God. Praise the Lord!`, null, '✝️', 'info')
    }, DAY);
  },
  
  forage: () => {
    const people = 1
    population.ready -= people
    const time = DAY * 0.4
    timeout(bring('foraging', people, foragingReturns, 0), time)
    buffer.foragers++
    initBuffer()
    updateView()
    startTrail(time, 'forageTemplate', true)
  },
  
  hunt: () => {
    const people = 2
    population.ready -= people
    const time = DAY * 1.2
    timeout(bring('hunting', people, 20, 0.1), time)
    buffer.hunters += people
    initBuffer()
    updateView()
    startTrail(time, 'huntTrail', true)
  },

  restart: () => {
    if (confirm('Restart current game?')) {
      restart()
    }
  }
}

const setupClickHandlers = () => {
  $a('.actions button').forEach(b => {
    on(b, 'click', handlers[b.id])
  })
  on($('#projects'), 'click', () => {
    $('.projects').classList.toggle('closed')
    $('#requirements').innerText = null
  })
  on($('#score-board button'), 'click', restart)
}

const mapping = {
  wood: {
    r: 'wood', e: '🌳'
  },
  foraging: {
    r: 'food', e: '🌾'
  },
  hunting: {
    r: 'food', e: '🏹'
  }
}
const logTask = (value) => {
  if (buffer[value] < 1) return

  log(`+${buffer[value]}`, 'green', mapping[value].e, 'tasks')
  resources[mapping[value].r] += buffer[value]
  buffer[value] = 0
  blink(mapping[value].r, 'green')
}

const initBuffer = () => {
  clearInterval(bufferInterval)
  bufferInterval = setInterval(() => {
    ['foraging', 'hunting', 'wood'].forEach(logTask)

    if (buffer.foragers) {
      log(`${buffer.foragers}👤 went foraging.`, null, '🌾', 'tasks')
      buffer.foragers = 0
    }
    if (buffer.hunters) {
      log(`${buffer.hunters}👥 went hunting .`, null, '🏹', 'tasks')
      buffer.hunters = 0
    }
    if (buffer.loggers) {
      log(`${buffer.loggers}👤 went logging.`, null, '🌳', 'tasks')
      buffer.loggers = 0
    }

    updateView()
  }, bufferTimeout)
}

const blink = (resource, name) => {
  $(`#${resource}`).classList.add(name)
  timeout(() => {
    $(`#${resource}`).classList.remove(name)
  }, name === 'no' ? 400 : 100);
}

const updateFood = () => {
  let diff = resources.food - population.total
  blink('food', 'red')

  if (diff >= 0) {
    population.hungry = population.starving
    population.starving = 0
    resources.food = diff
  } else {
    const dead = Math.min(population.starving, -diff)
    if (dead > 0) {
      log(`${makePeopleDead(dead).map(p=>p.name).join(', ')} died from starvation.`, 'red', '💀', 'info')
      population.total -= dead
      population.ready -= dead
      population.starving = 0
      blink('population', 'red')
    }
    
    const starving = Math.min(population.hungry, -diff)
    population.hungry = Math.min(population.total - starving, -diff)
    if (starving > 0) {
      population.starving = starving
      log(`${starving} are starving and can't work.`, 'red', '😔', 'info')
    } else if (population.hungry > 0) {
      log(`${getRandomPerson().name} ${population.hungry > 2 ? `and ${population.hungry - 1} others are` : 'is'} getting hungry`, null, '💭', 'info')
    }
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
    log(`Your population was decimated. <strong>Restart?<strong>`, 'restart', '☠️', 'info')
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
