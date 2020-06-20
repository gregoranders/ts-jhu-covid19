# @gregoranders/jhu-covid19

## Provides access to the data published at the [COVID-19 Data Repository by the Center for Systems Science and Engineering (CSSE) at Johns Hopkins University](https://github.com/CSSEGISandData/COVID-19)

## [API Docs](./docs/api/index.md)

[![Dependency Status][daviddm-image]][daviddm-url]
[![License][license-image]][license-url]
[![Issues][issues-image]][issues-url]
[![Code maintainability][code-maintainability-image]][code-maintainability-url] [![Code issues][code-issues-image]][code-issues-url] [![Code Technical Debt][code-tech-debt-image]][code-tech-debt-url]

[![types][npm-types-image]][npm-types-url]
[![node][node-image]][node-url]

[![Main Language][language-image]][code-metric-url] [![Languages][languages-image]][code-metric-url] [![Code Size][code-size-image]][code-metric-url] [![Repo-Size][repo-size-image]][code-metric-url]

## Features

- [TypeScript][typescript-url]
- [Jest][jest-url] Unit Tests with Code Coverage
- GitHub CI Integration (feature, development, master, release)
- Publish via CI
- Code Quality via Code Climate

|                                                                  |                                                                            |                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [![Release][release-image]][release-url]                         |                                                                            | [![npm][npm-image]][npm-url]                                                 |
| [![Master Build][master-build-image]][master-url]                | [![Master Coverage][master-coveralls-image]][master-coveralls-url]         | [![Master Version][master-version-image]][master-version-url]                |
| [![Development Build][development-build-image]][development-url] | [![Test Coverage][development-coveralls-image]][development-coveralls-url] | [![Development Version][development-version-image]][development-version-url] |

## Example

```sh
npm install @gregoranders/jhu-covid19
```

```ts
import Provider from '@gregoranders/jhu-covid19';

const main = async () => {
  const provider = new Provider();
  const model = await provider.get();

  console.log(model);
};

main();
```

### Clone repository

```
git clone https://github.com/gregoranders/ts-jhu-covid19
```

### Install dependencies

```
npm install
```

### Build

```
npm run build
```

### Testing

#### Test using [Jest][jest-url]

```
npm test
```

### Code Climate Checks [docker required](docs/CODECLIMATE.md)

```
npm run codeclimate
```

### Clear

```
npm run clear
```

[release-url]: https://github.com/gregoranders/ts-jhu-covid19/releases
[master-url]: https://github.com/gregoranders/ts-jhu-covid19/tree/master
[development-url]: https://github.com/gregoranders/ts-jhu-covid19/tree/development
[repository-url]: https://github.com/gregoranders/ts-jhu-covid19
[code-metric-url]: https://github.com/gregoranders/ts-jhu-covid19/search?l=TypeScript
[travis-url]: https://travis-ci.org/gregoranders/ts-jhu-covid19
[travis-image]: https://travis-ci.org/gregoranders/ts-jhu-covid19.svg?branch=master
[daviddm-url]: https://david-dm.org/gregoranders/ts-jhu-covid19
[daviddm-image]: https://david-dm.org/gregoranders/ts-jhu-covid19.svg?branch=master
[license-url]: https://github.com/gregoranders/ts-jhu-covid19/blob/master/LICENSE
[license-image]: https://img.shields.io/github/license/gregoranders/ts-jhu-covid19.svg
[master-version-url]: https://github.com/gregoranders/ts-jhu-covid19/blob/master/package.json
[master-version-image]: https://img.shields.io/github/package-json/v/gregoranders/ts-jhu-covid19/master
[development-version-url]: https://github.com/gregoranders/ts-jhu-covid19/blob/development/package.json
[development-version-image]: https://img.shields.io/github/package-json/v/gregoranders/ts-jhu-covid19/development
[issues-url]: https://github.com/gregoranders/ts-jhu-covid19/issues
[issues-image]: https://img.shields.io/github/issues-raw/gregoranders/ts-jhu-covid19.svg
[release-build-image]: https://github.com/gregoranders/ts-jhu-covid19/workflows/Release%20CI/badge.svg
[master-build-image]: https://github.com/gregoranders/ts-jhu-covid19/workflows/Master%20CI/badge.svg
[development-build-image]: https://github.com/gregoranders/ts-jhu-covid19/workflows/Development%20CI/badge.svg
[master-coveralls-url]: https://coveralls.io/github/gregoranders/ts-jhu-covid19?branch=master
[master-coveralls-image]: https://img.shields.io/coveralls/github/gregoranders/ts-jhu-covid19/master
[development-coveralls-image]: https://img.shields.io/coveralls/github/gregoranders/ts-jhu-covid19/development
[development-coveralls-url]: https://coveralls.io/github/gregoranders/ts-jhu-covid19?branch=development
[code-maintainability-url]: https://codeclimate.com/github/gregoranders/ts-jhu-covid19/maintainability
[code-maintainability-image]: https://img.shields.io/codeclimate/maintainability/gregoranders/ts-jhu-covid19
[code-issues-url]: https://codeclimate.com/github/gregoranders/ts-jhu-covid19/maintainability
[code-issues-image]: https://img.shields.io/codeclimate/issues/gregoranders/ts-jhu-covid19
[code-tech-debt-url]: https://codeclimate.com/github/gregoranders/ts-jhu-covid19/maintainability
[code-tech-debt-image]: https://img.shields.io/codeclimate/tech-debt/gregoranders/ts-jhu-covid19
[master-circleci-image]: https://circleci.com/gh/gregoranders/ts-jhu-covid19/tree/master.svg?style=shield
[master-circleci-url]: https://app.circleci.com/pipelines/github/gregoranders/ts-jhu-covid19?branch=master
[development-circleci-image]: https://circleci.com/gh/gregoranders/ts-jhu-covid19/tree/development.svg?style=shield
[development-circleci-url]: https://app.circleci.com/pipelines/github/gregoranders/ts-jhu-covid19?branch=development
[npm-url]: https://www.npmjs.com/package/@gregoranders/jhu-covid19
[npm-image]: https://img.shields.io/npm/v/@gregoranders/jhu-covid19
[node-url]: https://www.npmjs.com/package/@gregoranders/jhu-covid19
[node-image]: https://img.shields.io/node/v/@gregoranders/jhu-covid19
[npm-types-url]: https://www.npmjs.com/package/@gregoranders/jhu-covid19
[npm-types-image]: https://img.shields.io/npm/types/@gregoranders/jhu-covid19
[release-url]: https://www.npmjs.com/package/@gregoranders/jhu-covid19
[release-image]: https://img.shields.io/github/release/gregoranders/ts-jhu-covid19
[language-image]: https://img.shields.io/github/languages/top/gregoranders/ts-csv
[languages-image]: https://img.shields.io/github/languages/count/gregoranders/ts-csv
[code-size-image]: https://img.shields.io/github/languages/code-size/gregoranders/ts-csv
[repo-size-image]: https://img.shields.io/github/repo-size/gregoranders/ts-csv
[typescript-url]: http://www.typescriptlang.org/
[jest-url]: https://jestjs.io
