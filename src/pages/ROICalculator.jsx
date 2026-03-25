// ROI Calculator component — computes live projections from discovery data

export function computeROI(d) {
  // Defaults / fallbacks
  const estimatesPerMonth = Number(d.estimates_per_month) || 0
  const jobsPerMonth = Number(d.jobs_per_month) || 0
  const annualRevenue = Number(d.annual_revenue) || 0
  const estimatorRate = Number(d.estimator_hourly_rate) || 75
  const csrRate = Number(d.csr_planner_hourly_rate) || 55
  const minSimple = Number(d.minutes_per_simple_estimate) || 0
  const minComplex = Number(d.minutes_per_complex_estimate) || 0
  const avgEstMin = minSimple > 0 && minComplex > 0 ? (minSimple + minComplex) / 2 : minSimple || minComplex || 0
  const minPerJobEntry = Number(d.minutes_per_job_entry) || 0
  const paperWasteActual = Number(d.material_waste_pct_actual || d.paper_waste_pct) || 0
  const paperWasteTarget = Number(d.material_waste_pct_target) || Math.max(0, paperWasteActual - 2)
  const unbilledAlterations = Number(d.unbilled_alterations_monthly) || 0
  const unbilledFreight = Number(d.unbilled_freight_monthly) || 0
  const lateDeliveryPenalties = Number(d.late_delivery_penalties_annual) || 0
  const annualWriteoffs = Number(d.annual_writeoffs) || 0
  const annualBadDebt = Number(d.annual_bad_debt) || 0
  const monthlyClosedays = Number(d.monthly_close_days) || 0
  const annualSoftwareCost = Number(d.annual_software_cost) || 0
  const doubleEntrySystems = Number(d.double_entry_systems) || 0

  // 1. ESTIMATING SAVINGS
  // Assume 40% time reduction with MIS
  const currentEstHoursPerMonth = (estimatesPerMonth * avgEstMin) / 60
  const estimatingSavingsMonthly = currentEstHoursPerMonth * 0.40 * estimatorRate
  const estimatingSavingsAnnual = estimatingSavingsMonthly * 12

  // 2. JOB ENTRY SAVINGS
  // Assume 60% reduction (auto-conversion from estimate)
  const currentJobEntryHoursPerMonth = (jobsPerMonth * minPerJobEntry) / 60
  const jobEntrySavingsMonthly = currentJobEntryHoursPerMonth * 0.60 * csrRate
  const jobEntrySavingsAnnual = jobEntrySavingsMonthly * 12

  // 3. MATERIAL WASTE SAVINGS
  // Reduction from actual to target waste %
  const materialCostEstimate = annualRevenue * 0.35 // materials ~35% of revenue in print
  const wasteReduction = Math.max(0, paperWasteActual - paperWasteTarget) / 100
  const materialSavingsAnnual = materialCostEstimate * wasteReduction

  // 4. REVENUE RECOVERED
  // Unbilled alterations + freight + improved pricing accuracy
  const revenueRecoveredAnnual = (unbilledAlterations * 12) + (unbilledFreight * 12) +
    (annualRevenue * 0.005) // 0.5% pricing accuracy improvement

  // 5. BILLING & AR SAVINGS
  // Reduced bad debt + faster close + reduced disputes
  const billingSavingsAnnual = (annualBadDebt * 0.50) + (annualWriteoffs * 0.40) +
    (lateDeliveryPenalties * 0.30)

  // 6. SCHEDULING & EFFICIENCY GAINS
  // Assume 2% on-time delivery improvement -> cost avoidance
  const schedulingSavingsAnnual = lateDeliveryPenalties * 0.30

  // 7. SYSTEM CONSOLIDATION
  // Replace multiple systems
  const systemSavingsAnnual = annualSoftwareCost * 0.20 // 20% consolidation savings

  // 8. DATA ENTRY ELIMINATION
  const dataEntryHoursPerMonth = doubleEntrySystems * jobsPerMonth * 5 / 60 // 5 min per re-entry
  const dataEntrySavingsAnnual = dataEntryHoursPerMonth * csrRate * 12

  // TOTALS
  const totalAnnualSavings = estimatingSavingsAnnual + jobEntrySavingsAnnual +
    materialSavingsAnnual + revenueRecoveredAnnual + billingSavingsAnnual +
    schedulingSavingsAnnual + systemSavingsAnnual + dataEntrySavingsAnnual

  const implementationCost = annualRevenue > 5000000 ? 150000 :
    annualRevenue > 2000000 ? 100000 :
    annualRevenue > 500000 ? 60000 : 35000

  const roiPct = implementationCost > 0 ? Math.round((totalAnnualSavings / implementationCost) * 100) : 0
  const paybackMonths = totalAnnualSavings > 0 ? Math.round((implementationCost / totalAnnualSavings) * 12) : 0

  return {
    categories: [
      { key: "estimating", label: "Estimating Time Savings", annual: estimatingSavingsAnnual, type: "time",
        detail: `${Math.round(currentEstHoursPerMonth)}h/mo current → 40% reduction at $${estimatorRate}/hr` },
      { key: "job_entry", label: "Job Entry & Planning", annual: jobEntrySavingsAnnual, type: "time",
        detail: `${Math.round(currentJobEntryHoursPerMonth)}h/mo current → 60% reduction at $${csrRate}/hr` },
      { key: "materials", label: "Material Waste Reduction", annual: materialSavingsAnnual, type: "waste",
        detail: `${paperWasteActual}% → ${paperWasteTarget}% waste on ~$${fmt(materialCostEstimate)} material cost` },
      { key: "revenue", label: "Revenue Recovered", annual: revenueRecoveredAnnual, type: "revenue",
        detail: `Unbilled alterations ($${fmt(unbilledAlterations * 12)}/yr) + freight ($${fmt(unbilledFreight * 12)}/yr) + pricing accuracy` },
      { key: "billing", label: "Billing & AR Improvement", annual: billingSavingsAnnual, type: "revenue",
        detail: `50% bad debt reduction + 40% write-off reduction + 30% penalty reduction` },
      { key: "scheduling", label: "Scheduling Efficiency", annual: schedulingSavingsAnnual, type: "time",
        detail: `30% reduction in late delivery penalties` },
      { key: "systems", label: "System Consolidation", annual: systemSavingsAnnual, type: "cost",
        detail: `20% savings on $${fmt(annualSoftwareCost)}/yr current software cost` },
      { key: "data_entry", label: "Data Entry Elimination", annual: dataEntrySavingsAnnual, type: "time",
        detail: `${doubleEntrySystems} systems × ${jobsPerMonth} jobs/mo re-entry eliminated` },
    ],
    totalAnnualSavings,
    implementationCost,
    roiPct,
    paybackMonths,
    fiveYearValue: (totalAnnualSavings * 5) - implementationCost,
    monthly: totalAnnualSavings / 12
  }
}

