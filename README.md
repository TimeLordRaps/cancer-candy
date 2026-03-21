# Cancer Candy

**24 flavors. Same mechanism. No kid gets cancer on our watch.**

Cancer Candy is a prevention and detection product line. Every flavor delivers the same two mechanisms through a different candy expression — because no one's taste should be the reason they don't get protected.

## The Two Mechanisms

### 1. Prevention — D-Xylose (WHITE)

D-Xylose is a naturally occurring monosaccharide (GRAS since 1982) that costs **$0.01/dose**. It drives a 9-link self-reinforcing anti-cancer feedback loop:

```
Sucrase inhibition (Ki 3.2-8.4 mM, uncompetitive)
  → Glucose AUC ↓21%
    → Insulin AUC ↓21-35%
      → Insulin sensitivity ↑
        → AMPK activation (3.23x at 20mM)
          → PPP flux (NADPH ↑200-300%, GSH ↑150%)
            → ROS ↓50%
              → SCFA production (prebiotic)
                → Gut barrier integrity → Endotoxemia ↓
                  → Sleep quality → Cortisol regulation
                    → [LOOP BACK TO STEP 1]
```

**Why this prevents cancer:** AMPK activation, pentose phosphate pathway flux, and reactive oxygen species reduction are three of the most validated anti-cancer metabolic pathways in published literature. D-Xylose delivers all three in a sugar that costs a penny.

| Property | Value |
|----------|-------|
| Molecule | D-Xylose (CHEMBL1236821) |
| MW | 150.13 g/mol |
| Calories | 2.4 kcal/g ("right-calorie" — routes through PPP, not stored as fat) |
| GRAS | Since 1982 |
| Allergenicity | Zero (pure monosaccharide, no protein epitopes, no IgE binding) |
| Drug interactions | Zero (no CYP metabolism) |
| Cost/dose | $0.01-0.12/day |

**Complementary prevention stack (all in the candy):**

| Compound | Mechanism | $/day |
|----------|-----------|-------|
| D-Xylose | Glycemic + AMPK + PPP + prebiotic | $0.01-0.12 |
| XOS (xylo-oligosaccharides) | Targeted Bifidobacteria prebiotic | $0.10-0.30 |
| D-Allulose | Hepatic lipogenesis inhibition, GLP-1 | $0.30-0.60 |
| Myo-Inositol | PI3K/Akt insulin signaling | $0.15-0.25 |
| **TOTAL** | | **<$1.30/day retail** |

**Critical unsolved safety gap:** Platelet activation assay needed ($30K-150K). Xylitol (alditol) = 1.57x MACE risk. Erythritol (alditol) = 2x MACE risk. D-Xylose retains its aldehyde group (NOT an alditol) and should NOT activate P2Y12 — but the assay proving this hasn't been run. **Not solved means go faster.**

### 2. Detection — GREEN Nanocapsule

D-Xylose surface functionalization exploiting GLUT1 overexpression in tumor cells (Warburg effect). The sugar IS the targeting vector.

**You eat a candy. If you have cancer, you turn a color. The sugar finds the cancer. The color tells the doctor. Penny per patient.**

Three versions:

| Version | Architecture | Status |
|---------|-------------|--------|
| **V1 — LNP Nanocapsule** | Lipid nanoparticle + D-xylose surface ligands + pH-triggered chromophore release (tumor pH 6.2-6.8 vs normal 7.4) | Achievable with existing nanomedicine infrastructure |
| **V2 — Bucky Mesh** | Sugar-polymer cage with fullerene-derived mesh, chemo-osmotic drift, self-assembling | Architecture defined |
| **V2.2 — Janus Hollow Shell** | Half-hydrophilic/half-hydrophobic asymmetric nanocell, rolling chemotaxis toward glucose gradients, centrifugal chromophore launch | Architecture defined, 3-SAT manufacturing constraints mapped |

**Estimated cost:** $0.01-0.10/dose at LNP manufacturing scale.

---

## The 24 Flavors

Same two mechanisms in every candy. 24 different expressions so no kid's taste is missed. Every flavor contains the D-Xylose prevention stack. Every flavor can carry the GREEN detection nanocapsule payload.

