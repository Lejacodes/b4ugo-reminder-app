import { formatPlaceLabel, isTripPlaceSuggestion } from '@/lib/geocoding';

describe('formatPlaceLabel', () => {
  it('adds the country after the place name', () => {
    expect(
      formatPlaceLabel({
        placeName: 'Antalya',
        latitude: 36.89,
        longitude: 30.71,
        country: 'Türkiye',
        region: 'Antalya',
        timezone: 'Europe/Istanbul',
      }),
    ).toBe('Antalya, Türkiye');
  });

  it('uses the name alone when there is no country', () => {
    expect(
      formatPlaceLabel({
        placeName: "a friend's place",
        latitude: 0,
        longitude: 0,
        country: null,
        region: null,
        timezone: null,
      }),
    ).toBe("a friend's place");
  });
});

describe('isTripPlaceSuggestion', () => {
  it('hides Israel from trip location suggestions', () => {
    expect(
      isTripPlaceSuggestion({
        placeName: 'Tel Aviv',
        latitude: 32.08,
        longitude: 34.78,
        country: 'Israel',
        region: 'Tel Aviv',
        timezone: 'Asia/Jerusalem',
      }),
    ).toBe(false);
  });

  it('keeps other countries', () => {
    expect(
      isTripPlaceSuggestion({
        placeName: 'Antalya',
        latitude: 36.89,
        longitude: 30.71,
        country: 'Türkiye',
        region: 'Antalya',
        timezone: 'Europe/Istanbul',
      }),
    ).toBe(true);
  });
});
