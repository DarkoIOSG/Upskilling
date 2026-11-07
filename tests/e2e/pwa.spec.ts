import { expect, test } from '@playwright/test';
test.skip(!process.env.TEST_PRODUCTION, 'Offline caching is enabled in the production build only.');
test('production SQL loads, runaway query stops, and loaded tools work offline', async ({
  page,
  context,
}) => {
  await page.goto('/#study');
  await expect(page.getByRole('heading', { name: 'Your first query' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page
    .getByRole('textbox', { name: 'SQL query' })
    .fill('WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n) SELECT SUM(x) FROM n;');
  await page.getByRole('button', { name: 'Run query', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('took too long', { timeout: 8000 });
  await page
    .getByRole('textbox', { name: 'SQL query' })
    .fill('SELECT name, salary FROM employees;');
  await page.getByRole('button', { name: 'Run query', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Alex', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your first query' })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'SQL query' })
    .fill('SELECT name, salary FROM employees;');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('heading', { name: 'You’ve got it.' })).toBeVisible();
  await context.setOffline(false);
});