function fmt(n) {
  return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export default function ROICalculatorPanel({ data }) {
  const roi = computeROI(data)
  const typeColors = { time: "#3b82f6", waste: "#f59e0b", revenue: "#10b981", cost: "#6366f1" }
  const typeLabels = { time: "Time Saved", waste: "Waste Reduced", revenue: "Revenue Recovered", cost: "Cost Visibility" }

  // Find max for bar scaling
  const maxVal = Math.max(...roi.categories.map(c => c.annual), 1)

  return (
    <div>
      {/* Hero KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Annual Savings", value: `$${fmt(roi.totalAnnualSavings)}`, color: "#10b981", sub: `$${fmt(roi.monthly)}/month` },
          { label: "ROI", value: `${roi.roiPct}%`, color: "#3b82f6", sub: "return on investment" },
          { label: "Payback", value: roi.paybackMonths > 0 ? `${roi.paybackMonths} mo` : "—", color: "#f59e0b", sub: "to break even" },
          { label: "5-Year Value", value: `$${fmt(roi.fiveYearValue)}`, color: "#6366f1", sub: "net of implementation" },
        ].map((kpi, i) => (
          <div key={i} style={{ backgroundColor: "white", borderRadius: "10px", padding: "20px",
            border: "0.5px solid #e2e8f0", borderTop: `3px solid ${kpi.color}`, textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 6px 0", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>{kpi.label}</p>
            <p style={{ fontSize: "32px", fontWeight: "700", color: kpi.color, margin: "0 0 2px 0" }}>{kpi.value}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ROI by Category */}
      <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "24px",
        border: "0.5px solid #e2e8f0", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Savings Breakdown</h3>
          <div style={{ display: "flex", gap: "12px" }}>
            {Object.entries(typeLabels).map(([key, label]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: typeColors[key] }} />
                <span style={{ fontSize: "11px", color: "#64748b" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {roi.categories.filter(c => c.annual > 0).sort((a, b) => b.annual - a.annual).map(cat => (
          <div key={cat.key} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{cat.label}</span>
                <span style={{ fontSize: "10px", fontWeight: "600", padding: "1px 6px", borderRadius: "3px",
                  backgroundColor: typeColors[cat.type] + "18", color: typeColors[cat.type] }}>
                  {typeLabels[cat.type]}
                </span>
              </div>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>${fmt(cat.annual)}/yr</span>
            </div>
            <div style={{ height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden", marginBottom: "3px" }}>
              <div style={{ width: `${Math.round((cat.annual / maxVal) * 100)}%`, height: "100%",
                backgroundColor: typeColors[cat.type], borderRadius: "4px", transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{cat.detail}</p>
          </div>
        ))}

        {roi.categories.filter(c => c.annual > 0).length === 0 && (
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "14px", padding: "20px" }}>
            Fill in the discovery sections above to see ROI projections
          </p>
        )}
      </div>

      {/* Investment Summary */}
      <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "24px",
        border: "0.5px solid #e2e8f0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 16px 0" }}>Investment Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "16px" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Estimated Implementation</p>
            <p style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>${fmt(roi.implementationCost)}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0 0" }}>Based on business size</p>
          </div>
          <div style={{ backgroundColor: "#f0fdf4", borderRadius: "8px", padding: "16px" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Annual Return</p>
            <p style={{ fontSize: "24px", fontWeight: "700", color: "#10b981", margin: 0 }}>${fmt(roi.totalAnnualSavings)}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0 0" }}>{roi.roiPct}% return on investment</p>
          </div>
        </div>

        {/* Year-over-year projection */}
        <div style={{ marginTop: "16px", borderTop: "0.5px solid #e2e8f0", paddingTop: "16px" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>5-Year Projection</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "80px" }}>
            {[1, 2, 3, 4, 5].map(yr => {
              const cumulative = (roi.totalAnnualSavings * yr) - roi.implementationCost
              const maxH = (roi.totalAnnualSavings * 5) - roi.implementationCost
              const h = maxH > 0 ? Math.max(8, Math.round((Math.max(0, cumulative) / maxH) * 70)) : 8
              return (
                <div key={yr} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: `${h}px`, backgroundColor: cumulative >= 0 ? "#10b981" : "#ef4444",
                    borderRadius: "4px 4px 0 0", transition: "height 0.3s", marginBottom: "4px" }} />
                  <p style={{ fontSize: "11px", fontWeight: "600", color: cumulative >= 0 ? "#10b981" : "#ef4444", margin: "0 0 1px 0" }}>
                    ${fmt(cumulative)}
                  </p>
                  <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0 }}>Year {yr}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
