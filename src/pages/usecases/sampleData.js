// Sample data for Cascade Print Group — Use Cases & Testing
const uid = (n) => `uc-${n.toString().padStart(3, "0")}`
const tid = (u, n) => `tc-${u}-${n}`
const did = (n) => `df-${n.toString().padStart(3, "0")}`
const cid = (n) => `cy-${n.toString().padStart(3, "0")}`

export const SAMPLE_CYCLES = [
  {
    id: cid(1), name: "Cycle 1 — Core Workflows", description: "Initial validation of estimating, job ticketing, and scheduling",
    owner: "Sarah Mitchell", start_date: "2026-03-10", end_date: "2026-03-21",
    status: "In Progress",
    use_case_ids: [uid(1), uid(2), uid(3), uid(4)]
  },
  {
    id: cid(2), name: "Cycle 2 — Financials & Shipping", description: "Validate invoicing, inventory and shipping workflows",
    owner: "Sarah Mitchell", start_date: "2026-03-24", end_date: "2026-04-04",
    status: "Planned",
    use_case_ids: [uid(5), uid(6), uid(7)]
  }
]

export const SAMPLE_SIGNOFFS = [
  { id: "so-1", use_case_id: uid(1), signer_name: "Mark Reynolds", signer_role: "Operations Director", signed: true, signed_at: "2026-03-18T14:00:00Z" },
  { id: "so-2", use_case_id: uid(1), signer_name: "Lisa Chen", signer_role: "IT Manager", signed: true, signed_at: "2026-03-18T16:30:00Z" },
  { id: "so-3", use_case_id: uid(1), signer_name: "David Kowalski", signer_role: "CFO", signed: false, signed_at: null },
  { id: "so-4", use_case_id: uid(2), signer_name: "Mark Reynolds", signer_role: "Operations Director", signed: false, signed_at: null },
  { id: "so-5", use_case_id: uid(2), signer_name: "Lisa Chen", signer_role: "IT Manager", signed: false, signed_at: null },
  { id: "so-6", use_case_id: uid(2), signer_name: "David Kowalski", signer_role: "CFO", signed: false, signed_at: null },
  { id: "so-7", use_case_id: uid(3), signer_name: "Mark Reynolds", signer_role: "Operations Director", signed: true, signed_at: "2026-03-19T09:00:00Z" },
  { id: "so-8", use_case_id: uid(3), signer_name: "Lisa Chen", signer_role: "IT Manager", signed: false, signed_at: null },
  { id: "so-9", use_case_id: uid(3), signer_name: "David Kowalski", signer_role: "CFO", signed: false, signed_at: null },
  { id: "so-10", use_case_id: uid(4), signer_name: "Mark Reynolds", signer_role: "Operations Director", signed: false, signed_at: null },
  { id: "so-11", use_case_id: uid(4), signer_name: "Lisa Chen", signer_role: "IT Manager", signed: false, signed_at: null },
  { id: "so-12", use_case_id: uid(4), signer_name: "David Kowalski", signer_role: "CFO", signed: false, signed_at: null },
  { id: "so-13", use_case_id: uid(5), signer_name: "Mark Reynolds", signer_role: "Operations Director", signed: false, signed_at: null },
  { id: "so-14", use_case_id: uid(5), signer_name: "Lisa Chen", signer_role: "IT Manager", signed: false, signed_at: null },
  { id: "so-15", use_case_id: uid(5), signer_name: "David Kowalski", signer_role: "CFO", signed: false, signed_at: null },
]

