export const env = {
  bookingCarsUrl:
    process.env.BOOKING_CARS_URL ??
    'https://www.booking.com/cars/index.en-gb.html?keep_landing=1&',
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://api.restful-api.dev',
};
