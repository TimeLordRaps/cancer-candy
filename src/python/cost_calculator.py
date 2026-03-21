"""
cost_calculator.py — Cost models for prevention + detection tiers.

Calculates per-dose costs for all Cancer Candy product configurations:
- Prevention stack (D-Xylose + XOS + Allulose + Myo-Inositol)
- Detection FLASH (24hr, free chromophore)
- Detection WATCH (7-day, PLGA-encapsulated chromophore)
- Full combo (prevention + detection in one candy)

All costs in USD. Manufacturing cost, not retail.
"""

from __future__ import annotations
from dataclasses import dataclass


@dataclass
class Ingredient:
    name: str
    cost_per_dose_usd: float
    dose_mg: float
    source: str


# Prevention stack ingredients
PREVENTION_STACK = [
    Ingredient("D-Xylose", 0.01, 5000, "GRAS monosaccharide, bulk commodity"),
    Ingredient("XOS (xylo-oligosaccharides)", 0.20, 2000, "Enzymatic xylan hydrolysis"),
    Ingredient("D-Allulose", 0.45, 5000, "Enzymatic epimerization of fructose"),
    Ingredient("Myo-Inositol", 0.20, 2000, "Fermentation or phytate hydrolysis"),
]

# Detection components
DETECTION_BASE = [
    Ingredient("D-Xylose surface ligands", 0.005, 50, "Same D-Xylose, purified for functionalization"),
    Ingredient("pH-responsive polymer coat", 0.01, 20, "PLGA/chitosan derivative"),
]

CHROMOPHORE_COST_PER_TYPE = 0.005  # Per cancer type chromophore, per dose

LNP_MANUFACTURING = Ingredient("LNP encapsulation", 0.02, 0, "Microfluidic LNP at scale")
PLGA_SECONDARY = Ingredient("PLGA 65:35 microsphere", 0.08, 30, "Double emulsion solvent evaporation")

# Candy form costs
CANDY_FORMS = {
    "gummy_bear": 0.015,
    "gummy_ring": 0.015,
    "hard_candy": 0.010,
    "lollipop": 0.020,
    "chew": 0.012,
    "powder_sachet": 0.005,
}


def prevention_cost() -> float:
    """Cost of prevention stack only (no detection)."""
    return sum(i.cost_per_dose_usd for i in PREVENTION_STACK)


def detection_flash_cost(cancer_types: int = 24) -> float:
    """Cost of FLASH (24hr) detection payload."""
    base = sum(i.cost_per_dose_usd for i in DETECTION_BASE)
    chromophores = CHROMOPHORE_COST_PER_TYPE * cancer_types
    manufacturing = LNP_MANUFACTURING.cost_per_dose_usd
    return base + chromophores + manufacturing


def detection_watch_cost(cancer_types: int = 24) -> float:
    """Cost of WATCH (7-day) detection payload."""
    flash = detection_flash_cost(cancer_types)
    plga = PLGA_SECONDARY.cost_per_dose_usd
    return flash + plga


def full_candy_cost(
    form: str = "powder_sachet",
    tier: str = "FLASH",
    cancer_types: int = 24,
) -> dict:
    """Total cost of one candy: prevention + detection + form factor."""
    prev = prevention_cost()
    detect = detection_flash_cost(cancer_types) if tier == "FLASH" else detection_watch_cost(cancer_types)
    form_cost = CANDY_FORMS.get(form, 0.01)

    total = prev + detect + form_cost
    return {
        "prevention_usd": round(prev, 4),
        "detection_usd": round(detect, 4),
        "form_factor_usd": round(form_cost, 4),
        "total_manufacturing_usd": round(total, 4),
        "tier": tier,
        "form": form,
        "cancer_types": cancer_types,
        "pharma_cap_10x": round(total * 10, 2),
    }


def deployment_cost(population: int, doses_per_year: int = 4) -> dict:
    """Cost to deploy Cancer Candy to a population (quarterly dosing)."""
    flash_per_dose = full_candy_cost(form="powder_sachet", tier="FLASH")["total_manufacturing_usd"]
    watch_per_dose = full_candy_cost(form="powder_sachet", tier="WATCH")["total_manufacturing_usd"]

    annual_flash = flash_per_dose * population * doses_per_year
    annual_watch = watch_per_dose * population * doses_per_year

    return {
        "population": population,
        "doses_per_year": doses_per_year,
        "flash_per_dose": round(flash_per_dose, 4),
        "watch_per_dose": round(watch_per_dose, 4),
        "annual_flash_total": round(annual_flash, 2),
        "annual_watch_total": round(annual_watch, 2),
        "flash_per_capita_year": round(flash_per_dose * doses_per_year, 4),
        "watch_per_capita_year": round(watch_per_dose * doses_per_year, 4),
    }


def print_cost_breakdown() -> None:
    """Print full cost breakdown for all configurations."""
    print("=" * 60)
    print("CANCER CANDY COST CALCULATOR")
    print("=" * 60)

    print("\n--- Prevention Stack (per dose) ---")
    for ing in PREVENTION_STACK:
        print(f"  {ing.name}: ${ing.cost_per_dose_usd:.4f} ({ing.dose_mg}mg)")
    print(f"  TOTAL: ${prevention_cost():.4f}")

    print("\n--- Detection Payload ---")
    print(f"  FLASH (24hr): ${detection_flash_cost():.4f}")
    print(f"  WATCH (7-day): ${detection_watch_cost():.4f}")

    print("\n--- Full Candy (all forms × both tiers) ---")
    for form, form_cost in sorted(CANDY_FORMS.items()):
        for tier in ["FLASH", "WATCH"]:
            result = full_candy_cost(form=form, tier=tier)
            print(f"  {form} + {tier}: ${result['total_manufacturing_usd']:.4f} "
                  f"(10x pharma cap: ${result['pharma_cap_10x']})")

    print("\n--- Deployment Scale ---")
    scales = [
        ("1 school (500 kids)", 500),
        ("1 city (100K)", 100_000),
        ("California (39M)", 39_000_000),
        ("USA (330M)", 330_000_000),
        ("Global (8B)", 8_000_000_000),
    ]
    for name, pop in scales:
        result = deployment_cost(pop)
        print(f"\n  {name}:")
        print(f"    FLASH: ${result['annual_flash_total']:,.2f}/year "
              f"(${result['flash_per_capita_year']:.4f}/person/year)")
        print(f"    WATCH: ${result['annual_watch_total']:,.2f}/year "
              f"(${result['watch_per_capita_year']:.4f}/person/year)")


if __name__ == "__main__":
    print_cost_breakdown()