export const SAMPLE_USE_CASES = [
  {
    id: uid(1),
    name: "Estimate Creation Workflow",
    module: "Estimating",
    workflow_area: "Sales & Estimating",
    type_tags: ["Core", "Revenue"],
    owner: "Sarah Mitchell",
    tester: "James Park",
    priority: "Critical",
    cycle_id: cid(1),
    status: "Passed",
    description: "Validate the full estimate creation workflow from customer request through final pricing. The estimator receives a request for quote, selects appropriate substrates, calculates press time, finishing operations, and generates a customer-facing quote document with markup and margin targets.",
    expected_steps: [
      "Open new estimate from customer request",
      "Select substrate and stock from catalog",
      "Configure press specifications (colors, size, run length)",
      "Add finishing operations (cutting, folding, binding)",
      "System calculates material cost and press time",
      "Apply margin rules and generate customer price",
      "Review estimate summary and approve",
      "Generate PDF quote and send to customer"
    ],
    tests: [
      { id: tid(1, 1), name: "Create estimate with standard specs", expected_outcome: "Estimate created with correct pricing calculation", result: "Pass", status: "Complete", tester: "James Park" },
      { id: tid(1, 2), name: "Multi-component estimate", expected_outcome: "All components roll up into single quote total", result: "Pass", status: "Complete", tester: "James Park" },
      { id: tid(1, 3), name: "Quantity break pricing", expected_outcome: "Price per unit decreases at configured break points", result: "Pass", status: "Complete", tester: "James Park" },
      { id: tid(1, 4), name: "PDF quote generation", expected_outcome: "PDF renders all line items, totals, and terms", result: "Pass", status: "Complete", tester: "Sarah Mitchell" },
    ]
  },
  {
    id: uid(2),
    name: "Job Ticket Generation",
    module: "Production",
    workflow_area: "Order Entry",
    type_tags: ["Core", "Operations"],
    owner: "Sarah Mitchell",
    tester: "Amy Torres",
    priority: "Critical",
    cycle_id: cid(1),
    status: "Failed",
    description: "When an estimate is converted to an order, the system must automatically generate a job ticket with all production specifications. The job ticket drives scheduling, material procurement, and shop floor instructions.",
    expected_steps: [
      "Convert approved estimate to sales order",
      "System generates job ticket automatically",
      "Job ticket inherits specs from estimate",
      "Production steps are sequenced based on workflow template",
      "Material requirements are calculated and reserved",
      "Job ticket is routed to scheduling queue",
      "Shop floor can view job ticket on press console"
    ],
    tests: [
      { id: tid(2, 1), name: "Auto-generate job ticket from order", expected_outcome: "Job ticket created with all estimate specs inherited", result: "Pass", status: "Complete", tester: "Amy Torres" },
      { id: tid(2, 2), name: "Production step sequencing", expected_outcome: "Steps ordered per workflow template: prepress > press > finishing", result: "Pass", status: "Complete", tester: "Amy Torres" },
      { id: tid(2, 3), name: "Material reservation on ticket creation", expected_outcome: "Substrate inventory reserved when job ticket is created", result: "Fail", status: "Complete", tester: "Amy Torres" },
      { id: tid(2, 4), name: "Shop floor display", expected_outcome: "Job ticket renders correctly on press console view", result: null, status: "Pending", tester: "James Park" },
      { id: tid(2, 5), name: "Multi-version job ticket", expected_outcome: "Revised tickets create new version, preserve history", result: null, status: "Pending", tester: "Amy Torres" },
    ]
  },
  {
    id: uid(3),
    name: "Production Scheduling",
    module: "Scheduling",
    workflow_area: "Production Planning",
    type_tags: ["Core", "Operations"],
    owner: "Mark Reynolds",
    tester: "James Park",
    priority: "Critical",
    cycle_id: cid(1),
    status: "In Progress",
    description: "Validate the drag-and-drop production scheduling board. Schedulers must be able to assign jobs to presses, set run sequences, handle conflicts, and visualize capacity across the shop floor for the upcoming two weeks.",
    expected_steps: [
      "Open scheduling board with two-week view",
      "Unscheduled jobs appear in queue panel",
      "Drag job onto press timeline slot",
      "System validates press capability against job specs",
      "Conflict detection alerts on double-booking",
      "Adjust job duration based on run length",
      "Save schedule and notify production team"
    ],
    tests: [
      { id: tid(3, 1), name: "Drag-and-drop job assignment", expected_outcome: "Job snaps to press timeline and saves position", result: "Pass", status: "Complete", tester: "James Park" },
      { id: tid(3, 2), name: "Press capability validation", expected_outcome: "System blocks assignment if press cannot handle job specs", result: "Pass", status: "Complete", tester: "James Park" },
      { id: tid(3, 3), name: "Conflict detection", expected_outcome: "Warning shown when two jobs overlap on same press", result: null, status: "Pending", tester: "James Park" },
      { id: tid(3, 4), name: "Capacity visualization", expected_outcome: "Color-coded bars show utilization percentage per press", result: null, status: "Pending", tester: "Amy Torres" },
    ]
  },
  {
    id: uid(4),
    name: "Inventory Management",
    module: "Inventory",
    workflow_area: "Materials & Warehouse",
    type_tags: ["Core", "Supply Chain"],
    owner: "Lisa Chen",
    tester: "Amy Torres",
    priority: "Standard",
    cycle_id: cid(1),
    status: "Not Started",
    description: "Validate real-time inventory tracking for substrates, inks, and finishing supplies. The system should maintain accurate stock levels, trigger reorder alerts, and support barcode scanning for receiving and consumption.",
    expected_steps: [
      "View current stock levels by warehouse location",
      "Receive new inventory via barcode scan",
      "System updates stock quantity in real-time",
      "Job consumption deducts materials automatically",
      "Low stock alert triggers at reorder point",
      "Generate purchase order from reorder suggestion",
      "Audit trail shows all inventory movements"
    ],
    tests: [
      { id: tid(4, 1), name: "Stock level dashboard", expected_outcome: "All materials shown with current quantity and location", result: null, status: "Pending", tester: "Amy Torres" },
      { id: tid(4, 2), name: "Barcode receiving", expected_outcome: "Scanned items update stock immediately", result: null, status: "Pending", tester: "Amy Torres" },
      { id: tid(4, 3), name: "Auto-deduction on job completion", expected_outcome: "Material consumed by job reduces stock count", result: null, status: "Pending", tester: "James Park" },
    ]
  },
  {
    id: uid(5),
    name: "Invoice Generation",
    module: "Billing",
    workflow_area: "Finance",
    type_tags: ["Core", "Revenue"],
    owner: "David Kowalski",
    tester: "Sarah Mitchell",
    priority: "Critical",
    cycle_id: cid(2),
    status: "Not Started",
    description: "When a job is marked as shipped, the system should auto-generate an invoice based on the order pricing, apply any contract terms or volume discounts, and push the invoice to the accounting system.",
    expected_steps: [
      "Job marked as shipped triggers invoice generation",
      "Invoice pulls pricing from sales order",
      "Contract terms and discounts applied automatically",
      "Tax calculations based on ship-to jurisdiction",
      "Invoice sent to customer via configured channel",
      "Invoice synced to accounting system (QuickBooks/SAP)"
    ],
    tests: [
      { id: tid(5, 1), name: "Auto-invoice on shipment", expected_outcome: "Invoice created within 1 minute of ship confirmation", result: null, status: "Pending", tester: "Sarah Mitchell" },
      { id: tid(5, 2), name: "Volume discount application", expected_outcome: "Contract pricing tiers applied correctly to invoice", result: null, status: "Pending", tester: "Sarah Mitchell" },
      { id: tid(5, 3), name: "Accounting system sync", expected_outcome: "Invoice appears in QuickBooks within 5 minutes", result: null, status: "Pending", tester: "David Kowalski" },
    ]
  },
  {
    id: uid(6),
    name: "Shipping & Delivery",
    module: "Shipping",
    workflow_area: "Logistics",
    type_tags: ["Operations", "Fulfillment"],
    owner: "Mark Reynolds",
    tester: "James Park",
    priority: "Standard",
    cycle_id: cid(2),
    status: "Draft",
    description: "Validate the shipping workflow from packing slip generation through carrier integration and delivery confirmation. Support split shipments and partial deliveries.",
    expected_steps: [
      "Generate packing slip from completed job",
      "Select carrier and service level",
      "Print shipping labels via carrier API",
      "Record tracking number on shipment",
      "Customer receives shipment notification email",
      "Delivery confirmation updates order status"
    ],
    tests: [
      { id: tid(6, 1), name: "Packing slip generation", expected_outcome: "Packing slip lists all items with quantities", result: null, status: "Pending", tester: "James Park" },
      { id: tid(6, 2), name: "Carrier label printing", expected_outcome: "UPS/FedEx label prints with correct weight and dims", result: null, status: "Pending", tester: "James Park" },
    ]
  },
  {
    id: uid(7),
    name: "Customer Approval Portal",
    module: "Portal",
    workflow_area: "Customer Experience",
    type_tags: ["External", "Approval"],
    owner: "Lisa Chen",
    tester: "Amy Torres",
    priority: "Standard",
    cycle_id: cid(2),
    status: "Draft",
    description: "Customers can log into the web portal to review proofs, approve or reject with comments, track order status, and view invoice history. The portal must support multi-user access per account.",
    expected_steps: [
      "Customer logs in with secure credentials",
      "Dashboard shows pending proofs and active orders",
      "Open proof viewer with annotation tools",
      "Approve or reject proof with comments",
      "Approval triggers next production step",
      "View order tracking and delivery status",
      "Access invoice history and download PDFs"
    ],
    tests: [
      { id: tid(7, 1), name: "Portal login and dashboard", expected_outcome: "Customer sees only their account's orders and proofs", result: null, status: "Pending", tester: "Amy Torres" },
      { id: tid(7, 2), name: "Proof approval workflow", expected_outcome: "Approved proof moves job to production queue", result: null, status: "Pending", tester: "Amy Torres" },
      { id: tid(7, 3), name: "Order tracking view", expected_outcome: "Real-time status shown for each open order", result: null, status: "Pending", tester: "Sarah Mitchell" },
    ]
  }
]

