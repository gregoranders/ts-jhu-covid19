import Parser from '@gregoranders/csv';

type TemporaryModelValue = {
  value: number;
  timestamp: number;
};

type CountryState = { country: string; state: string };

type TemporaryModel = CountryState & {
  lat: number;
  lon: number;
  values: TemporaryModelValue[];
};

const sortByCountryAndState = (a: CountryState, b: CountryState): number => {
  const diff = a.country.localeCompare(b.country);
  if (diff === 0) {
    return a.state.localeCompare(b.state);
  }
  return diff;
};

type MappedRow = Record<string, string> & CountryState;

const mapRows = <T extends CountryState, R extends CountryState>(
  values: readonly T[],
  map: (value: T) => R,
): readonly R[] => {
  return values.map((value) => map(value));
};

abstract class BaseMapper<T extends CountryState> {
  public constructor() {
    this.map = this.map.bind(this);
  }

  public map<V extends MappedRow>(rows: readonly V[]): readonly T[] {
    return [...mapRows(rows, this._map)].sort(sortByCountryAndState);
  }

  protected abstract _map<V extends MappedRow>(row: V): T;
}

class ModelMapper extends BaseMapper<TemporaryModel> {
  static _keys = {
    State: (value: string) => value,
    Country: (value: string) => value.replace(/\*/, ''),
    Lat: (value: string) => Number.parseInt(value),
    Long: (value: string) => Number.parseInt(value),
  } as Record<string, (value: string) => string | number>;

  protected _map<T extends MappedRow>(row: T): TemporaryModel {
    const mapped = {
      values: [] as TemporaryModelValue[],
    } as TemporaryModel & Record<string, number | string>;

    for (const key of Object.keys(row)) {
      const found = Object.keys(ModelMapper._keys).find((temporary) => key.match(new RegExp(temporary)));

      if (found) {
        mapped[found.toLowerCase()] = ModelMapper._keys[found](row[key]);
      } else {
        const value = Number.parseInt(row[key] as string, 10);
        const date = new Date(key);
        const timestamp = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        mapped.values.push({ timestamp, value });
      }
    }

    Object.freeze(mapped.values);

    return Object.freeze(mapped as unknown as TemporaryModel);
  }
}

type Lookup = {
  country: string;
  lat: number;
  lon: number;
  state: string;
  population: number;
  uid: number;
  code3: number;
  iso2: string;
  iso3: string;
  fips: number;
  admin2: string;
};

class LookupMapper extends BaseMapper<Lookup> {
  static _keys = {
    State: (value: string) => value,
    Country: (value: string) => value.replace(/\*/, ''),
    Lat: (value: string) => Number.parseInt(value),
    Long: (value: string) => Number.parseInt(value),
    Population: (value: string) => Number.parseInt(value),
    UID: (value: string) => Number.parseInt(value),
    iso2: (value: string) => value,
    iso3: (value: string) => value,
    code3: (value: string) => Number.parseInt(value),
    FIPS: (value: string) => Number.parseInt(value),
    Admin2: (value: string) => value,
  } as Record<string, (value: string) => string | number>;

  protected _map<T extends MappedRow>(row: T): Lookup {
    const temporary = {} as Record<string, number | string>;

    for (const key of Object.keys(row)) {
      for (const temporary_ of Object.keys(LookupMapper._keys)) {
        if (new RegExp(temporary_).test(key)) {
          temporary[temporary_.toLowerCase()] = LookupMapper._keys[temporary_](row[key]);
        }
      }
    }

    return Object.freeze(temporary as unknown as Lookup);
  }
}

export type RowModelValue = {
  readonly confirmed: number;
  readonly deaths: number;
  readonly recovered: number;
  readonly timestamp: number;
};

export type RowModel = {
  readonly country: string;
  readonly lat: number;
  readonly lon: number;
  readonly state: string;
  readonly population: number;
  readonly values: RowModelValue[];
};

enum Type {
  CONFIRMED = 'confirmed',
  DEATHS = 'deaths',
  RECOVERED = 'recovered',
  LOOKUP = 'lookup',
}

const BASE_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/';

export const Configuration: Record<Type, string> = {
  confirmed: `${BASE_URL}csse_covid_19_time_series/time_series_covid19_confirmed_global.csv`,
  deaths: `${BASE_URL}csse_covid_19_time_series/time_series_covid19_deaths_global.csv`,
  lookup: `${BASE_URL}UID_ISO_FIPS_LookUp_Table.csv`,
  recovered: `${BASE_URL}csse_covid_19_time_series/time_series_covid19_recovered_global.csv`,
};

