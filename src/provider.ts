import { FetchLike, ModelCollector, RowModel, RowModelValue } from './collector';

/**
 * metric value type
 *
 * @example
 * ```ts
 * {
 *   confirmed: 1,
 *   dead: 1,
 *   recovered: 1,
 *   active: 1,
 * }
 * ```
 * {@link MetricValue | MetricValue}
 *
 * @public
 * @readonly
 */
export type MetricValueType = 'confirmed' | 'dead' | 'recovered' | 'active';

/**
 * metric value
 *
 * @example
 * ```ts
 * {
 *   confirmed: 1,
 *   dead: 1,
 *   recovered: 1,
 *   active: 1,
 * }
 * ```
 * {@link MetricValueType | MetricValueType}
 *
 * @public
 * @readonly
 */
export interface MetricValue extends Record<MetricValueType, number> {
  /**
   * confirmed cases
   *
   * @public
   * @readonly
   */
  confirmed: number;
  /**
   * deaths
   *
   * @public
   * @readonly
   */
  dead: number;
  /**
   * recovered cases
   *
   * @public
   * @readonly
   */
  recovered: number;
  /**
   * active cases
   *
   * @remarks
   * `active` is calculated (`confirmed` - `dead` - `recovered`),
   * some data sets do not provide a recovered value
   *
   * @public
   * @readonly
   */
  active: number;
}

/**
 * precalculated average type - in days
 *
 * @example
 * ```ts
 * {
 *    5: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 *    7: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 *   14: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 *   21: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 *   28: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 * }
 * ```
 * {@link MetricValueAvrg | MetricValueAvrg}
 *
 * @public
 * @readonly
 */
export type MetricValueAvrgType = 5 | 7 | 14 | 21 | 28;

/**
 * metric value averages
 *
 * @example
 * ```ts
 * {
 *    5: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 *    7: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 *   14: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 *   21: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 *   28: { confirmed: 1, dead: 1, recovered: 1, active: 1 }
 * }
 * ```
 * {@link MetricValueAvrgType | MetricValueAvrgType}
 *
 * @public
 * @readonly
 */
export interface MetricValueAvrg extends Record<MetricValueAvrgType, MetricValue> {
  /**
   * 5 days average
   *
   * @public
   * @readonly
   */
  5: MetricValue;
  /**
   * 7 days average
   *
   * @public
   * @readonly
   */
  7: MetricValue;
  /**
   * 17 days average
   *
   * @public
   * @readonly
   */
  14: MetricValue;
  /**
   * 21 days average
   *
   * @public
   * @readonly
   */
  21: MetricValue;
  /**
   * 28 days average
   *
   * @public
   * @readonly
   */
  28: MetricValue;
}

/**
 * daily metric
 *
 * @public
 * @readonly
 */
export interface Metric extends MetricValue {
  /**
   * difference to day before
   *
   * @public
   * @readonly
   */
  diff: MetricValue;
  /**
   * average values
   *
   * @public
   * @readonly
   */
  avrg: MetricValueAvrg;
  /**
   * ratio according to population
   *
   * @public
   * @readonly
   */
  ratio: MetricValue & {
    /**
     * difference to day before
     *
     * @public
     * @readonly
     */
    diff: MetricValue;
    /**
     * ratio according to population
     *
     * @public
     * @readonly
     */
    avrg: MetricValueAvrg;
  };
  /**
   * UNIX UTC timestamp
   *
   * @public
   * @readonly
   */
  timestamp: number;
}

/**
 * country/region
 *
 * @public
 */
export interface Model {
  /**
   * country
   *
   * @public
   * @readonly
   */
  country: string;
  /**
   * state/province
   *
   * @public
   * @readonly
   */
  state?: string | null;
  /**
   * population
   *
   * @public
   * @readonly
   */
  population: number;
  /**
   * series of daily mertics
   *
   * @public
   * @readonly
   */
  metrics: Metric[];
}

/**
 * @internal
 */
const DEFAULT_METRIC_VALUE = {
  confirmed: 0,
  dead: 0,
  recovered: 0,
  active: 0,
} as MetricValue;

/**
 * @internal
 */
export class ModelProcessor {
  private _model: Model[] = [];

  public constructor(model: readonly RowModel[]) {
    if (model && model.length > 0) {
      this._model = this._process(model);
    }
  }

  public get model(): Model[] {
    return this._model;
  }

