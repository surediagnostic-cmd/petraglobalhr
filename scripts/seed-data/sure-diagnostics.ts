// Structured seed content transcribed from
// scripts/source/sure-diagnostics-operation-manual.txt (Sure Diagnostics
// Operation Manual v2.0, 2026). Hand-authored rather than regex-parsed at
// runtime: this runs exactly once, and the manual's tables/bullets are
// reproduced here as markdown directly rather than risking a fragile
// generic parser for a one-time import. WHO IS RESPONSIBLE / KPI /
// ESCALATION blocks are kept as separate structured fields (not repeated in
// `body`) since they map onto their own columns/tables in the schema.

export interface KpiSeed {
  name: string;
  targetDescription: string;
  targetValue: number | null;
  targetUnit: string | null;
}

export interface SectionSeed {
  number: string;
  title: string;
  subtitle: string;
  body: string;
  whoIsResponsible: string | null;
  kpis: KpiSeed[];
  escalation: string | null;
  mdOnly?: boolean;
  /** null = company-wide visibility */
  departmentName: string | null;
}

export const DEPARTMENT_NAMES = ["Laboratory", "Radiology", "Finance", "Marketing", "Operations"];

export const SECTIONS: SectionSeed[] = [
  {
    number: "01",
    title: "General Information",
    subtitle: "Attendance, discipline & daily operating rules",
    departmentName: null,
    body: `### 1.1 Attendance & Punctuality
Resumption time is 8:00 AM at all Sure Diagnostics centres. Punctuality reflects our commitment to patients and partners.

| Lateness Period | Penalty | Authority |
|---|---|---|
| Up to 10 minutes | Grace period — no penalty | — |
| 10 minutes – 1 hour | ₦500 deduction | Branch Manager |
| 1 hour – 2 hours | ₦1,000 deduction | Branch Manager |
| 2 hours – 3 hours | ₦1,500 deduction | Branch Manager |
| Over 3 hours | Full day's pay deducted | COO approval required |

Every staff member — full-time and part-time — must sign in AND sign out every working day. Failure to sign in is recorded as absenteeism, regardless of whether the staff member was physically present.

### 1.2 Closing Procedure
The last staff member on duty — supervised by the CSO/Admin Manager — is responsible for securing the facility. The following checks are mandatory before leaving:
- Confirm all lights are off except security lights.
- Confirm all sockets are switched off, EXCEPT: incubator, lab fridge, inverter, and all UPS units.
- Confirm pumping machine is off and all taps are closed.
- Put on the security lights.
- Confirm all doors and windows are locked. Drop keys with the designated key-keeper.
- The Manager must periodically verify the integrity of all facility keys.`,
    whoIsResponsible: "Branch Manager",
    kpis: [
      { name: "Zero security incidents", targetDescription: "Zero security incidents (break-ins, unauthorised entry) per month", targetValue: 0, targetUnit: "incidents/month" },
      { name: "Zero lost assets", targetDescription: "Zero lost assets per month", targetValue: 0, targetUnit: "assets/month" },
      { name: "Closing checklist completion", targetDescription: "100% closing checklist completed daily", targetValue: 100, targetUnit: "%" },
    ],
    escalation: "Branch Manager → COO → MD",
  },
  {
    number: "02",
    title: "Facility Management",
    subtitle: "Cleanliness, safety, equipment & environmental standards",
    departmentName: null,
    body: `### 2.1 Cleanliness & Appearance Standards
A clean, well-organised facility is the physical expression of our commitment to quality. The Branch Manager is fully responsible for the facility condition at all times. Cleanliness is inspected and rated daily (1 = Very Poor to 5 = Excellent) in each area:

| Area | Standard Required | Responsible |
|---|---|---|
| Compound & entrance | Swept, washed, weeded, flowered; gutters clear | Admin Manager |
| Reception | Floor washed, chairs wiped, computers cleaned, good smell | CSO / FDO |
| Laboratory | Benches clean, waste segregated, equipment covered | Head Lab Scientist |
| Scan / Radiology room | Machine covered when not in use, gel cleaned after each patient | Head Radiographer |
| X-ray room | Radiation warning sign on door, floor clean, no clutter | Head Radiographer |
| Toilets | Cleaned twice daily, pleasant smell, consumables stocked | Admin Manager |
| Generator area | No trash, no fuel cans left visible, CO detector functional | Admin Manager |

### 2.2 Equipment Management
**Power Management Rules**
- All clinical equipment (analysers, ultrasound, X-ray, digitiser) must be on UPS or inverter. If on UPS, shut down immediately when power fails, then switch to alternative source.
- Fridges and incubators must NEVER be run on a small (petrol) generator. Use PHCN or the large generator only.
- Put off all lights, TVs, AC, and non-essential equipment at close of work.
- Inverter charging socket remains ON after close. All other sockets OFF.
- AC must only be switched on when the space is sealed. Switch off before stopping the generator.
- X-ray machine must be on a voltage stabiliser of at least 10 KVA.

**Maintenance Scheduling**
- Each piece of equipment has an individual Equipment Maintenance Log, updated by the Head of Unit after every service, calibration, or repair.
- Preventive maintenance follows the manufacturer's schedule — not on breakdown. The COO approves all maintenance expenditure.
- Any equipment fault or downtime must be reported to the Branch Manager within 30 minutes of discovery.`,
    whoIsResponsible: "Branch Manager / Admin Manager",
    kpis: [
      { name: "Facility cleanliness rating", targetDescription: "Facility cleanliness rating ≥ 4.0/5.0 in all areas (weekly inspection)", targetValue: 4.0, targetUnit: "score/5" },
      { name: "Equipment downtime", targetDescription: "Zero equipment downtime due to operator error or missed maintenance", targetValue: 0, targetUnit: "incidents" },
      { name: "Maintenance log completeness", targetDescription: "Equipment maintenance log 100% up to date", targetValue: 100, targetUnit: "%" },
      { name: "Assets lost", targetDescription: "Zero assets lost or unaccounted for per month", targetValue: 0, targetUnit: "assets/month" },
    ],
    escalation: "Branch Manager → COO → MD",
  },
  {
    number: "03",
    title: "Customer Service & SurePACE",
    subtitle: "Our patient experience philosophy and service standards",
    departmentName: null,
    body: `### 3.1 The SurePACE Framework
SurePACE — Personalised Amazing Customer Experience — is the core of everything we do. Four components:

| Component | What It Means |
|---|---|
| 1. Royal Reception | Every patient welcomed warmly from the gate and at reception; made to feel Important, Welcomed, and Loved. |
| 2. Great Delivery | Services delivered accurately, promptly, professionally; patient kept informed and comfortable. |
| 3. Royal Departure | Patient leaves satisfied, appreciated, with clarity on next steps. |
| 4. Follow-Up | Every patient receives a follow-up call/WhatsApp within 24–48 hours. |

### 3.2 What We Owe Our Customers
**Accuracy** — every result must be verified and accurate; seek a second opinion when in doubt.
**Availability** — no patient waits more than 30 minutes under normal circumstances; emergencies are prioritised immediately.
**Partnership** — call all patients within 24–48 hours; call referring doctors to confirm results aided management.
**Advice** — share clinically appropriate tips; never prescribe drugs, always guide patients back to their doctors.

### 3.3 The 20 SurePACE Service Standards
- Greet every patient warmly at the gate ('Sir'/'Ma') and again at reception.
- Offer water or fruit juice within 2 minutes of arrival (no sachet water).
- Complete registration within 5 minutes of arrival.
- Give 2 sweets to every child patient.
- Check on waiting patients every 5 minutes; always explain expected wait time.
- Emergency patients are seen immediately — no waiting.
- All patients fully attended to within 30 minutes of arrival, all things being equal.
- Follow-up call within 24 hours of the visit.
- Deliver results electronically within 20 minutes of release (no extra charge).
- Home sample collection dispatched within 4 hours of booking (extra charge applies).
- WhatsApp/SMS notification when a result is ready.
- Reception and toilets always smell clean and fresh; professional décor maintained.
- Every result must be valid, accurate, and error-free before release.

### 3.4 Registration & Payment Protocol
- Confirm tests requested; if a request form exists, confirm it matches the stated reason for visiting.
- Compute price and communicate clearly before proceeding.

**PAYMENT POLICY:** Full payment (100%) is required before any service is rendered. Part-payment is NOT permitted except with written Branch Manager + COO approval, logged in the Balance Receivables Register with a mandatory repayment date.

- Register ALL patients on LabSmart LIS with all fields correctly completed. No patient may be seen without a valid LIS registration number.
- If LIS is unavailable, use the physical Book Register as backup; notify Admin Manager and COO immediately.
- Issue receipts in duplicate: one to the patient, one retained by the FDO.
- Discounts: only Branch Managers may authorise (max 5%, cumulative monthly cap ₦5,000/manager). Never after payment has been made.

**CASH POLICY:** Cash payments are NOT accepted at any centre. All payments via POS, bank transfer to approved accounts, or approved digital platforms only. Accepting cash without written MD authorisation triggers immediate disciplinary action.

### 3.5 Result Release Protocol
Every patient may choose: electronic delivery within 20 minutes (free), physical delivery to the requesting doctor within 24 hours (extra charge), or in-person collection.

CSO/FDO must check: correct patient name, age, gender, date, referring doctor details, and match against LIS before releasing any result. All results must be typed, signed, printed, and stamped on a Sure Report Sheet letterhead — handwritten results are not acceptable. A Results Diary is checked at the start of every working day; penalty for missed proactive notice: ₦1,000.`,
    whoIsResponsible: "CSO / FDO / Branch Manager",
    kpis: [
      { name: "LIS registration/billing accuracy", targetDescription: "% patients registered and billed correctly on LIS", targetValue: 100, targetUnit: "%" },
      { name: "TAT registration to release", targetDescription: "Average TAT from registration to result release within agreed service standards", targetValue: null, targetUnit: null },
      { name: "Customer satisfaction score", targetDescription: "Customer satisfaction score", targetValue: 4.0, targetUnit: "score/5" },
      { name: "Follow-up calls within 24-48h", targetDescription: "% follow-up calls made within 24–48 hours", targetValue: 100, targetUnit: "%" },
      { name: "Result errors", targetDescription: "Zero result errors or incorrect releases per month", targetValue: 0, targetUnit: "errors/month" },
    ],
    escalation: "CSO → Branch Manager → COO",
  },
  {
    number: "04",
    title: "Laboratory Operations",
    subtitle: "Sample collection, processing, quality control & result release",
    departmentName: "Laboratory",
    body: `### 4.1 Patient Reception in the Laboratory
Apply SurePACE principles: welcome warmly, confirm identity against the request/booking form and LIS record, confirm payment, inform the patient of the procedure, and maintain privacy and confidentiality at all times.

### 4.2 Sample Collection Standards
- Use the correct collection tube for each test (EDTA for FBC, SST/plain for biochemistry, citrate for coagulation, etc.).
- Label all tubes at collection: patient name, LIS number, date/time, sample type. An unlabelled tube is never processed.
- Aseptic venepuncture technique; gloves at all times.
- Document all collected samples in the Lab Record Book before transfer to processing.

**SHARPS SAFETY:** Never re-cap needles two-handed. Use the single-hand scoop method or a safety device. Dispose immediately into an approved yellow sharps bin.

### 4.3 Sharps Injury Protocol
Allow the wound to bleed slightly under running water (do NOT suck), wash thoroughly for 2 minutes, report to the Branch Manager immediately and log in the Sharps Injury Register. Baseline HIV/HBV/HCV testing is arranged within 2 hours; COO and HR Manager notified; PEP assessment referral within 24 hours.

### 4.4 Sample Rejection Criteria
| Rejection Criterion | Action Required | Who Notifies Patient |
|---|---|---|
| Unlabelled or mislabelled sample | Do not process. Log rejection. | Lab Scientist |
| Haemolysed sample (visible) | Reject. Arrange recollection. | Lab Scientist |
| Insufficient sample volume | Reject. Inform FDO for recollection. | FDO / CSO |
| Wrong container / anticoagulant | Reject. Re-collect in correct tube. | Lab Scientist |
| Clotted anticoagulated sample | Reject. Re-collect. | Lab Scientist |
| Temperature breach (cold chain) | Reject. Log incident. Re-collect. | Branch Manager |
| Sample without request form | Hold. Do not process. FDO to resolve. | FDO / CSO |

### 4.5 Quality Control (IQC) Procedure
IQC is performed at the start of every analytical session and after any reagent change, maintenance, or power interruption — no results released until IQC passes.
- Two control levels (normal, pathological) plotted on a Levey-Jennings chart.
- Apply Westgard rules: 1-3s, 2-2s, R-4s, 4-1s violations reject the run.
- On failure: repeat, check reagent/calibration; persistent failure takes the analyser offline and escalates to Hub Lab Head.

### 4.6 External Quality Assurance (EQA)
Enrolled in at least one recognised EQA/PT programme (RECMEL, UKNEQAS, or FMLS-affiliated). EQA samples processed identically to patient samples. Unsatisfactory result triggers a CAPA within 7 days.

### 4.7 Critical Values (Panic Values)
Must be communicated to the requesting clinician/patient within 30 minutes of verification, without exception.

| Parameter | Critical Low | Critical High |
|---|---|---|
| Sodium (Na+) | < 120 mmol/L | > 160 mmol/L |
| Potassium (K+) | < 2.5 mmol/L | > 6.5 mmol/L |
| Glucose (random) | < 2.2 mmol/L | > 33 mmol/L |
| Haemoglobin | < 50 g/L | > 200 g/L |
| Creatinine | — | > 1000 micromol/L |
| Platelets | < 50 x 10⁹/L | > 1000 x 10⁹/L |

Never release through normal channels — call the doctor directly, document time of call; if unreachable after 15 minutes call the patient; log everything in the Critical Results Log and flag 'CRITICAL' on LIS.

### 4.8 Result Production & Release
Produced via LabSmart LIS by the responsible scientist/technician, who is personally responsible for accuracy. Positive results reviewed by a senior colleague; pathologist review mandatory for histopathology/cytology. Typed, signed, printed on letterhead, stamped. Never discuss referred-partner results with patients directly — direct them to their doctor. Never prescribe drugs.`,
    whoIsResponsible: "Head Lab Scientist / Branch Manager",
    kpis: [
      { name: "Result accuracy", targetDescription: "100% correct results — zero result errors or incorrect releases", targetValue: 100, targetUnit: "%" },
      { name: "IQC pass rate", targetDescription: "IQC pass rate of all analytical sessions", targetValue: 98, targetUnit: "%" },
      { name: "Sample rejection rate", targetDescription: "Sample rejection rate per month", targetValue: 3, targetUnit: "% (max)" },
      { name: "Critical value communication", targetDescription: "Critical value communication within 30 minutes", targetValue: 100, targetUnit: "%" },
      { name: "Lab Record Book currency", targetDescription: "Lab Record Book 100% up to date", targetValue: 100, targetUnit: "%" },
    ],
    escalation: "Lab Scientist → Head Lab Scientist → COO → Pathologist (clinical)",
  },
  {
    number: "05",
    title: "Radiology Operations",
    subtitle: "Ultrasound, X-ray, ECG — protocols, safety & quality standards",
    departmentName: "Radiology",
    body: `### 5.1 Patient Reception in Radiology
Welcome warmly, confirm identity against booking/LIS, confirm payment, explain the procedure clearly, obtain written informed consent for invasive procedures (e.g. transvaginal scan, HSG), and maintain strict privacy with a female chaperone for sensitive examinations.

### 5.2 Ultrasound — Patient Preparation Standards
| Scan Type | Patient Preparation | Special Notes |
|---|---|---|
| Abdominal / Hepatobiliary | 4–6 hours fasting | Essential for gallbladder visualisation |
| Pelvic (transabdominal) | Full bladder — 4–6 glasses of water 1hr before | Confirm bladder fullness before scanning |
| Transvaginal (TVS) | Bladder empty | Written consent + female chaperone mandatory |
| Obstetric (1st trimester) | Full bladder or as directed | Confirm gestational age |
| Obstetric (2nd/3rd trimester) | No special preparation | Document biometry systematically |
| Thyroid / Neck / Breast | No preparation | Document symptomatic side |
| Scrotal / Testicular | No preparation | Document bilaterally |
| Musculoskeletal (MSK) | No preparation | Confirm laterality; image bilaterally |

### 5.3 Radiation Safety (X-Ray) — ALARA Principle
RADIATION SAFETY IS A LEGAL REQUIREMENT UNDER NAEC GUIDELINES. Violations expose staff and the business to criminal liability.
- Only the patient and one lead-apron-wearing helper may be in the room during exposure.
- Pregnant staff must not operate X-ray equipment or remain in the room during exposure; declare pregnancy to the Branch Manager immediately.
- All radiology staff wear a personal dosimeter badge at all times, read monthly.
- Warning signage on the door; door closed and latched during exposures.

### 5.4 Teleradiology Workflow
All X-ray/ECG reporting is transmitted via the approved encrypted teleradiology channel — never personal WhatsApp. Log every transmission in the Teleradiology Dispatch Register. TAT: Routine ≤ 12 hours, Urgent ≤ 2 hours. Physical films retained 7 years.

### 5.5 Image Quality & Reject/Repeat Analysis
Every rejected/repeated image logged in the Image Reject Register. Monthly reject rate target < 5%, reviewed at the Clinical Meeting.

### 5.6 Result Production & Release (Radiology)
Produced via LabSmart LIS. ECG reported by the contracted cardiologist; X-ray by the contracted radiologist — never released on the radiographer's assessment alone. Typed, signed, printed on letterhead, stamped.`,
    whoIsResponsible: "Head Radiographer / Branch Manager",
    kpis: [
      { name: "Report TAT compliance", targetDescription: "Radiologist/cardiologist report TAT compliance", targetValue: 95, targetUnit: "%" },
      { name: "X-ray reject rate", targetDescription: "X-ray image reject rate per month", targetValue: 5, targetUnit: "% (max)" },
      { name: "Dosimeter badge compliance", targetDescription: "100% of radiology staff badged and readings recorded monthly", targetValue: 100, targetUnit: "%" },
      { name: "Consent documentation", targetDescription: "100% of TVS/invasive procedures documented with written consent", targetValue: 100, targetUnit: "%" },
      { name: "Radiation safety incidents", targetDescription: "Zero radiation safety incidents per quarter", targetValue: 0, targetUnit: "incidents/quarter" },
    ],
    escalation: "Radiographer → Head Radiographer → COO → Radiologist (clinical)",
  },
  {
    number: "06",
    title: "Hub-Spoke Logistics & Sample Transport",
    subtitle: "Chain of custody, cold chain, TAT standards & inter-site operations",
    departmentName: null,
    body: `### 6.1 Network Architecture
Hub-and-spoke model: the Hub (Ilasa) performs complex, capital-intensive testing and houses specialist consultants. Spokes (Palm Avenue, OAuth, future sites) handle registration, billing, sample collection, and point-of-care testing, with results distributed to patients and referring doctors.

### 6.2 TAT Standards by Sample Category
| Sample / Test Type | Collection to Dispatch | Spoke to Hub | Result to Patient |
|---|---|---|---|
| Haematology (FBC) | ≤ 30 min | Same-day run | 4–6 hours |
| Biochemistry (LFT, RFT, FBS) | ≤ 45 min | Same-day run | 4–6 hours |
| Hormones / Immunoassay | ≤ 1 hour | Same/next-day | 24 hours |
| Microbiology (culture) | ≤ 2 hours | Same-day dispatch | 48–72 hours |
| Histopathology / Biopsy | Fixed per protocol | Same-day dispatch | 5–7 working days |
| Cytology (FNAC/PAP) | Fixed per protocol | Same-day dispatch | 3–5 working days |

### 6.3 Chain of Custody Protocol
Every sample leaving a spoke is documented on a Sample Transfer Form (STF): patient, LIS number, tests, sample type, collection time, temperature. Cold chain samples in pre-chilled cool boxes (2–8°C) or dry ice. Dispatch rider signs the Spoke Dispatch Register; receiving scientist signs the Hub Receipt Register. Rejected samples logged and originating spoke notified within 30 minutes, with free recollection within 2 hours where clinically possible.

### 6.4 Cold Chain Requirements
| Sample / Test | Storage Temp | Transport Temp | Max Time in Transit |
|---|---|---|---|
| Whole blood (FBC) | Room temp | Room temp | 4 hours |
| Serum (biochemistry) | 2–8°C | Cool box 2–8°C | 8 hours |
| Hormones / EIA | 2–8°C | Cool box 2–8°C | 24 hours |
| Urine (M/C/S) | 2–8°C | Cool box 2–8°C | 4 hours |
| Histology (formalin-fixed) | Room temp | Sealed and labelled | 48 hours |
| Molecular / PCR tests | -20°C | Dry ice | 24 hours |`,
    whoIsResponsible: "Hub Lab Head / Branch Manager",
    kpis: [
      { name: "TAT compliance for transport", targetDescription: "% of samples transported within TAT standard", targetValue: 95, targetUnit: "%" },
      { name: "Hub rejection rate (transit)", targetDescription: "Sample rejection rate at Hub for transit-related reasons", targetValue: 2, targetUnit: "% (max)" },
      { name: "Cold chain breaches", targetDescription: "Cold chain temperature breach incidents per month", targetValue: 0, targetUnit: "incidents/month" },
      { name: "Chain-of-custody completeness", targetDescription: "100% of inter-site transfers with completed chain-of-custody documentation", targetValue: 100, targetUnit: "%" },
    ],
    escalation: "Spoke Manager → Hub Lab Head → COO → MD",
  },
  {
    number: "07",
    title: "Quality Management System (QMS)",
    subtitle: "Non-conformance, CAPA, audits & continuous improvement",
    departmentName: null,
    body: `### 7.1 QMS Philosophy
Quality is not an audit function — it is the way we work. Every staff member is a quality officer.

### 7.2 Non-Conformance & CAPA System
| NC Classification | Definition | Response Time |
|---|---|---|
| Minor | Single procedural deviation with no patient impact | Correct within 7 days |
| Major | Systemic failure or repeated procedural deviation | CAPA within 14 days |
| Critical | Patient safety risk or near-miss | Immediate escalation; CAPA within 48 hours |

CAPA process: NC identified → NCR completed within 24 hours → Branch Manager classifies → root cause analysis (5-Why for Minor; fishbone for Major/Critical) → corrective action with owner/resources/deadline → implemented and verified → NCR closed only after effectiveness confirmed.

### 7.3 Audit Schedule
| Audit Type | Frequency | Conducted By | Output |
|---|---|---|---|
| Facility cleanliness & safety | Weekly | Branch Manager | Facility Audit Score (1–5) |
| Lab QC records review | Monthly | Hub Lab Head | QC Compliance Report |
| Sample rejection rate review | Monthly | Hub Lab Head | Rejection Rate Report |
| Finance & cash controls | Monthly | COO / Finance Manager | Finance Audit Report |
| Inventory accuracy check | Monthly | Admin Manager | Inventory Variance Report |
| Full branch QMS audit | Quarterly | COO + External Reviewer | Branch QMS Scorecard |
| Network-wide QMS audit | Annually | External Auditor | Annual QMS Report |`,
    whoIsResponsible: "Hub Lab Head / COO (QMS Custodians)",
    kpis: [
      { name: "IQC pass rate", targetDescription: "IQC pass rate of all analytical runs", targetValue: 98, targetUnit: "%" },
      { name: "EQA performance score", targetDescription: "EQA performance score on all enrolled schemes", targetValue: 85, targetUnit: "%" },
      { name: "Sample rejection rate", targetDescription: "Sample rejection rate per month per site", targetValue: 3, targetUnit: "% (max)" },
      { name: "NCR timeliness", targetDescription: "100% of NCRs submitted within 24 hours of incident", targetValue: 100, targetUnit: "%" },
      { name: "CAPA closure", targetDescription: "CAPA closure within agreed deadline", targetValue: 100, targetUnit: "%" },
    ],
    escalation: "Lab Scientist → Hub Lab Head → COO → MD",
  },
  {
    number: "08",
    title: "Account & Finance Management",
    subtitle: "Daily controls, approval matrix, P&L reporting & HMO billing",
    departmentName: "Finance",
    body: `### 8.1 Payment Policy (Definitive)
Cash payments are NOT accepted at any centre. All payments via POS, bank transfer to approved accounts, or approved digital platforms only.

Approved bank accounts:
- Ilasa Branch: Access Bank — 0056564616 — Sure Diagnostic Health Service
- Palm Avenue Branch: Access Bank — 0059514462 — Sure Diagnostic Health Service
- Sure OAuth Branch: KUDA Bank — 3000091948 — Sure Diagnostic Health Service

### 8.2 Financial Approval Authority Matrix
| Transaction Type | Admin Manager | Branch Manager | COO | MD |
|---|---|---|---|---|
| Petty cash disbursement | ≤ ₦5,000 | ≤ ₦20,000 | ≤ ₦50,000 | Any amount |
| Vendor purchase / PO | Recommend only | ≤ ₦50,000 | ≤ ₦200,000 | > ₦200,000 |
| Discount approval | Not authorised | Max 5% / ₦5k pm | Up to 15% | Any |
| Refund authorisation | Not authorised | Recommend to COO | ≤ ₦50,000 | Any amount |
| Staff salary advance | Not authorised | Not authorised | ≤ 50% monthly salary | Any |
| Capital expenditure | Not authorised | Not authorised | Not authorised | All capex |
| HMO credit extension | Not authorised | Not authorised | ≤ 30 days | > 30 days |

### 8.3 Daily Financial Controls
Opening reconciliation: confirm POS terminal, print overnight settlement, pull LIS daily summary, flag variances to COO immediately.
Closing reconciliation: FDO/CSO compiles the Daily Cash and Transfer Report (DCTR); Admin Manager verifies against LIS and signs off; submitted to Finance Manager and COO by 9:00 PM. Variances ≥ ₦1,000 require a written explanation.

### 8.4 Branch Profit & Loss Reporting
Each branch submits a monthly Branch P&L by the 3rd working day of the following month, consolidated by the Finance Manager into company-wide management accounts. Line items span OOP/HMO/Corporate revenue, reagent costs, staff costs, utilities, maintenance, outsourced tests, marketing commissions, admin overheads, down to EBITDA.

### 8.5 HMO & Insurance Billing
By the 25th of each month, HMO encounters are compiled and invoices generated in Zoho Books, submitted by the last working day. HMO Receivables Tracker maintained; unpaid after 30 days triggers follow-up, after 60 days escalates to COO. Denied claims logged within 48 hours and categorised; corrections resubmitted within 7 working days; valid disputes escalated in writing within 14 days.

### 8.6 Anti-Fraud Controls
Ghost Patient Prevention (every patient must have a valid LIS number; monthly audit vs receipts), Discount Abuse Prevention (monthly discount register to COO), Refund Controls (bank transfer only, dual sign-off), Vendor Payment Controls (requisition/approval/receipt functions always separated; two vendor quotes above ₦10,000).

### 8.7 Procurement Process
HOU/Admin Manager verifies need, negotiates with ≥2 vendors, submits a formal Requisition with the final invoice to MD/COO; response within 24–48 hours; on approval AM oversees delivery/payment; goods verified by HOU and Finance/Audit before payment; all transactions recorded in Zoho Books immediately.`,
    whoIsResponsible: "Finance Manager / COO",
    kpis: [
      { name: "Daily reconciliation completion", targetDescription: "Daily reconciliation completed on 100% of working days", targetValue: 100, targetUnit: "%" },
      { name: "HMO invoice timeliness", targetDescription: "HMO invoices submitted by last working day of month", targetValue: 100, targetUnit: "%" },
      { name: "HMO receivables aging", targetDescription: "HMO receivables outstanding > 60 days as % of total HMO revenue", targetValue: 10, targetUnit: "% (max)" },
      { name: "Branch P&L timeliness", targetDescription: "Branch P&L submitted by 3rd working day of new month", targetValue: 100, targetUnit: "%" },
      { name: "Finance audit variances", targetDescription: "Zero material finance variances in monthly audit", targetValue: 0, targetUnit: "variances" },
    ],
    escalation: "Finance Manager → COO → MD",
  },
  {
    number: "09",
    title: "Regulatory Compliance & Governance",
    subtitle: "MLSCN, NAFDAC, NDPR, IPC, radiation safety & waste management",
    departmentName: null,
    body: `### 9.1 Regulatory Overview
| Regulator | Scope | Key Obligation | Renewal |
|---|---|---|---|
| MLSCN | Medical Lab Science Council of Nigeria | Annual facility and practitioner licences | Annual (Jan) |
| NAFDAC | Food & Drug Administration | Approval for imported reagents and consumables | Per importation |
| FMOH / State MoH | Ministry of Health | Facility registration and renewal | Every 2–3 years |
| NITDA / NDPR | Nigeria Data Protection Regulation | Patient data protection, consent, storage | Ongoing |
| NAEC | Nigeria Atomic Energy Commission | Radiation safety compliance for X-ray | Ongoing |
| NESREA | Environmental Standards & Regulations | Medical waste segregation and certified disposal | Ongoing |

### 9.2 MLSCN Licence Management
COO maintains a Licence Tracker; renewal begins 90 days before expiry. Any scientist/technician whose licence lapses is stood down from bench work immediately. Facility licence displayed at reception.

### 9.3 Patient Data Protection (NDPR)
Patient data is protected health information under NDPR 2019 — breach is a criminal offence. Records may not be shared without written patient consent except to the requesting clinician. LIS access is password-protected and role-limited; passwords never shared. Paper records in locked cabinets; records over 7 years disposed via certified destruction only. Suspected breaches reported to the COO within 24 hours. Login credentials for all platforms are stored in the approved password manager — never written in this manual, WhatsApp, or unsecured documents.

### 9.4 Infection Prevention & Control (IPC)
All clinical staff complete IPC training on hire and annually. Standard precautions apply to ALL patients, ALL the time: hand hygiene before/after every contact, PPE (gloves, lab coat, mask, eye protection as risk requires), single-hand-scoop sharps disposal, immediate spill cleanup with 1% sodium hypochlorite.

**Medical Waste Segregation**
| Waste Category | Examples | Container | Disposal Method |
|---|---|---|---|
| Sharps | Needles, lancets, broken glass | Yellow rigid sharps bin | Certified sharps disposal company |
| Infectious / Pathological | Blood-soaked materials, specimens | Yellow biohazard bag | Autoclave then certified disposal |
| Pharmaceutical / Chemical | Expired reagents, fixatives | Brown container | Certified chemical disposal company |
| General / Non-clinical | Paper, packaging | Black bag | Municipal waste collection |

### 9.5 Fire Safety & Emergency Procedures
At least two working fire extinguishers per centre with current inspection tags; annual servicing. Evacuation routes clearly marked; new staff shown routes on day one. Drills twice yearly, documented. Emergency numbers posted at every workstation.`,
    whoIsResponsible: "COO (Compliance Owner) / Branch Manager (Site Compliance Officer)",
    kpis: [
      { name: "MLSCN licence renewal timeliness", targetDescription: "MLSCN licence renewal completed 90 days before expiry", targetValue: 100, targetUnit: "%" },
      { name: "IPC training completion", targetDescription: "IPC training completion for all clinical staff, annually", targetValue: 100, targetUnit: "%" },
      { name: "Waste disposal record completeness", targetDescription: "Medical waste disposal records complete and current", targetValue: 100, targetUnit: "%" },
      { name: "NDPR breach incidents", targetDescription: "NDPR data breach incidents per year", targetValue: 0, targetUnit: "incidents/year" },
      { name: "Fire safety drills", targetDescription: "Fire safety drill completed on schedule", targetValue: 2, targetUnit: "per site/year" },
    ],
    escalation: "Branch Manager → COO → MD → Regulatory Body (if applicable)",
  },
  {
    number: "10",
    title: "Inventory Management — SD-IMS",
    subtitle: "Reagent control, stock levels, FEFO, expiry management",
    departmentName: "Operations",
    body: `### 10.1 System Overview
SD-IMS is the official platform for all reagent and consumable inventory. All movements — receipt, allocation, auto-depletion via LabSmart LIS exports, reorder triggers — are managed within SD-IMS. Parallel manual tracking is not permitted.

### 10.2 Stock Level Framework
| Stock Level | Definition | Trigger Action | Responsible |
|---|---|---|---|
| Maximum Stock | 2 months supply at average run rate | Do not reorder | — |
| Reorder Point (ROP) | 3–4 weeks supply remaining | Raise Purchase Requisition in SD-IMS | Admin Manager |
| Minimum (Safety) Stock | 1 week supply remaining | Urgent reorder + escalate to COO | Branch Manager |
| Critical Stock Alert | < 3 days supply remaining | Emergency procurement + consider test suspension | COO / MD |

Reorder requests must be raised at the Reorder Point — never wait until Minimum Stock.

### 10.3 Stock Receipt & Storage Protocol
Admin Manager and Head of Unit jointly verify against the PO (item, quantity, batch, expiry, condition). Discrepancies noted on the GRN and reported to the supplier — payment withheld until resolved. New stock entered into SD-IMS with SKU/batch/expiry. Apply FEFO (First Expiry, First Out). Cold-chain reagents refrigerated within 30 minutes of receipt, with temperature logged.

### 10.4 Expiry Management
SD-IMS generates a monthly Expiry Alert Report (items expiring within 60 days), reviewed by the 5th of each month. Items within 30 days of expiry with excess stock trigger a vendor return or inter-branch transfer. Expired items quarantined in a 'DO NOT USE' zone and disposed of within 7 days, documented on the Waste Disposal Record.

### 10.5 Monthly Inventory Reconciliation
Physical count on the last working day of each month, reconciled against SD-IMS. Variance > 5% for any line item requires a written explanation within 2 working days; two consecutive unexplained variances trigger a formal COO investigation. Results feed directly into the Branch P&L as reagent cost of goods sold.`,
    whoIsResponsible: "Admin Manager / Head of Unit",
    kpis: [
      { name: "Stockout incidents", targetDescription: "Stockout incidents per month — no test suspended due to stock failure", targetValue: 0, targetUnit: "incidents/month" },
      { name: "Expired stock write-off", targetDescription: "Expired stock write-off value as % of monthly reagent spend", targetValue: 2, targetUnit: "% (max)" },
      { name: "Inventory reconciliation variance", targetDescription: "Monthly inventory reconciliation variance overall", targetValue: 3, targetUnit: "% (max)" },
      { name: "Requisitions raised at ROP", targetDescription: "Purchase Requisitions raised at ROP or above (never at Minimum Stock)", targetValue: 100, targetUnit: "%" },
    ],
    escalation: "Admin Manager → COO → MD",
  },
  {
    number: "11",
    title: "Sales & Marketing Management",
    subtitle: "Partner management, corporate sales, HMO acquisition & digital marketing",
    departmentName: "Marketing",
    body: `### 11.1 Partner (Referral Doctor) Management
Onboarding: complete the Sure Partners Form, add to WhatsApp/Telegram groups, brief on service menu/TAT/referral process. Engagement cadence: weekly visits/calls, follow-up within 48–72 hours of a referred visit, birthday/anniversary acknowledgements, festive gifts, quarterly Partners Webinar.

**Partner Rebate Structure**
| Partner Tier | Monthly Referral Revenue | Rebate Rate |
|---|---|---|
| Standard Partner | Up to ₦150,000/month | 20% of confirmed referral revenue |
| Premium Partner | > ₦150,000/month | 25–30% (negotiated with COO approval) |

### 11.2 Corporate Account Acquisition
4-stage process: Prospecting (map targets by proximity + headcount ≥20; priority sectors banking/manufacturing/FMCG/education/logistics/oil&gas) → Proposal & Negotiation (COO sign-off on pricing; MD approval for discounts beyond standard) → Contract & Onboarding (signed Corporate Service Agreement mandatory, no verbal agreements) → Account Management (monthly service report, quarterly check-in, annual repricing review).

### 11.3 HMO Panel Acquisition
Identify target HMOs (AIICO, Leadway Health, Avon HMO, Hygeia, Reliance HMO). Submit Panel Application Package (licences, registration, capacity, test menu, pricing). Negotiate rates above the PriceIQ price floor; COO approval required. Obtain Provider Code and pre-authorisation process before go-live; brief FDO/CSO team.

### 11.4 Occupational Health Packages
| Package | Included Tests | Target Sector |
|---|---|---|
| Basic Pre-Employment | FBC, FBS, U&E, LFT, HBsAg, HIV screen, Chest X-ray, Urinalysis | SMEs, logistics companies |
| Enhanced Pre-Employment | All Basic + ECG, Sickle cell screen, Malaria screen, BMI, vision test | Banks, manufacturing, oil & gas |
| Food Handler Annual | HBsAg, VDRL, Typhoid, Stool M/C/S, Chest X-ray, Urinalysis | Restaurants, schools, food companies |
| Executive Health Check | Full biochemical panel + cardiac markers + abdominal ultrasound + ECG + PSA/PAP | Senior management, C-suite |

### 11.5 Marketing Campaigns & Events
4 street/house-to-house campaigns/month; 1 antenatal group presentation, 1 association, 1 church/mosque, 1 market per month; quarterly Healthcare Partners Forum; ≥2 radio appearances/year; ≥1 doctors' forum presentation/year.

### 11.6 Digital Marketing Standards
≥2 posts/day across all platforms; ≥4 articles/month; ≥3 video pieces/quarter; ≥1 online health event/month; monthly happy-new-month broadcast from the CEO.

### 11.7 Marketing Reporting
Daily report (by 9:00 AM next day): leads, active partners, samples picked, revenue. Weekly report cumulative. Monthly report (by 2nd working day): full commercial performance vs. targets, new partnerships, campaign outcomes.`,
    whoIsResponsible: "Marketing Manager / COO",
    kpis: [
      { name: "Active corporate accounts", targetDescription: "Number of active corporate accounts, growing monthly", targetValue: null, targetUnit: null },
      { name: "Active HMO panels", targetDescription: "Number of active HMO panels (minimum 3 major HMOs per site)", targetValue: 3, targetUnit: "panels (min)" },
      { name: "Corporate/HMO revenue share", targetDescription: "Corporate and HMO revenue as % of total", targetValue: 30, targetUnit: "% (min)" },
      { name: "Corporate invoice collection", targetDescription: "Corporate invoice collection within 30 days", targetValue: 85, targetUnit: "%" },
      { name: "New corporate accounts", targetDescription: "New corporate accounts signed per quarter (minimum 2 per site)", targetValue: 2, targetUnit: "accounts/quarter (min)" },
    ],
    escalation: "Marketing Manager → COO → MD",
  },
  {
    number: "12",
    title: "Human Resources Management",
    subtitle: "Recruitment, onboarding, scheduling, appraisal & staff development",
    departmentName: null,
    body: `### 12.1 Staff Documentation
ALL STAFF must complete employment documentation within 2 weeks of resumption. Salary is withheld until documentation is complete.

### 12.2 Duty Scheduling
Heads of Unit submit preferred schedules to the Admin/Operations Manager by the last Saturday of the current month; Admin Manager reviews and approves before circulation. Every shift must include the required skill sets for the unit. Shift changes require Admin Manager approval in advance.

### 12.3 Staff Training & Development
All staff are responsible for their own professional development, including mandatory induction/training events, pep talks, and clinical/general meetings. Every staff member completes a minimum of 5–8 hours of verified training per month (online or offline) — assessed against this standard in monthly appraisal. The Sure Greatness University platform is available for ongoing learning; all staff must be enrolled.

### 12.4 Performance Appraisal
Every staff member is formally appraised quarterly and annually. Before any appraisal can be conducted, the following must be on file:
- Employment letter on file
- Signed key job description / outcomes document
- Signed acknowledgement of the Sure Operation Manual
- Signed acknowledgement of the Staff Handbook
- Relevant tools and templates issued
- Sure Staff ID Card issued

Appraisal results are released at the Staff General Meeting. Staff scoring above 69.9% are recognised and rewarded. The highest-scoring staff member becomes Staff of the Month. Performance-based promotion is the only basis for advancement.

### 12.5 Staff Recognition
- **Staff of the Month** — highest appraisal score, announced at the Staff General Meeting.
- **Sure Inspiration Award** — greatest positive impact on patients, colleagues, and the organisation.
- **MD's Award** — at the MD's discretion for exceptional performance/contribution.
- **Annual Staff of the Year** — best cumulative appraisal performance, at the Annual Family Get-Together.

### 12.6 Meetings Schedule
| Meeting | Frequency | Time | Focus |
|---|---|---|---|
| Pep Talk | Every Monday | 8:00–8:20 AM | Team energy, weekly priorities, recognition |
| Ops / Marketing Management | Weekly | As scheduled | Commercial and operational review |
| Clinical Meeting | Monthly | As scheduled | QC results, EQA, TAT, case review, CAPA |
| Staff General Meeting | Monthly | 4:00 PM, Ilasa | Reports, recognition, appraisal results, AOB |
| Head of Unit (HOU) Meeting | Monthly | As scheduled | Operational coordination across units |
| Annual Family Get-Together | Annually | As announced | Staff of the Year, team celebration |`,
    whoIsResponsible: "HR Manager / Operations Manager",
    kpis: [
      { name: "Documentation completion", targetDescription: "Staff documentation completion within 2 weeks of resumption", targetValue: 100, targetUnit: "%" },
      { name: "Monthly training hours", targetDescription: "Monthly training hours per staff member", targetValue: 5, targetUnit: "hrs/month (min, up to 8)" },
      { name: "Appraisal completion rate", targetDescription: "Quarterly appraisal completion rate of eligible staff", targetValue: 100, targetUnit: "%" },
      { name: "Staff satisfaction score", targetDescription: "Staff satisfaction score, assessed at general meeting", targetValue: 4.0, targetUnit: "score/5" },
      { name: "Staff turnover rate", targetDescription: "Staff turnover rate, monitored and reviewed quarterly", targetValue: null, targetUnit: "%" },
    ],
    escalation: "Branch Manager → HR Manager → COO → MD",
  },
  {
    number: "13",
    title: "Sure Career Path",
    subtitle: "Qualifications, grade levels & compensation across all functions",
    departmentName: null,
    body: `### 13.1 Career Architecture
The Sure Career Path provides a clear progression route for every staff member across all functional areas. Promotion is strictly performance-based and must be supported by the relevant qualifications for the target grade. See the Directory and your Designation record for your current grade; full ladders for each track (Pathology & Laboratory, Radiology, Finance, Marketing, Operations & Administration) are seeded as Designations with their qualification/pay data attached.`,
    whoIsResponsible: null,
    kpis: [],
    escalation: null,
  },
  {
    number: "14",
    title: "CEO Command Centre & Executive Operating Rhythm",
    subtitle: "Dashboard architecture, KPI governance & strategic meeting cadence",
    departmentName: null,
    mdOnly: true,
    body: `### 14.1 Management Philosophy
The MD/COO of a multi-site diagnostic network cannot manage by walking around. They must manage by data — real-time intelligence on every branch's financial performance, clinical quality, commercial momentum, and operational health, from any location, at any time.

### 14.2 Weekly Performance Dashboard
Generated every Monday by 10:00 AM from LabSmart LIS export data.
| Dashboard Panel | Metrics | Alert Threshold |
|---|---|---|
| Revenue | Total weekly revenue by branch and channel (OOP/HMO/Corporate) | < 80% of weekly target |
| Patient Volume | Total patients seen per branch, tests by category | < 75% of weekly target |
| TAT Compliance | % results released within TAT standard by branch | < 90% compliance |
| Quality (QC) | IQC pass/fail by branch, rejection rate, EQA status | Any IQC failure |
| Referral Activity | New partners, active referrers, referral revenue | Active referrers declining MoM |
| Stock Alerts | Items at/below Reorder Point, expiry alerts | Any item at Minimum Stock |
| Equipment Status | Downtime incidents, maintenance adherence | Any unplanned downtime > 4 hours |

### 14.3 Monthly Performance Dashboard
Generated by the 5th working day of each month: Branch P&L/EBITDA, revenue trend, test profitability (from PriceIQ), HMO receivables aging, corporate account growth, referrer league table, staff headcount/absenteeism/appraisal status, QMS scorecard, inventory spend/write-off/stockouts.

### 14.4 Executive Operating Rhythm
| Meeting | Frequency | Chaired By | Purpose & Output |
|---|---|---|---|
| Operations Huddle | Daily 8:10 AM | Branch Manager | Yesterday's revenue, today's schedule, blockers (max 10 min) |
| Marketing & Sales Review | Weekly (Monday) | Marketing Manager | Referrer activity, leads, campaigns, revenue vs target |
| Branch Manager Sync | Weekly (Wednesday) | COO | Operational issues, stock, staffing, quality flags |
| Clinical Meeting | Monthly | Hub Lab Head / Chief Radiographer | QC results, EQA, NCRs, TAT analysis, critical value incidents |
| Full Branch Review | Monthly | MD / COO | Branch P&L, appraisal results, monthly dashboard, strategy |
| Board / Strategy Review | Quarterly | MD | Expansion decisions, financial performance, competitive landscape |

### 14.5 Network KPI Scorecard
| KPI | Target | Owner | Review Freq. | Missed x2 = Action |
|---|---|---|---|---|
| Monthly revenue vs. target | ≥ 95% | Branch Manager | Monthly | Formal performance review |
| Patient volume vs. target | ≥ 90% | Branch Manager | Monthly | Marketing intervention plan |
| HMO collection rate | ≥ 85% in 30 days | Finance Manager | Monthly | HMO relationship escalation |
| IQC pass rate | ≥ 98% | Lab Head | Monthly | QMS investigation + CAPA |
| TAT compliance | ≥ 95% | Lab/Rad Head | Weekly | Process review + retraining |
| Staff absenteeism | < 5%/month | HR / Branch Mgr | Monthly | HR intervention |
| Stockout incidents | 0/month | Admin Manager | Monthly | Procurement process review |
| Customer satisfaction | ≥ 4.0/5.0 | Branch Manager | Monthly | SurePACE retraining |
| New referrers added | ≥ 2/site/month | Marketing Manager | Monthly | Sales team review |`,
    whoIsResponsible: "MD / COO",
    kpis: [],
    escalation: null,
  },
  {
    number: "15",
    title: "The Sure PERFECT Professional",
    subtitle: "Our people standards and the culture we are building",
    departmentName: null,
    body: `### 15.1 The PERFECT Framework
| Letter | Standard | What This Means at Sure |
|---|---|---|
| P | Prompt & Professional | On time, properly dressed, reliable in all commitments |
| E | Excellent | Above-average performance in every interaction and output |
| R | Reliable | Consistent delivery — patients and partners can count on you |
| F | Friendly & Empathic | Warm, human, and genuinely caring in every interaction |
| E | Expert & Competent | Technically skilled and continuously improving |
| C | Committed & Courageous | Dedicated to Sure's mission; willing to raise issues and own outcomes |
| T | Truthful & Trustworthy | 100% integrity in all dealings with patients, partners, and colleagues |

### 15.2 The Owners Mentality
Every Sure Diagnostics team member operates with an Owners Mentality: caring about the centre as if you own it, noticing what needs fixing before being told, protecting company resources as your own, going the extra mile, and being proud of what we're building. This includes: reporting facility issues proactively, treating every patient like family, contributing innovative ideas, holding yourself and colleagues to this manual's standards because you believe in them, and taking personal responsibility for your results and growth.`,
    whoIsResponsible: null,
    kpis: [],
    escalation: null,
  },
];

