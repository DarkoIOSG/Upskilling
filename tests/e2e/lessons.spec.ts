import { expect, test } from '@playwright/test';

test('short lessons, tips, feedback and retries leave practice progress unchanged', async ({
  page,
}) => {
  await page.goto('/#path');
  const initialProgress = await page.evaluate(() => localStorage.getItem('upskilling.progress.v1'));
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Meet your data', exact: true }) })
    .getByRole('button', { name: 'Short lesson', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Meet your data', exact: true });
  await expect(
    dialog.getByText('Choose explicit columns. Make the order intentional.'),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Tips & tricks', exact: true }).click();
  await expect(dialog.getByText('Common mistake', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Check your understanding', exact: true }).click();
  const first = dialog
    .getByRole('group')
    .filter({ has: page.getByRole('radio', { name: 'Alphabetical by name', exact: true }) });
  const check = dialog.getByRole('button', {
    name: 'Check understanding, question 1',
    exact: true,
  });
  await expect(check).toBeDisabled();
  await first.getByRole('radio', { name: 'Alphabetical by name', exact: true }).check();
  await check.click();
  await expect(
    dialog.getByText('Correct answer: No guaranteed order', { exact: true }),
  ).toBeVisible();
  await expect(
    first.getByRole('radio', { name: 'Alphabetical by name', exact: true }),
  ).toBeDisabled();
  await dialog.getByRole('button', { name: 'Try question 1 again', exact: true }).click();
  await dialog.getByRole('radio', { name: 'No guaranteed order', exact: true }).check();
  await check.click();
  await dialog.getByRole('radio', { name: 'ORDER BY salary DESC, id ASC', exact: true }).check();
  await dialog
    .getByRole('button', { name: 'Check understanding, question 2', exact: true })
    .click();
  await expect(
    dialog.getByText('2 of 2 checks correct · Ready to put it into practice.'),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Short lesson', exact: true }).click();
  await dialog.getByRole('button', { name: 'Quick check (2)', exact: true }).click();
  await expect(
    dialog.getByText('2 of 2 checks correct · Ready to put it into practice.'),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(await page.evaluate(() => localStorage.getItem('upskilling.progress.v1'))).toBe(
    initialProgress,
  );
  // Focus wraps around visible controls, skipping buttons in hidden lesson sections.
  const close = dialog.getByRole('button', { name: 'Close dialog', exact: true });
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Put it into practice' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await dialog.getByRole('button', { name: 'Put it into practice' }).click();
  await expect(page.getByRole('heading', { name: 'Your first query', exact: true })).toBeVisible();
});

test('lesson help keeps SQL success guided and resets checks on a new question', async ({
  page,
}) => {
  await page.goto('/#study');
  await page.getByRole('button', { name: 'Understand the concept', exact: true }).click();
  await page.getByRole('button', { name: 'Quick check (2)', exact: true }).click();
  await page.getByRole('radio', { name: 'No guaranteed order', exact: true }).check();
  await page.getByRole('button', { name: 'Check understanding, question 1', exact: true }).click();
  await expect(page.getByText('1 of 2 checks correct', { exact: true })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'SQL query', exact: true })
    .fill('SELECT name, salary FROM employees;');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Nice work. Now you know the way.', exact: true }),
  ).toBeVisible();
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('upskilling.progress.v1')!),
  );
  expect(progress.attempts).toHaveLength(1);
  expect(progress.attempts[0]).toMatchObject({ correct: true, assisted: true });
  expect(progress.topics.select.masteredQuestions).toEqual([]);
  await page.getByRole('button', { name: 'Next question', exact: true }).click();
  await page.getByRole('button', { name: 'Understand the concept', exact: true }).click();
  await page.getByRole('button', { name: 'Quick check (2)', exact: true }).click();
  await expect(page.getByText('0 of 2 checks correct', { exact: true })).toBeVisible();
});

test('every concept has working lesson sections and understanding checks', async ({
  page,
}, testInfo) => {
  await page.goto('/#path');
  const lessons = page.getByRole('button', { name: 'Short lesson', exact: true });
  await expect(lessons).toHaveCount(16);
  for (let i = 0; i < 16; i++) {
    await lessons.nth(i).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('A way to think about it', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Tips & tricks', exact: true }).click();
    await expect(dialog.getByText('Common mistake', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Quick check (2)', exact: true }).click();
    await expect(dialog.getByRole('radio')).toHaveCount(6);
    await expect(
      dialog.getByRole('button', { name: 'Check understanding, question 1', exact: true }),
    ).toBeDisabled();
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    if (i === 0) {
      await dialog.screenshot({ path: `/tmp/upskilling-lesson-${testInfo.project.name}.png` });
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  }
});
