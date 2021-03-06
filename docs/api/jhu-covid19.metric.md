<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@gregoranders/jhu-covid19](./jhu-covid19.md) &gt; [Metric](./jhu-covid19.metric.md)

## Metric interface

daily metric

<b>Signature:</b>

```typescript
export interface Metric extends MetricValue 
```
<b>Extends:</b> [MetricValue](./jhu-covid19.metricvalue.md)

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [avrg](./jhu-covid19.metric.avrg.md) | [MetricValueAvrg](./jhu-covid19.metricvalueavrg.md) | average values |
|  [diff](./jhu-covid19.metric.diff.md) | [MetricValue](./jhu-covid19.metricvalue.md) | difference to day before |
|  [ratio](./jhu-covid19.metric.ratio.md) | [MetricValue](./jhu-covid19.metricvalue.md) &amp; { diff: [MetricValue](./jhu-covid19.metricvalue.md)<!-- -->; avrg: [MetricValueAvrg](./jhu-covid19.metricvalueavrg.md)<!-- -->; } | ratio according to population |
|  [timestamp](./jhu-covid19.metric.timestamp.md) | number | UNIX UTC timestamp |

