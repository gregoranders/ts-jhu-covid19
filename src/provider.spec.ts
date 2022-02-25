import { libname, libversion } from '.';
import * as TestSubject from './provider';

const resolved = (text: string) =>
  Promise.resolve({
    text: () => Promise.resolve(text),
  });

const mockFetch = (lookup: string, confirmed: string, deaths: string, recovered: string) =>
  jest.fn().mockImplementation((url: string) => {
    switch (url) {
      case 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv':
        return resolved(lookup);
      case 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv':
        return resolved(confirmed);
      case 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv':
        return resolved(deaths);
      case 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv':
        return resolved(recovered);
      default:
        console.error(url);
        return { text: () => Promise.reject(url) };
    }
  });

describe(`${libname} ${libversion} - provider`, () => {
  describe('exports', () => {
    it('default', () => {
      expect(TestSubject.default).toBeDefined();
    });

    it('Provider', () => {
      expect(TestSubject.Provider).toBeDefined();
    });

    it('Provider  = default', () => {
      expect(TestSubject.Provider).toBe(TestSubject.default);
    });
  });

  describe('collect', () => {
    it('empty on empty responses', async () => {
      const mockedFetch = mockFetch('', '', '', '');

      const provider = new TestSubject.Provider(mockedFetch);
      const data = await provider.get();
      expect(mockedFetch.mock.calls[0][1].headers).toStrictEqual({
        'Accept-Encoding': 'br, gzip, deflate',
      });
      expect(mockedFetch).toHaveBeenCalledTimes(4);
      expect(data).toHaveLength(0);
    });

    it('metrics', async () => {
      let lookup = 'UID,iso2,iso3,code3,FIPS,Admin2,Province_State,Country_Region,Lat,Long_,Combined_Key,Population\n';
      lookup += '276,DE,DEU,276,,,,Germany,51.165691,10.451526,Germany,83783945\n';
      lookup +=
        '3601,AU,AUS,36,,,Australian Capital Territory,Australia,-35.4735,149.0124,"Australian Capital Territory, Australia",0';

      const header = 'Province/State,Country/Region,Lat,Long,1/1/20,2/1/20\n';
      const germany = ',Germany,51.0,9.0,';
      const australia = 'Australian Capital Territory,Australia,-35.4735,149.0124,';

      let confirmed = header;
      confirmed += germany;
      confirmed += [0, 1].join(',');
      confirmed += '\n';
      confirmed += australia;
      confirmed += [1, 3].join(',');
      confirmed += '\n';

      let deaths = header;
      deaths += germany;
      deaths += [0, 0].join(',');
      deaths += '\n';
      deaths += australia;
      deaths += [0, 1].join(',');
      deaths += '\n';

      let recovered = header;
      recovered += germany;
      recovered += [0, 0].join(',');
      recovered += '\n';
      recovered += australia;
      recovered += [0, 1].join(',');
      recovered += '\n';

      const mockedFetch = mockFetch(lookup, confirmed, deaths, recovered);

      const provider = new TestSubject.Provider(mockedFetch);
      const data = await provider.get();
      expect(mockedFetch.mock.calls[0][1].headers).toStrictEqual({
        'Accept-Encoding': 'br, gzip, deflate',
      });

      expect(mockedFetch).toHaveBeenCalledTimes(4);

      expect(data).toHaveLength(2);

      expect(data[0].country).toStrictEqual('Australia');
      expect(data[0].state).toStrictEqual('Australian Capital Territory');
      expect(data[0].metrics).toHaveLength(2);
      expect(data[0].metrics[1].confirmed).toStrictEqual(3);
      expect(data[0].metrics[1].active).toStrictEqual(1);
      expect(data[0].metrics[1].dead).toStrictEqual(1);
      expect(data[0].metrics[1].recovered).toStrictEqual(1);
      expect(data[0].metrics[1].diff.confirmed).toStrictEqual(2);
      expect(data[0].metrics[1].diff.active).toStrictEqual(0);
      expect(data[0].metrics[1].diff.dead).toStrictEqual(1);
      expect(data[0].metrics[1].diff.recovered).toStrictEqual(1);
      expect(data[0].metrics[1].avrg[5].confirmed).toStrictEqual(2 / 5);
      expect(data[0].metrics[1].avrg[7].confirmed).toStrictEqual(2 / 7);
      expect(data[0].metrics[1].avrg[14].confirmed).toStrictEqual(2 / 14);
      expect(data[0].metrics[1].avrg[21].confirmed).toStrictEqual(2 / 21);
      expect(data[0].metrics[1].avrg[28].confirmed).toStrictEqual(2 / 28);

      expect(data[1].country).toStrictEqual('Germany');
      expect(data[1].state).toBeUndefined();
      expect(data[1].metrics).toHaveLength(2);
      expect(data[1].metrics[1].confirmed).toStrictEqual(1);
      expect(data[1].metrics[1].active).toStrictEqual(1);
      expect(data[1].metrics[1].dead).toStrictEqual(0);
      expect(data[1].metrics[1].recovered).toStrictEqual(0);
      expect(data[1].metrics[1].diff.confirmed).toStrictEqual(1);
      expect(data[1].metrics[1].diff.active).toStrictEqual(1);
      expect(data[1].metrics[1].diff.dead).toStrictEqual(0);
      expect(data[1].metrics[1].diff.recovered).toStrictEqual(0);
      expect(data[1].metrics[1].avrg[5].dead).toStrictEqual(0);
      expect(data[1].metrics[1].avrg[7].dead).toStrictEqual(0);
      expect(data[1].metrics[1].avrg[14].dead).toStrictEqual(0);
      expect(data[1].metrics[1].avrg[21].dead).toStrictEqual(0);
      expect(data[1].metrics[1].avrg[28].dead).toStrictEqual(0);
    });
  });
});
