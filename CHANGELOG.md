# Changelog

## 2026-02-18 — Call Detail Redesign & Scoring Update

### New Data Collection Fields
- Past Medical History, Past Surgical History, Current Medications & Allergies
- Grandchildren, Hobbies/Interests, Occupation
- Premium IOL Interest Level (bucketed: Highly Interested / Leaning Interest / Neutral / Cost Concerned / Not Interested / Unknown)
- Femtosecond Laser Interest Level (bucketed: Highly Interested / Passively Receptive / Cost Hesitant / Skeptical / Not Interested / Unknown)
- Patient Concerns & Questions, Overall Sentiment, Personality Tolerance, Surgical Readiness Timeline

### Removed Fields
- Vision Scale (1-10), Glasses Preference, Activities (separate field), Email extraction, Patient Name extraction from call data

### Call Detail Page — New Layout
1. **Hero Banner** — patient name (from DB), occupation, timestamp, duration, sentiment, propensity score
2. **Call Synopsis** — unchanged
3. **Medical Dashboard** — 3 prominent cards: Past Medical History, Past Surgical History, Medications & Allergies
4. **Patient Concerns Banner** — elevated callout with warning accent border
5. **Personal Cards** — Grandchildren + Hobbies & Interests
6. **IOL Upgrade Propensity** — gauge + radar + breakdown (updated inputs)
7. **Decision Indicators** — 5 compact cards: Readiness, Premium IOL, Laser, Sentiment, Personality
8. **Surgeon's Notes** — unchanged
9. **Collapsible Accordions** — AI Evaluation, Other Collected Data, Transcript & Raw Data

### Updated IOL Propensity Scoring (5 factors)
| Factor | Weight |
|--------|--------|
| Premium IOL Interest | 35% |
| Surgical Readiness | 20% |
| Femtosecond Laser | 15% |
| Lifestyle Match | 20% |
| Patient Engagement | 10% |

### Updated Lifestyle Radar (5 axes)
Active Lifestyle, Near Vision, Digital/Work, Social/Family, Independence

### Other Changes
- Dashboard: replaced Vision Impact chip with Premium IOL label
- Calls list: removed Vision Scale column
