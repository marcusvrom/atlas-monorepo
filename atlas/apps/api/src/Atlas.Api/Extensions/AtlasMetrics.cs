using System.Diagnostics.Metrics;

namespace Atlas.Api.Extensions;

public static class AtlasMetrics
{
    public const string MeterName = "Atlas";

    private static readonly Meter Meter = new(MeterName, "1.0.0");

    public static readonly Counter<long> SessionsCompleted =
        Meter.CreateCounter<long>("atlas.sessions.completed", "session");

    public static readonly Histogram<double> SyncBatchLatency =
        Meter.CreateHistogram<double>("atlas.sync.batch.latency", "ms");

    public static readonly Counter<long> SyncConflicts =
        Meter.CreateCounter<long>("atlas.sync.conflicts", "conflict");

    /// <summary>Tags: feature, plan. Alimenta a análise de conversão do freemium.</summary>
    public static readonly Counter<long> PaywallHits =
        Meter.CreateCounter<long>("atlas.paywall.hit", "hit");

    public static readonly UpDownCounter<long> ActiveEngagements =
        Meter.CreateUpDownCounter<long>("atlas.coaching.engagements.active", "engagement");
}
