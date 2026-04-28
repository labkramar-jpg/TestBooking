import { expect, test as base, type Page } from '@playwright/test';
import { env } from '../../config/env';
import { BookingAuthPage } from '../pages/bookingAuthPage';
import { BookingCarsHomePage } from '../pages/bookingCarsHomePage';
import { BookingCarsResultsPage } from '../pages/bookingCarsResultsPage';

type UiFixtures = {
  loggedInPage: Page;
  carsHomePage: BookingCarsHomePage;
  carsResultsPage: BookingCarsResultsPage;
};

export const test = base.extend<UiFixtures>({
  loggedInPage: async ({ page }, use, testInfo) => {
    if (!env.bookingEmail || !env.bookingPassword) {
      testInfo.skip(
        true,
        'Set BOOKING_EMAIL and BOOKING_PASSWORD in environment variables to run authenticated UI scenarios.'
      );
    }

    const homePage = new BookingCarsHomePage(page);
    const authPage = new BookingAuthPage(page);

    await homePage.open();
    await homePage.acceptCookiesIfShown();
    await authPage.openSignIn();
    await authPage.login(env.bookingEmail!, env.bookingPassword!);

    await use(page);
  },

  carsHomePage: async ({ page }, use) => {
    await use(new BookingCarsHomePage(page));
  },

  carsResultsPage: async ({ page }, use) => {
    await use(new BookingCarsResultsPage(page));
  },
});

export { expect };
