const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs/promises')
const { chromium } = require('playwright-core')

const base = process.env.JOURNAL_TEST_URL || 'http://localhost:4190/'
const key = 'learning-compass.journal.v1'
const date = '2026-11-18'
const legacy = {
  observations: [{ id:'old-leaf', date, title:'An unusual leaf with purple spots.', place:'Garden', senses:'Rough', surprise:'' }],
  questions: [
    { id:'birds', date, title:'Why do birds fly in a flock?', observationId:'old-leaf' },
    { id:'ants', date, title:'How can ants carry such a heavy load?' },
    { id:'ice', date, title:'The ice is melting. What will happen next?' },
    { id:'fairness', date, title:'Is it fair if someone gets left out?' },
  ],
  explorations: [
    { id:'old-exploration', date, questionId:'birds', notes:['We guessed.','We watched.','','','','We saw a turn.','','A sketch.'] },
    { id:'old-draft', date, questionId:'ants', notes:['It looked heavy.','We saw an ant.','','','','','',''], resumeStep:1 },
  ],
}
const cases = [
  ['question/birds', 'What do you notice happening?'],
  ['question/ants', 'What do you notice happening?'],
  ['question/ice', 'What do you think might happen if we change one thing?'],
  ['observation/old-leaf', 'What catches your eye?'],
  ['question/fairness', 'How might someone else see this?'],
]

async function check(browser, width) {
  const page = await browser.newPage({ viewport:{ width, height:850 } })
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    const go = route => page.goto(base + '#' + route)
    const button = name => page.getByRole('button', { name, exact:true })
    const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
    const prompt = text => page.getByRole('heading', { name:text, exact:true, level:2 }).waitFor()
    const response = () => page.getByRole('textbox', { name:/Your child’s words/ })
    const openEntry = () => page.locator('.timeline details[open]')

    await go('today')
    await page.evaluate(([key, data]) => localStorage.setItem(key, JSON.stringify(data)), [key, legacy])
    await page.reload()
    for (const [route, first] of cases) {
      await go('explore/' + route)
      await prompt(first)
      assert.equal(await page.locator('form h2').count(), 1)
      assert.equal(await page.locator('textarea').count(), 0)
      await button('Another approach').click()
      assert.equal(await page.getByRole('group', { name:'Choose an approach' }).getByRole('button').count(), 4)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    }

    await go('explore/question/ice')
    await button('Skip invitation').click()
    await prompt('What changed when you watched?')
    await button('Skip invitation').click()
    await prompt('Would you like to draw what you noticed or sit quietly with it for a moment?')

    await go('explore/question/birds')
    await prompt(cases[0][1])
    await button('Just observe').click()
    await page.waitForURL(/#library\/birds$/)
    assert.equal((await read()).inquiries, undefined)

    await go('observe')
    const noticing = '  This leaf looks like a tiny umbrella!  '
    await page.getByRole('textbox', { name:'What did we notice?' }).fill(noticing)
    await button('Save observation').click()
    await openEntry().getByText('Suggested next step').waitFor()
    const observation = (await read()).observations[0]
    assert.equal(observation.title, noticing)
    await openEntry().getByRole('link', { name:'Explore this noticing' }).click()
    await prompt('What catches your eye?')
    await button('Save this moment').click()
    await openEntry().getByRole('link', { name:'Continue this inquiry' }).waitFor()
    let inquiry = (await read()).inquiries[0]
    assert.deepEqual(inquiry.moments, [])
    assert.deepEqual(inquiry.source, { kind:'observation', id:observation.id })
    assert.equal(inquiry.words, noticing)

    await page.reload()
    await openEntry().getByRole('link', { name:'Continue this inquiry' }).click()
    await prompt('What catches your eye?')
    await button('Skip invitation').click()
    await prompt('What does it remind you of?')
    await button('Another approach').click()
    await button('Circle of Viewpoints').click()
    await prompt('How might someone else see this?')
    await button('Try this').focus()
    await page.keyboard.press('Enter')
    const exact = '  I used to think it was smooth.\nNow I think it feels bumpy!  '
    await response().fill(exact)
    await button('Suggest what’s next').click()
    await prompt('Has your thinking changed?')
    await button('Try this').click()
    await response().fill('  I touched the bumps.  ')
    await page.locator('input[type=file]').setInputFiles(path.join(__dirname, '../public/leaves.jpg'))
    await page.getByAltText('Selected journal attachment').waitFor()
    await button('Just observe').click()
    await page.waitForURL(new RegExp('#library/' + inquiry.id + '$'))
    await openEntry().getByText('I touched the bumps.').waitFor()
    const saved = (await read()).inquiries[0]
    assert.equal(saved.id,inquiry.id)
    assert.deepEqual(saved.moments.map(moment => moment.response), [exact, '  I touched the bumps.  '])
    assert.match(saved.moments[1].photo, /^data:image\/jpeg/)
    assert.equal(saved.invitation.prompt, 'What did you see or hear that changed your mind?')
    await openEntry().getByRole('link', { name:'Continue this inquiry' }).click()
    await prompt(saved.invitation.prompt)

    await go('library/old-exploration')
    await openEntry().getByText('We saw a turn.').waitFor()
    await go('library/old-draft')
    await openEntry().getByRole('link', { name:'Resume exploration' }).click()
    assert.equal(await page.getByRole('textbox', { name:'What can we observe?' }).inputValue(), 'We saw an ant.')

    await go('wonder')
    await page.getByRole('textbox', { name:'What are we wondering?' }).fill('  Where is the moon hiding?  ')
    await button('Save question').click()
    await openEntry().getByRole('link', { name:'Explore this question' }).click()
    await prompt('What catches your eye?')
    await button('Save this moment').click()
    await openEntry().getByRole('link', { name:'View source question' }).waitFor()
    const download = page.waitForEvent('download')
    await button('Download JSON backup').click()
    const backup = JSON.parse(await fs.readFile(await (await download).path(), 'utf8'))
    const data = await read()
    assert.deepEqual(backup, { version:1, ...data })
    assert.deepEqual(data.explorations, legacy.explorations)
    assert.deepEqual(data.questions.slice(1), legacy.questions)
    assert.equal(data.questions[0].title, '  Where is the moon hiding?  ')
    assert.deepEqual(data.observations[1], legacy.observations[0])
    assert.deepEqual(errors, [])
    console.log('Adaptive and legacy inquiry checks passed at ' + width + ' px.')
  } finally {
    await page.close()
  }
}

;(async () => {
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH })
  try {
    for (const width of [390, 1280]) await check(browser, width)
  } finally {
    await browser.close()
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