/**
 * fetch like interface  result
 *
 * @public
 */
export type FetchLikeResult = {
  text(): Promise<string>;
};

/**
 * fetch like interface options
 * @public
 */
export type FetchLikeOptions = {
  headers: Record<string, string>;
  method: 'GET';
};

/**
 * fetch like interface
 *
 * @param url - url
 * @param options - {@link FetchLikeOptions}
 *
 * @returns {@link FetchLikeResult}
 *
 * @public
 */
export type FetchLike = (url: string, options?: FetchLikeOptions) => Promise<FetchLikeResult>;

export class ModelCollector {
  private readonly _modelMapper = new ModelMapper();
  private readonly _lookupMapper = new LookupMapper();

  public constructor(private _fetchImpl: FetchLike, private _configuration = Configuration) {}

  public async collect(): Promise<readonly RowModel[]> {
    const lookup = await this._fetchLookup();
    const confirmed = await this._fetchModel(Type.CONFIRMED);
    const deaths = await this._fetchModel(Type.DEATHS);
    const recovered = await this._fetchModel(Type.RECOVERED);

    return this.merge(confirmed, deaths, recovered, lookup);
  }

  private async merge(
    confirmed: readonly TemporaryModel[],
    deaths: readonly TemporaryModel[],
    recovered: readonly TemporaryModel[],
    lookups: readonly Lookup[],
  ) {
    return confirmed.map((model) => {
      const { lookup, modelDeaths, modelRecovered } = this.lookup(model, lookups, deaths, recovered);
      const values = this.mapModel(model, modelDeaths, modelRecovered);
      return Object.freeze({
        country: model.country,
        lat: model.lat,
        lon: model.lon,
        state: model.state,
        population: (lookup && lookup.population) || 0,
        values: Object.freeze(values),
      }) as RowModel;
    });
  }

  private mapModel(model: TemporaryModel, deaths: TemporaryModel | undefined, recovered: TemporaryModel | undefined) {
    return model.values.map((value) => {
      return Object.freeze({
        confirmed: value.value,
        deaths: this.findSeries(value.timestamp, deaths ? deaths.values : []),
        recovered: this.findSeries(value.timestamp, recovered ? recovered.values : []),
        timestamp: value.timestamp,
      }) as RowModelValue;
    });
  }

  private lookup(
    model: TemporaryModel,
    lookups: readonly Lookup[],
    deaths: readonly TemporaryModel[],
    recovered: readonly TemporaryModel[],
  ) {
    const lookup = this.findCountryState(lookups, model);
    const modelDeaths = this.findCountryState(deaths, model);
    const modelRecovered = this.findCountryState(recovered, model);

    return { lookup, modelDeaths, modelRecovered };
  }

  private findCountryState<R extends CountryState, T extends CountryState>(
    models: readonly R[],
    model: T,
  ): R | undefined {
    return models.find((temporary) => {
      let returnValue = temporary.country.localeCompare(model.country);
      if (returnValue === 0 && model.state) {
        returnValue = model.state.localeCompare(temporary.state || '');
      }
      return returnValue === 0 ? true : false;
    });
  }

  private findSeries(timestamp: number, series: { timestamp: number; value: number }[]): number {
    const found = series.find((temporary) => temporary.timestamp === timestamp);
    if (found) {
      return found.value;
    }
    return 0;
  }

  private async _fetchModel(type: Type) {
    return this._fetch(type)
      .then((text) => {
        return this._parse(text);
      })
      .then((models) => {
        // eslint-disable-next-line unicorn/no-array-callback-reference
        return this._modelMapper.map(models);
      });
  }

  private async _fetchLookup() {
    return this._fetch(Type.LOOKUP)
      .then((text) => {
        return this._parse(text);
      })
      .then((models) => {
        // eslint-disable-next-line unicorn/no-array-callback-reference
        return this._lookupMapper.map(models);
      });
  }

  private async _parse(text: string) {
    const parser = new Parser<MappedRow>();
    parser.parse(text);
    return parser.json;
  }

  private async _fetch(type: Type) {
    const response = await this._fetchImpl(this._fetchUrl(type), {
      headers: this._fetchHeaders(),
      method: 'GET',
    });

    return response.text();
  }

  private _fetchHeaders() {
    return {
      'Accept-Encoding': 'br, gzip, deflate',
    };
  }

  private _fetchUrl(type: Type) {
    return this._configuration[type];
  }
}

export default ModelCollector;