export interface DesignationSeed {
  title: string;
  departmentName: string;
  careerTrack: "lab" | "radiology" | "finance" | "marketing" | "operations";
  minQualification: string;
  keyFocus: string;
  basePay?: string;
}

export const DESIGNATIONS: DesignationSeed[] = [
  // 13.2 Pathology & Laboratory Track
  { title: "Lab Assistant", departmentName: "Laboratory", careerTrack: "lab", minQualification: "Relevant certificate, no experience required", keyFocus: "Sample handling, basic admin, cleaning and organisation" },
  { title: "Lab Technician", departmentName: "Laboratory", careerTrack: "lab", minQualification: "ND Lab Technology, < 1 year experience", keyFocus: "Sample collection, basic test processing, equipment care" },
  { title: "Senior Lab Technician", departmentName: "Laboratory", careerTrack: "lab", minQualification: "ND Lab Technology, 3+ years experience", keyFocus: "All technician duties + junior staff supervision" },
  { title: "Lab Scientist", departmentName: "Laboratory", careerTrack: "lab", minQualification: "BSc Medical Lab Science, MLSCN registered, NYSC", keyFocus: "Full test processing, QC, result validation and release" },
  { title: "Senior Lab Scientist", departmentName: "Laboratory", careerTrack: "lab", minQualification: "BSc MLS, MLSCN registered, 4+ years post-qualification", keyFocus: "All scientist duties + IQC oversight, EQA coordination" },
  { title: "Chief Lab Scientist", departmentName: "Laboratory", careerTrack: "lab", minQualification: "BSc MLS, 7+ years, management experience", keyFocus: "Full unit management, QMS ownership, staff development" },
  { title: "Consultant Pathologist", departmentName: "Laboratory", careerTrack: "lab", minQualification: "FMCP (Lab Medicine) or equivalent, licensed", keyFocus: "Specialist reporting, QMS governance, referral management" },

  // 13.3 Radiology Track
  { title: "Asst X-ray Technician", departmentName: "Radiology", careerTrack: "radiology", minQualification: "ND Radiography, < 1 year", keyFocus: "Patient positioning, basic X-ray under supervision" },
  { title: "X-ray Technician", departmentName: "Radiology", careerTrack: "radiology", minQualification: "ND Radiography, 2+ years", keyFocus: "Independent X-ray, basic image quality review" },
  { title: "Senior X-ray Technician", departmentName: "Radiology", careerTrack: "radiology", minQualification: "ND Radiography, 5+ years", keyFocus: "X-ray + supervision of junior technicians" },
  { title: "Radiographer / Sonographer", departmentName: "Radiology", careerTrack: "radiology", minQualification: "BSc Radiography, valid RRBN licence, 1+ year", keyFocus: "Full radiographic and sonographic examinations" },
  { title: "Senior Radiographer", departmentName: "Radiology", careerTrack: "radiology", minQualification: "BSc + PGD Sonography, 4+ years post-qualification, NYSC", keyFocus: "All modalities + quality oversight + report review" },
  { title: "Chief Radiographer", departmentName: "Radiology", careerTrack: "radiology", minQualification: "BSc + PGD Sonography, 7+ years, management", keyFocus: "Full radiology unit management, teleradiology coordination" },
  { title: "Consultant Radiologist", departmentName: "Radiology", careerTrack: "radiology", minQualification: "4-year radiology residency, specialty fellowship, licensed", keyFocus: "Specialist reporting, teleradiology QA, case consultation" },

  // 13.4 Finance Track
  { title: "Accounting Assistant", departmentName: "Finance", careerTrack: "finance", minQualification: "ND / HND Accounting, 1 year", keyFocus: "Bookkeeping, receipt filing, daily reports" },
  { title: "Accounting Officer", departmentName: "Finance", careerTrack: "finance", minQualification: "HND / BSc Accounting, 2 years", keyFocus: "Zoho Books entry, vendor payments, bank reconciliation" },
  { title: "Senior Accounting Officer", departmentName: "Finance", careerTrack: "finance", minQualification: "HND / BSc Accounting, 2+ years", keyFocus: "All officer duties + payroll support, P&L drafting" },
  { title: "Asst Finance Manager", departmentName: "Finance", careerTrack: "finance", minQualification: "BSc Accounting, 2–4 years, ICAN / ACA", keyFocus: "Branch P&L, HMO billing, management accounts" },
  { title: "Finance Manager", departmentName: "Finance", careerTrack: "finance", minQualification: "BSc Accounting, 6–8 years, ICAN / ACA", keyFocus: "Full financial management, audit oversight, budgeting" },
  { title: "CFO / VP Finance", departmentName: "Finance", careerTrack: "finance", minQualification: "BSc Accounting, 10+ years, ICAN / ACA, Masters preferred", keyFocus: "CFO-level governance, investor reporting, treasury" },

  // 13.5 Marketing Track
  { title: "Marketing Assistant", departmentName: "Marketing", careerTrack: "marketing", minQualification: "—", keyFocus: "Target: ₦750,000 referral revenue/month", basePay: "1% partner, 10% corporate, ₦15,000 basic, ₦1,000 BTA/week" },
  { title: "Marketing Officer", departmentName: "Marketing", careerTrack: "marketing", minQualification: "—", keyFocus: "Target: ₦1,000,000/month", basePay: "1% partner, 10% corporate, ₦20,000 basic, ₦1,000 BTA/week" },
  { title: "Senior Marketing Officer", departmentName: "Marketing", careerTrack: "marketing", minQualification: "—", keyFocus: "Target: ₦2,000,000/month", basePay: "2% partner, 12.5% corporate, ₦25,000 basic, ₦1,500 BTA/week" },
  { title: "Asst Marketing Manager", departmentName: "Marketing", careerTrack: "marketing", minQualification: "—", keyFocus: "Target: ₦2,500,000/month", basePay: "3% partner, 15% corporate, ₦40,000 basic, ₦2,000 BTA/week" },
  { title: "Marketing Manager", departmentName: "Marketing", careerTrack: "marketing", minQualification: "—", keyFocus: "Target: ₦3,500,000/month", basePay: "4% partner, 20% corporate, ₦60,000 basic, ₦3,000 BTA/week, car on target" },
  { title: "Senior Marketing Manager", departmentName: "Marketing", careerTrack: "marketing", minQualification: "—", keyFocus: "Target: ₦5,000,000/month", basePay: "5% partner, 25% corporate, ₦100,000 basic, car on target" },

  // 13.6 Operations & Administration Track
  { title: "Customer Service Officer", departmentName: "Operations", careerTrack: "operations", minQualification: "OND / HND Business Admin, 0–1 year", keyFocus: "Front desk & registration", basePay: "₦25,000 basic" },
  { title: "Customer Service Executive", departmentName: "Operations", careerTrack: "operations", minQualification: "HND / BSc Business Admin, 2+ years", keyFocus: "Front desk & registration", basePay: "₦30,000 basic" },
  { title: "Asst Operations Manager", departmentName: "Operations", careerTrack: "operations", minQualification: "HND / BSc Business Admin, 4 years", keyFocus: "Branch operations support", basePay: "₦40,000 basic" },
  { title: "Operations Manager", departmentName: "Operations", careerTrack: "operations", minQualification: "BSc Business Admin, 4 years, diagnostic centre experience", keyFocus: "Branch operations management", basePay: "₦50,000 basic" },
  { title: "Senior Operations Manager", departmentName: "Operations", careerTrack: "operations", minQualification: "BSc / Masters Operations Management, 7 years, finance literacy", keyFocus: "Multi-branch operations", basePay: "₦80,000 basic" },
  { title: "COO / VP Operations", departmentName: "Operations", careerTrack: "operations", minQualification: "Masters degree, 12–15 years, finance and operations expertise", keyFocus: "Network-wide operations leadership", basePay: "By negotiation" },
];