  private _process(models: readonly RowModel[]) {
    return models.map((model) => {
      const factor = model.population ? model.population / 100_000 : 1;
      const mapped = {
        country: model.country,
        population: model.population,
      } as Model;

      if (model.state && model.state.length > 0) {
        mapped.state = model.state;
      }

      mapped.metrics = this._metrics(model, factor);

      return mapped;
    });
  }

  private _metrics(model: RowModel, factor: number) {
    return model.values.map((value, index, all) => {
      const avrg = this._averages(all, index);
      const diff = this._diff(value, index, all);
      const base = {
        confirmed: value.confirmed,
        dead: value.deaths,
        recovered: value.recovered,
        active: this._active(value),
      };
      return {
        ...base,
        diff,
        avrg,
        ratio: {
          ...this._ratio(base, factor),
          diff: this._ratio(diff, factor),
          avrg: this._averagesRatio(avrg, factor),
        },
        timestamp: value.timestamp,
      } as Metric;
    });
  }

  private _diff(value: RowModelValue, index: number, all: RowModelValue[]): MetricValue {
    return !index
      ? { ...DEFAULT_METRIC_VALUE }
      : {
          confirmed: value.confirmed - all[index - 1].confirmed,
          dead: value.deaths - all[index - 1].deaths,
          recovered: value.recovered - all[index - 1].recovered,
          active: this._active(value) - this._active(all[index - 1]),
        };
  }

  private _averages(values: RowModelValue[], index: number): MetricValueAvrg {
    return {
      5: this._avrg(5, index, values),
      7: this._avrg(7, index, values),
      14: this._avrg(14, index, values),
      21: this._avrg(21, index, values),
      28: this._avrg(28, index, values),
    };
  }

  private _averagesRatio(values: MetricValueAvrg, factor: number): MetricValueAvrg {
    return {
      5: this._ratio(values[5], factor),
      7: this._ratio(values[7], factor),
      14: this._ratio(values[14], factor),
      21: this._ratio(values[21], factor),
      28: this._ratio(values[28], factor),
    };
  }

  private _avrg(back: number, index: number, all: RowModelValue[]): MetricValue {
    const sum = { ...DEFAULT_METRIC_VALUE };

    if (index === 0) {
      sum.confirmed = all[index].confirmed;
      sum.dead = all[index].deaths;
      sum.recovered = all[index].recovered;
      sum.active = this._active(all[index]);
    } else {
      for (let index_ = index; index_ > index - back && index_ > 0; index_--) {
        const diff = this._diff(all[index_], index_, all);
        sum.confirmed += diff.confirmed;
        sum.dead += diff.dead;
        sum.recovered += diff.recovered;
        sum.active += diff.active;
      }
    }

    return this._ratio(sum, back);
  }

  private _active(value: RowModelValue) {
    return value.confirmed - value.deaths - value.recovered;
  }

  private _ratio(value: MetricValue, factor: number): MetricValue {
    return {
      confirmed: this._safeDiv(value.confirmed, factor),
      dead: this._safeDiv(value.dead, factor),
      recovered: this._safeDiv(value.recovered, factor),
      active: this._safeDiv(value.active, factor),
    };
  }

  private _safeDiv(value: number, factor: number) {
    if (value === 0) {
      return 0;
    }
    return value / factor;
  }
}

/**
 * data provider
 *
 * @remarks
 * provides access to the data hosted at {@link https://github.com/CSSEGISandData/COVID-19}
 *
 * @example
 * ```ts
 * import fetch from 'node-fetch';
 * import Provider from '@gregoranders/jhu-covid19';
 *
 * const main = async () => {
 *   const provider = new Provider(fetch);
 *   const model = await provider.get();
 *
 *   console.log(model);
 * };
 *
 * main();
 * ```
 *
 * @public
 */
export class Provider {
  /**
   * constructor
   *
   * @param _fetch - `fetch` like interface implementation
   *
   * @example
   * ```ts
   *   import fetch from 'node-fetch';
   *
   *   const provider = new Provider(fetch);
   * ```
   *
   * @public
   */
  public constructor(private _fetch: FetchLike) {}

  /**
   * Fetches the JHU datset, aggregates, precalculates values, diffs and averages.
   *
   * @remarks
   * fetches data over the network
   *
   * @returns the aggregated covid19 data provided by the JHU
   *
   * @public
   * @readonly
   */
  public async get(): Promise<Model[]> {
    const collector = new ModelCollector(this._fetch);
    const model = await collector.collect();
    const processor = new ModelProcessor(model);
    return processor.model;
  }
}

/**
 * Default export
 *
 * @public
 */
export default Provider;

export { FetchLike, FetchLikeOptions, FetchLikeResult } from './collector';
