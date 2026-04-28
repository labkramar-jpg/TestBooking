import { test } from './fixtures/ui.fixture';

const PICKUP_QUERY = 'new';
const JFK_EXACT_OPTION = 'John F. Kennedy International Airport (JFK), New York, United States';

test.describe('Car rental case - New York JFK with dates', () => {
  test('search with New York JFK, pickup 1 May and drop-off 5 May', async ({ carsHomePage, carsResultsPage }) => {
    test.setTimeout(180_000);
    await carsHomePage.open();

    // 1) Type generic city name to trigger suggestions.
    // 2) Pick the exact JFK airport option from that list.
    await carsHomePage.selectPickUpLocation(PICKUP_QUERY, JFK_EXACT_OPTION);
    await carsHomePage.selectDateRangeByMonthName(1, 5, 'May');
    await carsHomePage.clickSearch();

    await carsResultsPage.waitForSearchResultsTransition();
    await carsResultsPage.expectLoadingPhaseIfPresent();
    await carsResultsPage.expectResultsLoaded();
    await carsResultsPage.expectSearchCriteriaInUrlWithParams({
      locationIata: 'JFK',
      pickupDay: 1,
      pickupMonth: 5,
      dropoffDay: 5,
      dropoffMonth: 5,
    });
    await carsResultsPage.expectAtLeastOneOfferVisible();
  });
});