export const SAMPLE_DEFECTS = [
  {
    id: did(1),
    test_case_id: tid(2, 3),
    use_case_id: uid(2),
    title: "Material reservation fails on multi-component jobs",
    severity: "Critical",
    status: "Open",
    description: "When a job ticket is created for an order with multiple components (e.g., cover + text block), only the first component's substrate is reserved. Subsequent components show 'reservation pending' indefinitely.",
    steps_to_reproduce: "1. Create estimate with 2+ components using different substrates\n2. Convert to order\n3. Observe job ticket material reservations",
    expected_result: "All component substrates reserved simultaneously on job ticket creation",
    actual_result: "Only first component substrate reserved. Second component shows 'reservation pending' and never completes.",
    impact: "Production cannot start until materials are manually reserved. Risk of stockouts if not caught before press time.",
    logged_by: "Amy Torres",
    assigned_to: "James Park",
    logged_at: "2026-03-17T10:30:00Z",
    resolved_at: null,
    module: "Production",
    use_case_name: "Job Ticket Generation",
    cycle_name: "Cycle 1 — Core Workflows",
    activity_log: [
      { timestamp: "2026-03-17T10:30:00Z", type: "logged", user: "Amy Torres", text: "Defect logged during Cycle 1 testing" },
      { timestamp: "2026-03-17T11:15:00Z", type: "assigned", user: "Sarah Mitchell", text: "Assigned to James Park for investigation" },
      { timestamp: "2026-03-17T14:00:00Z", type: "comment", user: "James Park", text: "Confirmed. Root cause is the reservation API processes components sequentially and fails silently after the first. Backend fix needed." },
      { timestamp: "2026-03-18T09:00:00Z", type: "comment", user: "James Park", text: "Fix deployed to staging. Reservation now processes all components in parallel batch call." }
    ]
  },
  {
    id: did(2),
    test_case_id: tid(2, 3),
    use_case_id: uid(2),
    title: "Reserved quantity not released on job cancellation",
    severity: "High",
    status: "Open",
    description: "When a job ticket is cancelled after material reservation, the reserved substrate quantity is not released back to available inventory. This creates phantom allocations that reduce apparent stock levels.",
    steps_to_reproduce: "1. Create job ticket (material gets reserved)\n2. Cancel the job ticket\n3. Check inventory — reserved qty still held",
    expected_result: "Cancelling a job releases all reserved materials back to available stock",
    actual_result: "Reserved quantity remains allocated. Only manual inventory adjustment corrects it.",
    impact: "Inventory accuracy degrades over time. May trigger unnecessary reorders.",
    logged_by: "Amy Torres",
    assigned_to: "Lisa Chen",
    logged_at: "2026-03-17T15:45:00Z",
    resolved_at: null,
    module: "Production",
    use_case_name: "Job Ticket Generation",
    cycle_name: "Cycle 1 — Core Workflows",
    activity_log: [
      { timestamp: "2026-03-17T15:45:00Z", type: "logged", user: "Amy Torres", text: "Found during additional material reservation testing" },
      { timestamp: "2026-03-18T08:30:00Z", type: "assigned", user: "Sarah Mitchell", text: "Assigned to Lisa Chen — related to inventory module" },
    ]
  },
  {
    id: did(3),
    test_case_id: tid(1, 2),
    use_case_id: uid(1),
    title: "Rounding error on multi-component margin calculation",
    severity: "Medium",
    status: "Ready to Retest",
    description: "When an estimate has 5+ components, the total margin percentage shown in the summary differs from the sum of individual component margins by 0.1–0.3% due to floating point rounding.",
    steps_to_reproduce: "1. Create estimate with 5+ components\n2. Set different margins per component\n3. Compare total margin % vs weighted average of components",
    expected_result: "Total margin matches weighted average of component margins to 2 decimal places",
    actual_result: "Total shows 32.7% when weighted average is 32.9%",
    impact: "Minor pricing discrepancy. Could affect margin reporting accuracy.",
    logged_by: "James Park",
    assigned_to: "James Park",
    logged_at: "2026-03-14T11:00:00Z",
    resolved_at: null,
    module: "Estimating",
    use_case_name: "Estimate Creation Workflow",
    cycle_name: "Cycle 1 — Core Workflows",
    activity_log: [
      { timestamp: "2026-03-14T11:00:00Z", type: "logged", user: "James Park", text: "Noticed during multi-component estimate testing" },
      { timestamp: "2026-03-15T09:00:00Z", type: "comment", user: "James Park", text: "Fixed rounding to use Decimal.js for all currency/margin calculations" },
      { timestamp: "2026-03-15T14:00:00Z", type: "status", user: "James Park", text: "Moved to Ready to Retest" },
    ]
  },
  {
    id: did(4),
    test_case_id: tid(3, 1),
    use_case_id: uid(3),
    title: "Drag-and-drop loses job data on rapid consecutive moves",
    severity: "Low",
    status: "Resolved",
    description: "If a user rapidly drags and drops the same job to different press slots within 2 seconds, the job's metadata (colors, substrate) temporarily shows as blank on the timeline until page refresh.",
    steps_to_reproduce: "1. Drag job to Press A\n2. Immediately drag same job to Press B within 1-2 seconds\n3. Observe job card on timeline",
    expected_result: "Job metadata persists correctly through rapid reassignment",
    actual_result: "Job card shows blank metadata fields until page refresh",
    impact: "Cosmetic issue. Data is correct in database, only display is affected.",
    logged_by: "James Park",
    assigned_to: "Amy Torres",
    logged_at: "2026-03-12T16:00:00Z",
    resolved_at: "2026-03-16T10:00:00Z",
    module: "Scheduling",
    use_case_name: "Production Scheduling",
    cycle_name: "Cycle 1 — Core Workflows",
    activity_log: [
      { timestamp: "2026-03-12T16:00:00Z", type: "logged", user: "James Park", text: "Found during scheduling board testing" },
      { timestamp: "2026-03-13T10:00:00Z", type: "assigned", user: "Sarah Mitchell", text: "Assigned to Amy Torres" },
      { timestamp: "2026-03-15T11:00:00Z", type: "comment", user: "Amy Torres", text: "Added debounce to drag handler and optimistic UI update" },
      { timestamp: "2026-03-16T10:00:00Z", type: "resolved", user: "Amy Torres", text: "Verified fix in staging. Marking as resolved." },
    ]
  }
]

// Helper to compute use case status from test results
export function computeUseCaseStatus(tests) {
  if (!tests || tests.length === 0) return "Draft"
  const results = tests.map(t => t.result)
  if (results.every(r => r === "Pass")) return "Passed"
  if (results.some(r => r === "Fail")) return "Failed"
  if (results.some(r => r === "Pass") || tests.some(t => t.status === "Blocked")) return "In Progress"
  if (results.every(r => r === null || r === undefined)) return "Not Started"
  return "In Progress"
}
