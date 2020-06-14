import { ModelCollector, RowModel, RowModelValue } from './collector';


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
};

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
    if (model && model.length) {
      this._model = this.process(model);
    }
  }

  public get model(): Model[] {
    return this._model;
  }

  private process(models: readonly RowModel[]) {
    return models.map((model) => {
      const factor = model.population ? model.population / 100000 : 1;
      const mapped = {
        country: model.country,
        population: model.population,
      } as Model;

      if (model.state && model.state.length) {
        mapped.state = model.state;
      }

      mapped.metrics = this.metrics(model, factor);

      return mapped;
    });
  }

  private metrics(model: RowModel, factor: number) {
    return model.values.map((value, index, all) => {
      const avrg = this.averages(all, index);
      const diff = this.diff(value, index, all);
      const base = {
        confirmed: value.confirmed,
        dead: value.deaths,
        recovered: value.recovered,
        active: this.active(value),
      };
      return {
        ...base,
        diff,
        avrg,
        ratio: {
          ...this.ratio(base, factor),
          diff: this.ratio(diff, factor),
          avrg: this.averagesRatio(avrg, factor),
        },
        timestamp: value.timestamp,
      } as Metric;
    });
  }

  private diff(value: RowModelValue, index: number, all: RowModelValue[]): MetricValue {
    if (!index) {
      return DEFAULT_METRIC_VALUE;
    } else {
      return {
        confirmed: value.confirmed - all[index - 1].confirmed,
        dead: value.deaths - all[index - 1].deaths,
        recovered: value.recovered - all[index - 1].recovered,
        active: this.active(value) - this.active(all[index - 1]),
      };
    }
  }

  private averages(values: RowModelValue[], index: number): MetricValueAvrg {
    return {
      5: this.avrg(5, index, values),
      7: this.avrg(7, index, values),
      14: this.avrg(14, index, values),
      21: this.avrg(21, index, values),
      28: this.avrg(28, index, values),
    };
  }

  private averagesRatio(values: MetricValueAvrg, factor: number): MetricValueAvrg {
    return {
      5: this.ratio(values[5], factor),
      7: this.ratio(values[7], factor),
      14: this.ratio(values[14], factor),
      21: this.ratio(values[21], factor),
      28: this.ratio(values[28], factor),
    };
  }

  private avrg(back: number, index: number, all: RowModelValue[]): MetricValue {
    let sum = DEFAULT_METRIC_VALUE;

    if (!index) {
      sum.confirmed = all[index].confirmed;
      sum.dead = all[index].deaths;
      sum.recovered = all[index].recovered;
      sum.active = this.active(all[index]);
      return sum;
    }

    let iter = 0;
    for (let idx = index; idx > index - back && idx > 0; idx--) {
      const diff = this.diff(all[idx], idx, all);
      sum.confirmed += diff.confirmed;
      sum.dead += diff.dead;
      sum.recovered += diff.recovered;
      sum.active += diff.active;
      iter++;
    }

    /* istanbul ignore next */
    if (iter) {
      sum = this.ratio(sum, iter);
    }

    return sum;
  }

  private active(value: RowModelValue) {
    return value.confirmed - value.deaths - value.recovered;
  }

  private ratio(value: MetricValue, factor: number): MetricValue {
    return {
      confirmed: value.confirmed / factor,
      dead: value.dead / factor,
      recovered: value.recovered / factor,
      active: value.active / factor,
    };
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
 * import Provider from '@gregoranders/jhu-covid19';
 *
 * const main = async () => {
 *   const provider = new Provider();
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
    const collector = new ModelCollector();
    const model = await collector.collect();
    const processor = new ModelProcessor(model);
    return Promise.resolve(processor.model);
  }
}

/**
 * Default export
 *
 * @public
 */
export default Provider;
