# Cancer Candy Catalogue

**Penny per patient. Color tells you the type. Not solved means go faster.**

A color-coded product line where each color represents a different health intervention class. Every product operates on the same design constraint: **the cheapest possible unit cost that still delivers the mechanism.** The candy framing is deliberate — sugar is the delivery vehicle, the Trojan horse that carries the science.

## The Colors

| Color | Product | Unit Cost | Target Population |
|-------|---------|-----------|-------------------|
| **WHITE** | D-Xylose Base (the penny sugar) | $0.01/dose | 500M+ (metabolic) |
| **RED** | Cardiac Drink | ~$2/serving | 100M+ (CV risk) |
| **BLUE** | Men's Optimization | $45-140/mo | Consumer |
| **GREEN** | Cancer Detection Nanocapsule | $0.01-0.10/dose | 19M+ (new cancer/yr) |
| **PURPLE** | Women's + Child Priority | $41-95/mo | Consumer |
| **GOLD** | Neuro / Myelin (brain candy) | $35-90/mo | Consumer |
| **ORANGE** | Neonatal Package (NICU-in-a-box) | $20-30/birth | 1.8M deaths/yr preventable |
| **SILVER** | Apex Arc (graphene neurorehab pad) | $0.01/pad target | Universal bioelectric interface |
| **ICE-BLUE** | Intercontinental Ice Interceptors | TBD | Planetary |
| **BLACK** | Bird Brain (biomimetic circuits) | TBD | Compute paradigm |

## Repository Contents

```
cancer_candy_catalogue.md   — Full catalogue: mechanisms, costs, deployment plans
REFERENCE.md                — Quick reference
pharma_restriction_clause.md — Legal restriction on pharma pricing exploitation

src/ [planned]
  sat_solver.py             — 3-SAT feasibility solver for GREEN nanocapsule manufacturing
  stimulation_sat.py        — SILVER Apex Arc stimulation protocol optimizer
  cost_calculator.py        — Cost models for all catalogue tiers
  prior_art.py              — Cryptographic prior art timestamping
```

> **Note:** `src/` code is in active development. The algorithms are specified in this README; implementations are forthcoming.

## Code

### SAT Solver (`src/sat_solver.py`)

The GREEN nanocapsule has manufacturing constraints that form a 3-SAT problem: pH ranges, lipid ratios, D-xylose surface density, chromophore loading, particle size distributions, and stability windows must all be simultaneously satisfied. The solver maps the feasible manufacturing parameter space.

### Stimulation Protocol Optimizer (`src/stimulation_sat.py`)

The SILVER Apex Arc uses three physics (LIFU, electrical stimulation, photobiomodulation) applied through a single graphene pad. Finding optimal interference patterns across the three modalities — where constructive nodes land on target tissue — is a constraint satisfaction problem. This optimizer searches the parameter space.

### Cost Calculator (`src/cost_calculator.py`)

Computes deployment costs across all catalogue tiers. Answers questions like: "What does it cost to give D-Xylose to 500M people?" and "What's the cost-per-life-saved for ORANGE Tier 0 + Tier 1?"

### Prior Art Proof (`src/prior_art.py`)

Generates SHA-256 hashes of all catalogue documents with timestamps. This creates a cryptographic proof that these designs existed at a specific date — establishing prior art that prevents future patent claims on the mechanisms described here.

## Prior Art Notice

This repository constitutes **published prior art** under 35 U.S.C. § 102. All mechanisms, formulations, architectures, and deployment plans described herein are disclosed to the public as of their commit timestamps. No entity may patent any claim that is anticipated by or obvious in light of these disclosures.

Every mechanism cited has published evidence. Every cost estimate uses real market data. The compounds exist. The equipment exists. The manufacturing exists.

## The Penny Per Patient Theorem

Three products genuinely approach penny-per-patient economics:

1. **WHITE (D-Xylose):** $0.01/dose. Proven. Scalable. GRAS since 1982. Ready now.
2. **GREEN (Cancer Nanocapsule):** $0.01-0.10/dose at LNP manufacturing scale.
3. **SILVER (Apex Arc):** $0.01/pad at 100M+ unit/year graphene manufacturing scale.

## The Honest Math

- **ORANGE Tier 0 + Tier 1** = $1.35B first year to prevent **1.8M neonatal deaths**. That's 67% of neonatal mortality for ~5% of the full NICU-everywhere cost ($1.35B ÷ $28.5B Tier 2).
- **1B meals** = $50-60M. Benefit-cost ratio: **37:1** (Copenhagen Consensus 2024).
- **D-Xylose at scale** = $0.01/dose × 500M people × 365 days = $1.8B/year.

## License

This work is licensed under [The Time License v3.0](LICENSE) — Tyler Roost / The TimeLord. Open prior art. Cannot be patented. That's the point.

The canonical license lives at [TimeLordRaps/the-time-license](https://github.com/TimeLordRaps/the-time-license). This repo's LICENSE is auto-synced from that source.

## Pharma Restriction

See [pharma_restriction_clause.md](pharma_restriction_clause.md). Any entity using these designs to charge more than 10× the documented manufacturing cost violates the spirit and intent of this disclosure. The catalogue exists to make healthcare cheaper, not to create new profit centers.

---

**$150K/year cancer treatment. Chemistry costs $12. Not solved means go faster.**
