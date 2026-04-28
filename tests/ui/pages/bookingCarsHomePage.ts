import { expect, type Locator, type Page } from '@playwright/test';
import { env } from '../../config/env';

export class BookingCarsHomePage {
  private readonly page: Page;
  private readonly url = env.bookingCarsUrl;

  private readonly pickUpInput: Locator;
  private readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pickUpInput = page
      .locator('#ss')
      .or(page.getByRole('combobox', { name: /pick-?up|location/i }))
      .first();
    this.searchButton = page
      .getByRole('button', { name: /search/i })
      .or(page.locator('button[type="submit"]'))
      .first();
  }

  async open(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    await this.acceptCookiesIfShown();
  }

  async acceptCookiesIfShown(): Promise<void> {
    await this.page.locator('#onetrust-accept-btn-handler').click({ timeout: 7000 }).catch(async () => {
      // Fallback: click directly by id to avoid visibility/scroll edge cases.
      await this.page.evaluate(() => {
        const btn = document.getElementById('onetrust-accept-btn-handler') as HTMLButtonElement | null;
        btn?.click();
      });
    });
  }

  async searchCarsInCity(city: string): Promise<void> {
    await expect(this.pickUpInput).toBeVisible();
    await this.pickUpInput.fill(city);

    const citySuggestion = this.page.getByRole('option', { name: new RegExp(city, 'i') }).first();
    await expect(citySuggestion).toBeVisible();
    await citySuggestion.click();

    await this.searchButton.click();
  }

  async selectPickUpLocation(query: string, exactOption: string): Promise<void> {
    await expect(this.pickUpInput).toBeVisible();
    const iataCodeMatch = exactOption.match(/\(([A-Z]{3})\)/i);
    const iataCode = iataCodeMatch?.[1]?.toUpperCase();

    // Scope to location autocomplete only. Global [role="option"] also catches unrelated options.
    const suggestionsList = this.page
      .locator(
        '[role="listbox"]:has([role="option"]), [data-testid*="autocomplete"]:has([role="option"]), [id*="autocomplete"]:has([role="option"])'
      )
      .first();

    // Some runs do not open dropdown on typing alone. Force-open via keyboard and retry once.
    let suggestionsVisible = false;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.pickUpInput.click();
      await this.pickUpInput.fill('');
      await this.pickUpInput.type(query, { delay: 70 });
      await this.pickUpInput.press('ArrowDown').catch(() => {});

      suggestionsVisible = await suggestionsList.isVisible({ timeout: 5000 }).catch(() => false);
      if (suggestionsVisible) {
        break;
      }
    }

    await expect(suggestionsList).toBeVisible({ timeout: 10_000 });

    const optionCandidates = suggestionsList.locator('[role="option"]');
    await expect(optionCandidates.first()).toBeVisible({ timeout: 10_000 });
    const jfkOption = iataCode
      ? optionCandidates.filter({ hasText: new RegExp(`\\(${iataCode}\\)|\\b${iataCode}\\b`, 'i') }).first()
      : optionCandidates.filter({ hasText: exactOption }).first();

    await jfkOption.click({ timeout: 5000 });
  }

  async selectDateRangeByMonthName(
    pickupDay: number,
    dropoffDay: number,
    monthName: string
  ): Promise<void> {
    const dateField = this.page
      .getByRole('button', { name: /pick-?up date|drop-?off date|date/i })
      .or(this.page.locator('[data-testid*="date"], [data-ui-name*="date"]'))
      .first();

    await expect(dateField).toBeVisible();
    await dateField.click();

    const pickupDateCell = this.page
      .getByRole('checkbox', { name: new RegExp(`\\b${pickupDay}\\b.*${monthName}`, 'i') })
      .first();
    await expect(pickupDateCell).toBeVisible();
    await pickupDateCell.click();

    const dropoffDateCell = this.page
      .getByRole('checkbox', { name: new RegExp(`\\b${dropoffDay}\\b.*${monthName}`, 'i') })
      .first();
    await expect(dropoffDateCell).toBeVisible();
    await dropoffDateCell.click();
  }

  async clickSearch(): Promise<void> {
    await expect(this.searchButton).toBeVisible();
    await this.searchButton.click();
  }
}
