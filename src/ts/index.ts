///<reference path="util.ts"/>
///<reference path="data.ts"/>
///<reference path="draw.ts"/>
///<reference path="actions.ts"/>
///<reference path="projects.ts"/>
let dayInterval, dayCycleInterval
const stopGame = () => {
  clearInterval(dayInterval)
  clearInterval(dayCycleInterval)
  $('#island').style.filter = 'brightness(.5) contrast(1.0) saturate(0)'
}
const pauseGame = () => {
  clearInterval(dayInterval)
  clearInterval(dayCycleInterval)
  $('#days').classList.add('paused')
}
const resumeGame = () => {
  dayInterval = setInterval(nextDay, DAY)
  dayCycleInterval = setInterval(dayCycle, DAY / 2)
  $('#days').classList.remove('paused')
}
const startGame = () => {
  resumeGame()
  updateDate()
  updateView()
  renderProject('caravela')
  initBuffer()
  setupClickHandlers()

  log('People settled by the sea.', null, '⛺️', 'info')
  setTimeout(() => {
    log('A scouting team has found good foraging grounds nearby.', 'blue', '🌾', 'info')
    show('#forage')
    blink('forage', 'blink')
  }, 2000)

  setTimeout(() => {
    log('Rudimentary axes make it now possible to gather wood.', 'blue', '🌳', 'info')
    show('#chop-wood')
    blink('chop-wood', 'blink')
  }, DAY)

  setTimeout(() => {
    log('The river delta could provide you with food if you would develop fishing.', 'blue', '🐟', 'info')
    blink('projects', 'blink')
    renderProject('fishing')
  }, DAY * 2)

  on($('#projects'), 'click', () => {
    $('.projects').classList.toggle('closed')
    $('#requirements').innerText = null
  })
}

on($('.intro button'), 'click', () => {
  updateDate()
  updateView()
  $('.intro').classList.add('closed')
  $('#sail').beginElement()
  setTimeout(() => {
    $('#sink').beginElement()
    $('#sinkRotate').beginElement()
  }, 2000)
  document.body.style.setProperty('--v', '1');
  
  setTimeout(startGame, 3000)
})