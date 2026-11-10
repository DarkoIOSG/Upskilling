import { expect, test } from '@playwright/test';

test('theory navigation, search, distinct explanations, and complete source mapping', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore database theory', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Database theory.', exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(40);
  await page.getByRole('textbox', { name: 'Search theory lessons' }).fill('BCNF');
  const card = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: '3NF, BCNF, and safe decomposition', exact: true }),
  });
  await card.getByRole('button', { name: 'Read lesson', exact: true }).click();
  await expect(page.getByText('Common mistake', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explain more simply', exact: true }).click();
  await expect(page.getByText('In simpler words', { exact: true })).toBeVisible();
  const simple = await page.locator('.theory-explanation').innerText();
  await page.getByRole('button', { name: 'Show a worked example', exact: true }).click();
  await expect(page.getByText('A worked example', { exact: true })).toBeVisible();
  expect(await page.locator('.theory-explanation').innerText()).not.toBe(simple);
  await page.getByRole('button', { name: 'Break it down', exact: true }).click();
  await expect(page.locator('.theory-explanation li')).toHaveCount(3);
  await page.screenshot({
    path: `/tmp/upskilling-theory-lesson-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Books & coverage', exact: true }).click();
  await expect(page.locator('.theory-coverage-row')).toHaveCount(27);
  await expect(
    page.getByRole('link', { name: 'Read the free textbook', exact: false }),
  ).toHaveAttribute('href', 'https://opentextbc.ca/dbdesign01/');
  await expect(
    page.getByRole('link', { name: 'Read the free monograph', exact: false }),
  ).toHaveAttribute('href', 'https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf');
  await page
    .locator('.theory-coverage-row')
    .last()
    .getByRole('button', { name: 'Put the architecture together', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Put the architecture together', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('missed theory, guided retry, independent evidence, retention, and SQL progress survive together', async ({
  page,
}) => {
  await page.goto('/#theory');
  await page.evaluate(() =>
    localStorage.setItem(
      'upskilling.progress.v1',
      JSON.stringify({
        version: 1,
        dailyGoal: 5,
        attempts: [
          {
            questionId: 'select-1',
            topicId: 'select',
            correct: true,
            assisted: false,
            at: Date.now(),
          },
        ],
        topics: {
          select: {
            masteredQuestions: ['select-1'],
            needsReview: false,
            dueAt: Date.now() + 86400000,
            interval: 1,
          },
        },
      }),
    ),
  );
  await page.reload();
  const first = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Why databases exist', exact: true }) });
  await first.getByRole('button', { name: 'Practice questions', exact: true }).click();
  const check = page.getByRole('button', { name: 'Check theory answer', exact: true });
  await expect(check).toBeDisabled();
  await page.getByRole('radio', { name: 'A violated foreign key', exact: true }).check();
  await check.click();
  await expect(
    page.getByRole('heading', { name: 'Let’s work through the idea.', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Correct answer:', { exact: true })).toBeVisible();
  await expect(page.getByText('In simpler words', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try this question again', exact: true }).click();
  await page.getByRole('radio', { name: 'Data redundancy', exact: true }).check();
  await check.click();
  await expect(
    page.getByRole('heading', { name: 'Good practice. Try another independently.', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next theory question', exact: true }).click();
  await page.getByRole('radio', { name: 'Coordinated concurrent updates', exact: true }).check();
  await check.click();
  await page.getByRole('button', { name: 'Next theory question', exact: true }).click();
  await page
    .getByRole('radio', { name: 'Revenue rose 10% after comparing monthly totals', exact: true })
    .check();
  await check.click();
  await page.getByRole('button', { name: 'Finish theory session', exact: true }).click();
  await expect(
    page.getByText('2 of 3 questions answered independently.', { exact: false }),
  ).toBeVisible();
  await page.reload();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('upskilling.progress.v1')!),
  );
  expect(stored.attempts).toHaveLength(5);
  expect(stored.topics.select.masteredQuestions).toEqual(['select-1']);
  expect(stored.topics['db-files'].masteredQuestions).toEqual(['db-files-2', 'db-files-3']);
  expect(stored.topics['db-files'].needsReview).toBe(true);
  await expect(first.getByText('67%', { exact: true })).toBeVisible();
  await expect(first.getByText('Review recommended', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Review theory', exact: true }).click();
  await page.getByRole('radio', { name: 'Data redundancy', exact: true }).check();
  await check.click();
  const reviewed = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('upskilling.progress.v1')!),
  );
  expect(reviewed.topics['db-files'].masteredQuestions).toHaveLength(3);
  expect(reviewed.topics['db-files'].needsReview).toBe(false);
  expect(reviewed.topics['db-files'].dueAt).toBeGreaterThan(Date.now());
  await page.goto('/#progress');
  await expect(
    page.getByRole('heading', { name: 'Database theory progress', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Why databases exist · Independent success', { exact: false }).first(),
  ).toBeVisible();
  expect(await page.locator('main').innerText()).not.toContain('undefined');
});

test('all theory lessons have working reading and help without granting mastery', async ({
  page,
}) => {
  await page.goto('/#theory');
  const initial = await page.evaluate(() => localStorage.getItem('upskilling.progress.v1'));
  const read = page.getByRole('button', { name: 'Read lesson', exact: true });
  await expect(read).toHaveCount(40);
  for (let i = 0; i < 40; i++) {
    await read.nth(i).click();
    await expect(page.locator('.theory-body')).not.toBeEmpty();
    await page.getByRole('button', { name: 'Explain more simply', exact: true }).click();
    await expect(page.locator('.theory-explanation')).not.toBeEmpty();
    await page.getByRole('button', { name: 'Show a worked example', exact: true }).click();
    await expect(page.getByText('A worked example', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Break it down', exact: true }).click();
    await expect(page.locator('.theory-explanation li')).toHaveCount(3);
    await expect(page.locator('.theory-readings a').first()).toHaveAttribute('href', /^https:\/\//);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('button', { name: 'All theory lessons', exact: true }).click();
  }
  expect(await page.evaluate(() => localStorage.getItem('upskilling.progress.v1'))).toBe(initial);
});

test('opening help before an answer stays guided and theory backups restore', async ({ page }) => {
  await page.goto('/#theory');
  await page
    .getByRole('article')
    .first()
    .getByRole('button', { name: 'Practice questions', exact: true })
    .click();
  await page.getByRole('button', { name: 'Explain this concept', exact: true }).click();
  await page.getByRole('radio', { name: 'Data redundancy', exact: true }).check();
  await page.getByRole('button', { name: 'Check theory answer', exact: true }).click();
  const saved = await page.evaluate(() => localStorage.getItem('upskilling.progress.v1')!);
  expect(JSON.parse(saved).attempts[0].assisted).toBe(true);
  expect(JSON.parse(saved).topics['db-files'].masteredQuestions).toEqual([]);
  await page.getByRole('button', { name: 'Open preferences', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toContain('upskilling-progress');
  await page.locator('input[type=file]').setInputFiles({
    name: 'theory.json',
    mimeType: 'application/json',
    buffer: Buffer.from(saved),
  });
  await expect(page.getByText('Progress imported successfully.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('upskilling.progress.v1'))).toBe(saved);
});