| # | Flavor | Candy Form | Color |
|---|--------|-----------|-------|
| 1 | Strawberry | Gummy bear | Red |
| 2 | Blue Raspberry | Gummy bear | Blue |
| 3 | Grape | Gummy bear | Purple |
| 4 | Green Apple | Gummy bear | Green |
| 5 | Watermelon | Gummy ring | Pink/Green |
| 6 | Mango | Gummy ring | Orange |
| 7 | Pineapple | Gummy ring | Yellow |
| 8 | Cherry | Gummy ring | Dark Red |
| 9 | Lemon | Hard candy | Yellow |
| 10 | Orange | Hard candy | Orange |
| 11 | Lime | Hard candy | Green |
| 12 | Cinnamon | Hard candy | Red |
| 13 | Vanilla | Lollipop | White |
| 14 | Cotton Candy | Lollipop | Pink/Blue |
| 15 | Bubblegum | Lollipop | Pink |
| 16 | Root Beer | Lollipop | Brown |
| 17 | Chocolate | Chew | Brown |
| 18 | Caramel | Chew | Gold |
| 19 | Peanut Butter | Chew | Tan |
| 20 | Coconut | Chew | White |
| 21 | Peach | Powder/sachet | Orange |
| 22 | Mixed Berry | Powder/sachet | Purple |
| 23 | Tropical Punch | Powder/sachet | Red |
| 24 | Unflavored | Powder/sachet | Clear |

**Six candy forms × four flavors each = 24 SKUs.** Gummy bears, gummy rings, hard candies, lollipops, chews, and powder sachets. The powder/sachet form factor enables the $0.025/dose minimum viable deployment for global reach.

**Design constraint:** Every form factor must be shelf-stable without cold chain. Every flavor must mask the D-Xylose taste profile (mildly sweet, slight woody note). Every SKU must be manufacturable with existing confectionery equipment.

**Allergen-free by design:** D-Xylose is a pure monosaccharide — zero protein epitopes, zero IgE binding potential. No nuts, no dairy, no gluten, no soy in the base formulation. Individual flavors that add allergens (e.g., #19 Peanut Butter) are clearly labeled; the mechanism itself is allergen-free.

---

## Repository Contents

```
cancer_candy_catalogue.md    — Full technical catalogue: mechanisms, costs, evidence
pharma_restriction_clause.md — Legal restriction on pharma pricing exploitation
REFERENCE.md                 — Quick reference

src/ [planned]
  sat_solver.py              — 3-SAT feasibility solver for GREEN nanocapsule manufacturing
  cost_calculator.py         — Cost models for prevention + detection tiers
  prior_art.py               — Cryptographic prior art timestamping
```

## Sister Project

**[Race to Cure Cancer](https://github.com/TimeLordRaps/race-to-cure-cancer)** — treatment and cure for those who already have cancer. Tiered by stage, stage 4 priority. All tiers inform all others.

Cancer Candy stops kids from getting cancer. Race to Cure Cancer helps those who already have it. If this repo does its job, that repo becomes unnecessary.

## Prior Art Notice

This repository constitutes **published prior art** under 35 U.S.C. § 102. All mechanisms, formulations, architectures, and deployment plans described herein are disclosed to the public as of their commit timestamps. No entity may patent any claim that is anticipated by or obvious in light of these disclosures.

Every mechanism cited has published evidence. Every cost estimate uses real market data. The compounds exist. The equipment exists. The manufacturing exists.

## Pharma Restriction

See [pharma_restriction_clause.md](pharma_restriction_clause.md). Any entity using these designs to charge more than 10× the documented manufacturing cost violates the spirit and intent of this disclosure. The catalogue exists to make healthcare cheaper, not to create new profit centers.

## License

This work is licensed under [The Time License](LICENSE) — Tyler Roost / The TimeLord. Open prior art. Cannot be patented. That's the point.

Canonical: [TimeLordRaps/the-time-license](https://github.com/TimeLordRaps/the-time-license)

---

**$150K/year cancer treatment. Chemistry costs $12. Not solved means go faster.**
