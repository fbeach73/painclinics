"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  NATIONAL_STATS,
  AGE_BREAKDOWN,
  TREND_DATA,
  SOURCES,
  getStateStats,
} from "@/data/guide-stats";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const barChartConfig = {
  chronicPain: {
    label: "Chronic Pain",
    color: "hsl(210 80% 55%)",
  },
  highImpact: {
    label: "High-Impact",
    color: "hsl(20 80% 52%)",
  },
} satisfies ChartConfig;

const lineChartConfig = {
  percent: {
    label: "% Adults with Chronic Pain",
    color: "hsl(210 80% 55%)",
  },
} satisfies ChartConfig;

interface GuideStatsSectionProps {
  stateAbbreviation: string;
}

export function GuideStatsSection({
  stateAbbreviation,
}: GuideStatsSectionProps) {
  const stateStats = getStateStats(stateAbbreviation);
  const stateName = STATE_NAMES[stateAbbreviation] || stateAbbreviation;

  if (!stateStats) return null;

  return (
    <section
      className="mb-12 rounded-xl border border-border bg-card p-6 md:p-8"
      aria-label="Chronic pain statistics"
    >
      {/* Section header */}
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Pain Management in {stateName}
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-1 mb-2">
        Chronic pain by the numbers
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        {stateName} is home to roughly {stateStats.population} adults. Applying
        national prevalence rates, an estimated{" "}
        <strong className="text-foreground">
          {stateStats.estimatedChronicPain} {stateName} residents
        </strong>{" "}
        live with chronic pain — making access to quality pain management a
        significant public health priority.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg bg-blue-600 dark:bg-blue-700 p-4 text-white">
          <p className="text-xs text-blue-100 mb-1.5">
            US adults with chronic pain (2023)
          </p>
          <p className="text-2xl font-semibold">
            {NATIONAL_STATS.chronicPainPercent}%
          </p>
          <p className="text-xs text-amber-200 mt-1.5">
            ↑ from {NATIONAL_STATS.previousPercent}% in{" "}
            {NATIONAL_STATS.previousYear}
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            High-impact chronic pain
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {NATIONAL_STATS.highImpactPercent}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Limits daily life or work activities
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            Americans affected (2023)
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {NATIONAL_STATS.totalAffected}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Highest prevalence ever recorded
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Age breakdown bar chart */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Chronic pain by age group (US, 2023)
          </p>
          <div className="flex gap-3 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: "hsl(210 80% 55%)" }}
              />
              Chronic pain
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: "hsl(20 80% 52%)" }}
              />
              High-impact
            </span>
          </div>
          <ChartContainer config={barChartConfig} className="h-[210px] w-full">
            <BarChart
              data={[...AGE_BREAKDOWN]}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 45]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${value}%`}
                  />
                }
              />
              <Bar
                dataKey="chronicPain"
                fill="var(--color-chronicPain)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="highImpact"
                fill="var(--color-highImpact)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Trend line chart */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Chronic pain trend (US, 2016–2023)
          </p>
          <div className="flex gap-3 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: "hsl(210 80% 55%)" }}
              />
              % adults with chronic pain
            </span>
          </div>
          <ChartContainer config={lineChartConfig} className="h-[210px] w-full">
            <LineChart
              data={[...TREND_DATA]}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
                domain={[18, 27]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${value}%`}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="percent"
                stroke="var(--color-percent)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--color-percent)" }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      {/* State-specific insights */}
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        Key findings for {stateName}
      </p>
      <div className="space-y-2 mb-5">
        {stateStats.insights.map((insight, i) => (
          <div
            key={i}
            className="border-l-2 border-blue-600 dark:border-blue-400 bg-slate-100 dark:bg-slate-800 rounded-r-lg px-3.5 py-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100"
          >
            {insight}
          </div>
        ))}
      </div>

      {/* Source citation */}
      <p className="text-[11px] text-muted-foreground/60 border-t border-border pt-3">
        {SOURCES}
      </p>
    </section>
  );
}
