import { libname, libversion } from '.';
import * as TestSubject from './collector';

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

describe(`${libname} ${libversion} - collector`, () => {
  describe('exports', () => {
    it('Parser', () => {
      expect(TestSubject.ModelCollector).toBe(TestSubject.default);
    });

    it('default', () => {
      expect(TestSubject.ModelCollector).toBeDefined();
    });
  });

  describe('collect', () => {
    it('empty on empty responses', async () => {
      const mockedFetch = mockFetch('', '', '', '');

      const collector = new TestSubject.ModelCollector(mockedFetch);
      const data = await collector.collect();
      expect(mockedFetch.mock.calls[0][1].headers).toStrictEqual({
        'Accept-Encoding': 'br, gzip, deflate',
      });
      expect(mockedFetch).toHaveBeenCalledTimes(4);
      expect(data).toHaveLength(0);
    });

    it('simple case', async () => {
      const lookup = 'Country,State,Population\nGermany,,100';
      const confirmed = 'Country,State,01/01/20\nGermany,,1000';
      const deaths = 'Country,State,01/01/20\nGermany,,100';
      const recovered = 'Country,State,01/01/20\nGermany,,10';
      const mockedFetch = mockFetch(lookup, confirmed, deaths, recovered);

      const collector = new TestSubject.ModelCollector(mockedFetch);
      const data = await collector.collect();
      expect(mockedFetch.mock.calls[0][1].headers).toStrictEqual({
        'Accept-Encoding': 'br, gzip, deflate',
      });
      expect(mockedFetch).toHaveBeenCalledTimes(4);
      expect(data).toHaveLength(1);
      expect(data[0].country).toStrictEqual('Germany');
      expect(data[0].state).toStrictEqual('');
      expect(data[0].values[0].confirmed).toStrictEqual(1000);
      expect(data[0].values[0].deaths).toStrictEqual(100);
      expect(data[0].values[0].recovered).toStrictEqual(10);
      expect(data[0].values[0].timestamp).toStrictEqual(1_577_836_800_000);
    });

    it('live snapshot based', async () => {
      let lookup = 'UID,iso2,iso3,code3,FIPS,Admin2,Province_State,Country_Region,Lat,Long_,Combined_Key,Population\n';
      lookup += '276,DE,DEU,276,,,,Germany,51.165691,10.451526,Germany,83783945';
      let confirmed =
        'Province/State,Country/Region,Lat,Long,1/22/20,1/23/20,1/24/20,1/25/20,1/26/20,1/27/20,1/28/20,1/29/20,1/30/20,1/31/20,2/1/20,2/2/20,2/3/20,2/4/20,2/5/20,2/6/20,2/7/20,2/8/20,2/9/20,2/10/20,2/11/20,2/12/20,2/13/20,2/14/20,2/15/20,2/16/20,2/17/20,2/18/20,2/19/20,2/20/20,2/21/20,2/22/20,2/23/20,2/24/20,2/25/20,2/26/20,2/27/20,2/28/20,2/29/20,3/1/20,3/2/20,3/3/20,3/4/20,3/5/20,3/6/20,3/7/20,3/8/20,3/9/20,3/10/20,3/11/20,3/12/20,3/13/20,3/14/20,3/15/20,3/16/20,3/17/20,3/18/20,3/19/20,3/20/20,3/21/20,3/22/20,3/23/20,3/24/20,3/25/20,3/26/20,3/27/20,3/28/20,3/29/20,3/30/20,3/31/20,4/1/20,4/2/20,4/3/20,4/4/20,4/5/20,4/6/20,4/7/20,4/8/20,4/9/20,4/10/20,4/11/20,4/12/20,4/13/20,4/14/20,4/15/20,4/16/20,4/17/20,4/18/20,4/19/20,4/20/20,4/21/20,4/22/20,4/23/20,4/24/20,4/25/20,4/26/20,4/27/20,4/28/20,4/29/20,4/30/20,5/1/20,5/2/20,5/3/20,5/4/20,5/5/20,5/6/20,5/7/20,5/8/20,5/9/20,5/10/20,5/11/20,5/12/20,5/13/20,5/14/20,5/15/20,5/16/20,5/17/20,5/18/20,5/19/20,5/20/20,5/21/20,5/22/20,5/23/20,5/24/20,5/25/20,5/26/20,5/27/20,5/28/20,5/29/20,5/30/20,5/31/20,6/1/20,6/2/20,6/3/20,6/4/20,6/5/20,6/6/20,6/7/20,6/8/20,6/9/20,6/10/20,6/11/20\n';
      confirmed +=
        ',Germany,51.0,9.0,0,0,0,0,0,1,4,4,4,5,8,10,12,12,12,12,13,13,14,14,16,16,16,16,16,16,16,16,16,16,16,16,16,16,17,27,46,48,79,130,159,196,262,482,670,799,1040,1176,1457,1908,2078,3675,4585,5795,7272,9257,12327,15320,19848,22213,24873,29056,32986,37323,43938,50871,57695,62095,66885,71808,77872,84794,91159,96092,100123,103374,107663,113296,118181,122171,124908,127854,130072,131359,134753,137698,141397,143342,145184,147065,148291,150648,153129,154999,156513,157770,158758,159912,161539,163009,164077,164967,165664,166152,167007,168162,169430,170588,171324,171879,172576,173171,174098,174478,175233,175752,176369,176551,177778,178473,179021,179710,179986,180328,180600,181200,181524,182196,182922,183189,183410,183594,183879,184121,184472,184924,185450,185750,186109,186506,186522,186691';
      let deaths =
        'Province/State,Country/Region,Lat,Long,1/22/20,1/23/20,1/24/20,1/25/20,1/26/20,1/27/20,1/28/20,1/29/20,1/30/20,1/31/20,2/1/20,2/2/20,2/3/20,2/4/20,2/5/20,2/6/20,2/7/20,2/8/20,2/9/20,2/10/20,2/11/20,2/12/20,2/13/20,2/14/20,2/15/20,2/16/20,2/17/20,2/18/20,2/19/20,2/20/20,2/21/20,2/22/20,2/23/20,2/24/20,2/25/20,2/26/20,2/27/20,2/28/20,2/29/20,3/1/20,3/2/20,3/3/20,3/4/20,3/5/20,3/6/20,3/7/20,3/8/20,3/9/20,3/10/20,3/11/20,3/12/20,3/13/20,3/14/20,3/15/20,3/16/20,3/17/20,3/18/20,3/19/20,3/20/20,3/21/20,3/22/20,3/23/20,3/24/20,3/25/20,3/26/20,3/27/20,3/28/20,3/29/20,3/30/20,3/31/20,4/1/20,4/2/20,4/3/20,4/4/20,4/5/20,4/6/20,4/7/20,4/8/20,4/9/20,4/10/20,4/11/20,4/12/20,4/13/20,4/14/20,4/15/20,4/16/20,4/17/20,4/18/20,4/19/20,4/20/20,4/21/20,4/22/20,4/23/20,4/24/20,4/25/20,4/26/20,4/27/20,4/28/20,4/29/20,4/30/20,5/1/20,5/2/20,5/3/20,5/4/20,5/5/20,5/6/20,5/7/20,5/8/20,5/9/20,5/10/20,5/11/20,5/12/20,5/13/20,5/14/20,5/15/20,5/16/20,5/17/20,5/18/20,5/19/20,5/20/20,5/21/20,5/22/20,5/23/20,5/24/20,5/25/20,5/26/20,5/27/20,5/28/20,5/29/20,5/30/20,5/31/20,6/1/20,6/2/20,6/3/20,6/4/20,6/5/20,6/6/20,6/7/20,6/8/20,6/9/20,6/10/20,6/11/20\n';
      deaths +=
        ',Germany,51.0,9.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,3,3,7,9,11,17,24,28,44,67,84,94,123,157,206,267,342,433,533,645,775,920,1107,1275,1444,1584,1810,2016,2349,2607,2767,2736,3022,3194,3294,3804,4052,4352,4459,4586,4862,5033,5279,5575,5760,5877,5976,6126,6314,6467,6623,6736,6812,6866,6993,6993,7275,7392,7510,7549,7569,7661,7738,7861,7884,7897,7938,7962,8003,8081,8144,8203,8228,8261,8283,8309,8372,8428,8470,8504,8530,8540,8555,8563,8602,8635,8658,8673,8685,8695,8736,8752,8772';
      let recovered =
        'Province/State,Country/Region,Lat,Long,1/22/20,1/23/20,1/24/20,1/25/20,1/26/20,1/27/20,1/28/20,1/29/20,1/30/20,1/31/20,2/1/20,2/2/20,2/3/20,2/4/20,2/5/20,2/6/20,2/7/20,2/8/20,2/9/20,2/10/20,2/11/20,2/12/20,2/13/20,2/14/20,2/15/20,2/16/20,2/17/20,2/18/20,2/19/20,2/20/20,2/21/20,2/22/20,2/23/20,2/24/20,2/25/20,2/26/20,2/27/20,2/28/20,2/29/20,3/1/20,3/2/20,3/3/20,3/4/20,3/5/20,3/6/20,3/7/20,3/8/20,3/9/20,3/10/20,3/11/20,3/12/20,3/13/20,3/14/20,3/15/20,3/16/20,3/17/20,3/18/20,3/19/20,3/20/20,3/21/20,3/22/20,3/23/20,3/24/20,3/25/20,3/26/20,3/27/20,3/28/20,3/29/20,3/30/20,3/31/20,4/1/20,4/2/20,4/3/20,4/4/20,4/5/20,4/6/20,4/7/20,4/8/20,4/9/20,4/10/20,4/11/20,4/12/20,4/13/20,4/14/20,4/15/20,4/16/20,4/17/20,4/18/20,4/19/20,4/20/20,4/21/20,4/22/20,4/23/20,4/24/20,4/25/20,4/26/20,4/27/20,4/28/20,4/29/20,4/30/20,5/1/20,5/2/20,5/3/20,5/4/20,5/5/20,5/6/20,5/7/20,5/8/20,5/9/20,5/10/20,5/11/20,5/12/20,5/13/20,5/14/20,5/15/20,5/16/20,5/17/20,5/18/20,5/19/20,5/20/20,5/21/20,5/22/20,5/23/20,5/24/20,5/25/20,5/26/20,5/27/20,5/28/20,5/29/20,5/30/20,5/31/20,6/1/20,6/2/20,6/3/20,6/4/20,6/5/20,6/6/20,6/7/20,6/8/20,6/9/20,6/10/20,6/11/20\n';
      recovered =
        ',Germany,51.0,9.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,12,12,12,14,14,14,14,14,15,16,16,16,16,16,16,16,16,17,18,18,18,18,25,25,46,46,46,67,67,105,113,180,233,266,266,3243,3547,5673,6658,8481,9211,13500,16100,18700,22440,24575,26400,28700,28700,36081,46300,52407,53913,57400,60300,64300,68200,72600,77000,83114,85400,88000,91500,95200,99400,103300,109800,109800,112000,114500,117400,120400,123500,126900,129000,130600,132700,135100,139900,141700,141700,143300,144400,145617,147200,148700,150300,151597,152600,154011,155041,155681,156966,158087,159064,159716,160281,161199,161967,162820,163360,164245,164908,165352,165632,166609,167453,167909,168480,168958,169224,169556,170129,170630,170961';
      const mockedFetch = mockFetch(lookup, confirmed, deaths, recovered);

      const collector = new TestSubject.ModelCollector(mockedFetch);
      const data = await collector.collect();
      expect(mockedFetch.mock.calls[0][1].headers).toStrictEqual({
        'Accept-Encoding': 'br, gzip, deflate',
      });

      expect(mockedFetch).toHaveBeenCalledTimes(4);

      expect(data).toHaveLength(1);

      expect(data[0].country).toStrictEqual('Germany');
      expect(data[0].state).toStrictEqual('');
      expect(data[0].values[0].confirmed).toStrictEqual(0);
      expect(data[0].values[0].deaths).toStrictEqual(0);
      expect(data[0].values[0].recovered).toStrictEqual(0);
      expect(data[0].values[0].timestamp).toStrictEqual(1_579_651_200_000);
    });

    it('country/state sorting', async () => {
      const lookup = 'Country,State,Population\nB,,2\nA,Z,10\nA,A,100\nA,,1000';
      const confirmed = 'Country,State,01/01/20\nB,,2\nA,Z,1000\nA,A,100\nA,,10';
      const deaths = 'Country,State,01/01/20\nB,,2\nA,Z,10\nA,A,100\nA,,1000';
      const recovered = 'Country,State,01/01/20\nB,,2\nA,Z,100\nA,A,1000\nA,,100';
      const mockedFetch = mockFetch(lookup, confirmed, deaths, recovered);

      const collector = new TestSubject.ModelCollector(mockedFetch);
      const data = await collector.collect();

      expect(mockedFetch.mock.calls[0][1].headers).toStrictEqual({
        'Accept-Encoding': 'br, gzip, deflate',
      });

      expect(mockedFetch).toHaveBeenCalledTimes(4);
      expect(data).toHaveLength(4);

      expect(data[0].country).toStrictEqual('A');
      expect(data[0].state).toStrictEqual('');
      expect(data[0].population).toStrictEqual(1000);
      expect(data[0].values[0].confirmed).toStrictEqual(10);
      expect(data[0].values[0].deaths).toStrictEqual(1000);
      expect(data[0].values[0].recovered).toStrictEqual(100);
      expect(data[0].values[0].timestamp).toStrictEqual(1_577_836_800_000);

      expect(data[1].country).toStrictEqual('A');
      expect(data[1].state).toStrictEqual('A');
      expect(data[1].population).toStrictEqual(100);
      expect(data[1].values[0].confirmed).toStrictEqual(100);
      expect(data[1].values[0].deaths).toStrictEqual(100);
      expect(data[1].values[0].recovered).toStrictEqual(1000);
      expect(data[1].values[0].timestamp).toStrictEqual(1_577_836_800_000);

      expect(data[2].country).toStrictEqual('A');
      expect(data[2].state).toStrictEqual('Z');
      expect(data[2].population).toStrictEqual(10);
      expect(data[2].values[0].confirmed).toStrictEqual(1000);
      expect(data[2].values[0].deaths).toStrictEqual(10);
      expect(data[2].values[0].recovered).toStrictEqual(100);
      expect(data[2].values[0].timestamp).toStrictEqual(1_577_836_800_000);

      expect(data[3].country).toStrictEqual('B');
      expect(data[3].state).toStrictEqual('');
      expect(data[3].population).toStrictEqual(2);
      expect(data[3].values[0].confirmed).toStrictEqual(2);
      expect(data[3].values[0].deaths).toStrictEqual(2);
      expect(data[3].values[0].recovered).toStrictEqual(2);
      expect(data[3].values[0].timestamp).toStrictEqual(1_577_836_800_000);
    });

    it('missing lookup', async () => {
      const lookup = 'Country,State,Population';
      const confirmed = 'Country,State,01/01/20\nA,,10';
      const deaths = 'Country,State,01/01/20\nA,,1000';
      const recovered = 'Country,State,01/01/20\nA,,100';
      const mockedFetch = mockFetch(lookup, confirmed, deaths, recovered);

      const collector = new TestSubject.ModelCollector(mockedFetch);
      const data = await collector.collect();

      expect(mockedFetch.mock.calls[0][1].headers).toStrictEqual({
        'Accept-Encoding': 'br, gzip, deflate',
      });

      expect(mockedFetch).toHaveBeenCalledTimes(4);
      expect(data).toHaveLength(1);

      expect(data[0].country).toStrictEqual('A');
      expect(data[0].state).toStrictEqual('');
      expect(data[0].population).toStrictEqual(0);
      expect(data[0].values[0].confirmed).toStrictEqual(10);
      expect(data[0].values[0].deaths).toStrictEqual(1000);
      expect(data[0].values[0].recovered).toStrictEqual(100);
      expect(data[0].values[0].timestamp).toStrictEqual(1_577_836_800_000);
    });

    it('missing deaths', async () => {
      const lookup = 'Country,State,Population\nA,,1000';
      const confirmed = 'Country,State,01/01/20\nA,,10';
      const deaths = 'Country,State,01/01/20';
      const recovered = 'Country,State,01/01/20\nA,,100';
      const mockedFetch = mockFetch(lookup, confirmed, deaths, recovered);

      const collector = new TestSubject.ModelCollector(mockedFetch);
      const data = await collector.collect();

      expect(mockedFetch.mock.calls[0][1].headers).toStrictEqual({
        'Accept-Encoding': 'br, gzip, deflate',
      });

      expect(mockedFetch).toHaveBeenCalledTimes(4);
      expect(data).toHaveLength(1);

      expect(data[0].country).toStrictEqual('A');
      expect(data[0].state).toStrictEqual('');
      expect(data[0].population).toStrictEqual(1000);
      expect(data[0].values[0].confirmed).toStrictEqual(10);
      expect(data[0].values[0].deaths).toStrictEqual(0);
      expect(data[0].values[0].recovered).toStrictEqual(100);
      expect(data[0].values[0].timestamp).toStrictEqual(1_577_836_800_000);
    });

    it('missing recovered', async () => {
      const lookup = 'Country,State,Population\nA,,1000';
      const confirmed = 'Country,State,01/01/20\nA,,10';
      const deaths = 'Country,State,01/01/20\nA,,100';
      const recovered = 'Country,State,01/01/20';
      const mockedFetch = mockFetch(lookup, confirmed, deaths, recovered);
      const collector = new TestSubject.ModelCollector(mockedFetch);
      const data = await collector.collect();

      expect(mockedFetch.mock.calls[0][1].headers).toStrictEqual({
        'Accept-Encoding': 'br, gzip, deflate',
      });

      expect(mockedFetch).toHaveBeenCalledTimes(4);
      expect(data).toHaveLength(1);

      expect(data[0].country).toStrictEqual('A');
      expect(data[0].state).toStrictEqual('');
      expect(data[0].population).toStrictEqual(1000);
      expect(data[0].values[0].confirmed).toStrictEqual(10);
      expect(data[0].values[0].deaths).toStrictEqual(100);
      expect(data[0].values[0].recovered).toStrictEqual(0);
      expect(data[0].values[0].timestamp).toStrictEqual(1_577_836_800_000);
    });
  });
});
