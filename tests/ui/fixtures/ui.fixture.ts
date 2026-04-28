import { expect, test as base } from '@playwright/test';
import { BookingCarsHomePage } from '../pages/bookingCarsHomePage';
import { BookingCarsResultsPage } from '../pages/bookingCarsResultsPage';

type UiFixtures = {
  carsHomePage: BookingCarsHomePage;
  carsResultsPage: BookingCarsResultsPage;
};

export const test = base.extend<UiFixtures>({
  carsHomePage: async ({ page }, use) => {
    await use(new BookingCarsHomePage(page));
  },

  carsResultsPage: async ({ page }, use) => {
    await use(new BookingCarsResultsPage(page));
  },
});

export { expect };
