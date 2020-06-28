/**
 * Provides access to the data published at the COVID-19 Data Repository by the Center for Systems Science and Engineering (CSSE) at Johns Hopkins University.
 *
 * https://github.com/CSSEGISandData/COVID-19
 *
 * @packageDocumentation
 */
import { default as Provider } from './provider';

/**
 * library name
 *
 * @public
 * @readonly
 */
export const libname = '@gregoranders/jhu-covid19';

/**
 * library version
 *
 * @public
 * @readonly
 */
export const libversion = '0.0.8';

/**
 * library homepage
 *
 * @public
 * @readonly
 */
export const liburl = 'https://gregoranders.github.io/ts-jhu-covid19/';

/**
 * @public
 */
export {
  FetchLike,
  FetchLikeOptions,
  FetchLikeResult,
  Metric,
  MetricValue,
  MetricValueAvrg,
  MetricValueAvrgType,
  MetricValueType,
  Model,
  Provider,
} from './provider';

/**
 * @public
 */
export default Provider;
