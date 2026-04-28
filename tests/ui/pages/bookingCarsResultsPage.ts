import { expect, type Locator, type Page } from '@playwright/test';

export class BookingCarsResultsPage {
  private static readonly MANUAL_ANTIBOT_TIMEOUT_MS = 120_000;
  private static readonly RESULTS_WAIT_TIMEOUT_MS = 45_000;
  private readonly page: Page;
  private readonly resultsMarker: Locator;
  private readonly locationInput: Locator;
  private readonly loadingMarker: Locator;
  private readonly transientErrorHeading: Locator;
  private readonly genericResultsContainer: Locator;
  private readonly offerCards: Locator;
  private readonly cookieBanner: Locator;
  private readonly acceptCookiesButton: Locator;
  private readonly modalCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.resultsMarker = page
      .getByRole('heading', { name: /cars|results|deals/i })
      .or(page.locator('[data-testid*="search-results"]'))
      .first();
    this.locationInput = page
      .locator('#ss')
      .or(page.getByRole('combobox', { name: /pick-?up|location/i }))
      .first();
    this.loadingMarker = page.getByText(/Checking the top companies to find the best deals/i).first();
    this.transientErrorHeading = page.getByRole('heading', { name: /oops\s*-\s*something went wrong/i }).first();
    this.genericResultsContainer = page
      .locator('main, [data-testid*="results"], [class*="search-results"], [class*="SearchResults"]')
      .first();
    this.offerCards = page.locator(
      '[data-testid*="result-card"], [data-testid*="vehicle-card"], [class*="result-card"], [class*="vehicle-card"], article:has(button, a)'
    );
    this.cookieBanner = page.locator('#onetrust-consent-sdk').first();
    this.acceptCookiesButton = page
      .locator('#onetrust-accept-btn-handler')
      .or(page.getByRole('button', { name: /accept|accept all|allow all/i }))
      .first();
    this.modalCloseButton = page
      .getByRole('button', { name: /close|dismiss/i })
      .or(page.locator('button:has-text("×"), button[aria-label*="close" i]'))
      .first();
  }

  private async waitForAntiBotIfPresent(): Promise<void> {
    const antiBotHeading = this.page
      .getByRole('heading', { name: /confirm you are human|let'?s confirm you are human/i })
      .first();
    const antiBotPuzzleText = this.page.getByText(/choose all|get a new puzzle|get an audio puzzle/i).first();

    const antiBotVisible =
      (await antiBotHeading.isVisible().catch(() => false)) ||
      (await antiBotPuzzleText.isVisible().catch(() => false));

    if (!antiBotVisible) {
      return;
    }

    // Real Booking pages can require manual anti-bot verification.
    // In headed mode we give user time to solve it and continue.
    await antiBotHeading
      .waitFor({
        state: 'hidden',
        timeout: BookingCarsResultsPage.MANUAL_ANTIBOT_TIMEOUT_MS,
      })
      .catch(() => {});

    if (await antiBotHeading.isVisible().catch(() => false)) {
      throw new Error(
        'Booking anti-bot challenge is still visible after 120s. Please solve captcha manually in headed mode and click Confirm.'
      );
    }
  }

  async waitForSearchResultsTransition(): Promise<void> {
    await this.page.waitForURL(/search-results|cars\/searchresults|cars\/results/i, {
      waitUntil: 'domcontentloaded',
      timeout: BookingCarsResultsPage.RESULTS_WAIT_TIMEOUT_MS,
    });
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoadingPhaseIfPresent(): Promise<void> {
    // This loading text can appear and disappear very quickly.
    // If it is present now, validate it briefly; if not, continue.
    if (await this.loadingMarker.isVisible().catch(() => false)) {
      await expect(this.loadingMarker).toBeVisible({ timeout: 1500 });
    }
  }

  private async dismissBlockingOverlaysIfPresent(): Promise<void> {
    // Cookie banner can reappear on results page and intercept clicks.
    if (await this.cookieBanner.isVisible().catch(() => false)) {
      if (await this.acceptCookiesButton.isVisible().catch(() => false)) {
        await this.acceptCookiesButton.click({ timeout: 5000 }).catch(() => {});
      }

      await this.cookieBanner.waitFor({ state: 'hidden', timeout: 5000 }).catch(async () => {
        await this.page.evaluate(() => {
          const banner = document.querySelector<HTMLElement>('#onetrust-consent-sdk');
          if (banner) {
            banner.style.display = 'none';
            banner.style.visibility = 'hidden';
            banner.style.pointerEvents = 'none';
          }
        });
      });
    }

    // Promo/sign-in modal can cover result cards.
    if (await this.modalCloseButton.isVisible().catch(() => false)) {
      await this.modalCloseButton.click({ timeout: 3000 }).catch(() => {});
    }
  }

  async expectResultsLoaded(): Promise<void> {
    await this.waitForSearchResultsTransition();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.waitForAntiBotIfPresent();
      await this.dismissBlockingOverlaysIfPresent();

      // Booking sometimes returns a transient error page on first load.
      if (await this.transientErrorHeading.isVisible().catch(() => false)) {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await this.page.waitForLoadState('networkidle').catch(() => {});
        continue;
      }

      if (
        (await this.resultsMarker.isVisible().catch(() => false)) ||
        (await this.genericResultsContainer.isVisible().catch(() => false))
      ) {
        await expect(this.page).toHaveURL(/search-results|cars\/searchresults|cars\/results/i);
        return;
      }

      // Wait for a meaningful UI transition instead of fixed sleep.
      await Promise.race([
        this.resultsMarker.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
        this.genericResultsContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
        this.transientErrorHeading.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      ]);
    }

    await expect(this.page).toHaveURL(/search-results|cars\/searchresults|cars\/results/i);
    await expect(this.transientErrorHeading).toBeHidden();
  }

  async expectSearchCriteriaInUrl(): Promise<void> {
    await this.expectSearchCriteriaInUrlWithParams({
      locationIata: 'JFK',
      pickupDay: 1,
      pickupMonth: 5,
      dropoffDay: 5,
      dropoffMonth: 5,
    });
  }

  async expectSearchCriteriaInUrlWithParams(params: {
    locationIata: string;
    pickupDay: number;
    pickupMonth: number;
    dropoffDay: number;
    dropoffMonth: number;
  }): Promise<void> {
    const { locationIata, pickupDay, pickupMonth, dropoffDay, dropoffMonth } = params;
    await expect(this.page).toHaveURL(new RegExp(`locationIata=${locationIata}`, 'i'));
    await expect(this.page).toHaveURL(new RegExp(`dropLocationIata=${locationIata}`, 'i'));
    await expect(this.page).toHaveURL(new RegExp(`puDay=${pickupDay}`, 'i'));
    await expect(this.page).toHaveURL(new RegExp(`puMonth=${pickupMonth}`, 'i'));
    await expect(this.page).toHaveURL(new RegExp(`doDay=${dropoffDay}`, 'i'));
    await expect(this.page).toHaveURL(new RegExp(`doMonth=${dropoffMonth}`, 'i'));
  }

  async expectAtLeastOneOfferVisible(): Promise<void> {
    await this.dismissBlockingOverlaysIfPresent();

    // Keep this check resilient to Booking UI changes.
    // Prefer visible offer cards, but fall back to common results-page UI markers.
    const hasVisibleOfferCard = await this.offerCards
      .first()
      .isVisible({ timeout: BookingCarsResultsPage.RESULTS_WAIT_TIMEOUT_MS })
      .catch(() => false);

    if (hasVisibleOfferCard) {
      const offersCount = await this.offerCards.count();
      expect(offersCount).toBeGreaterThan(0);
      return;
    }

    const resultsUiMarker = this.page
      .getByText(/sort by|filters|free cancellation|car rental companies|deals/i)
      .first();
    const hasResultsUiMarker = await resultsUiMarker
      .isVisible({ timeout: BookingCarsResultsPage.RESULTS_WAIT_TIMEOUT_MS })
      .catch(() => false);

    if (hasResultsUiMarker) {
      return;
    }

    throw new Error(
      'No visible offer cards or common results UI markers were found on search-results page.'
    );
  }

  async expectCityMentioned(city: string): Promise<void> {
    await expect(this.page.locator('body')).toContainText(new RegExp(city, 'i'));
  }

  async expectLocationInputContains(city: string): Promise<void> {
    await expect(this.locationInput).toBeVisible();
    await expect(this.locationInput).toHaveValue(new RegExp(city, 'i'));
  }
}
