import { expect, test } from '@playwright/test';
test('practice, remediation, independent mastery evidence and persistence', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible();
  await page.getByRole('button', { name: 'Start your first session' }).click();
  await expect(page.getByRole('heading', { name: 'Your first query' })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'SQL query' })
    .fill('SELECT name, salary FROM employees;');
  await page.getByRole('button', { name: 'Run query', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Alex', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('heading', { name: 'You’ve got it.' })).toBeVisible();
  await page.getByRole('button', { name: 'Next question', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Highest earners first' })).toBeVisible();
  await page.getByRole('textbox', { name: 'SQL query' }).fill('SELECT name FROM employees;');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('heading', { name: 'Let’s work through this.' })).toBeVisible();
  await expect(
    page.getByText('Choose explicit columns. Make the order intentional.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Walk me through the solution' }).click();
  await expect(
    page.getByText('SELECT name, salary FROM employees ORDER BY salary DESC, name ASC;', {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'SQL query' })
    .fill('SELECT name, salary FROM employees ORDER BY salary DESC, name ASC;');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(
    page.getByRole('heading', { name: 'Nice work. Now you know the way.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next question', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clear label' })).toBeVisible();
  await page.reload();
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('upskilling.progress.v1')!),
  );
  expect(data.attempts).toHaveLength(3);
  expect(data.topics.select.masteredQuestions).toEqual(['select-1']);
  await page.goto('/#progress');
  await expect(page.getByRole('heading', { name: 'Look how you’re growing.' })).toBeVisible();
  await expect(page.getByText('Guided success', { exact: false }).first()).toBeVisible();
});
test('advanced topic access, answer feedback, search and no horizontal overflow', async ({
  page,
}) => {
  await page.goto('/#path');
  await page.getByRole('button', { name: 'Interview', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search concepts' }).fill('performance');
  await expect(page.getByRole('heading', { name: 'Reason about performance' })).toBeVisible();
  await page.getByRole('article').getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Choose the composite index' })).toBeVisible();
  await page.getByRole('radio', { name: 'C (customer_id, ordered_at)' }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('heading', { name: 'You’ve got it.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('responsive overview, path and progress layouts', async ({ page }, testInfo) => {
  for (const route of ['overview', 'path', 'progress']) {
    await page.goto(`/#${route}`);
    await expect(page.locator('h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (route === 'overview')
      await page.screenshot({
        path: `/tmp/upskilling-${testInfo.project.name}.png`,
        fullPage: true,
      });
  }
});
test('preferences, valid backup import and invalid backup rejection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open preferences' }).click();
  await page.getByRole('button', { name: '10 questions' }).click();
  await expect(page.getByRole('button', { name: '10 questions' })).toHaveClass('selected');
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":5}'),
    });
  await expect(page.getByRole('status')).toContainText('not a valid');
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ version: 1, attempts: [], topics: {}, dailyGoal: 3 })),
    });
  await expect(page.getByRole('status')).toContainText('imported successfully');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('upskilling-progress');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('upskilling.progress.v1')!).dailyGoal,
    ),
  ).toBe(3);
});
