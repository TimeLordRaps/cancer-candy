"""
sat_solver.py — 3-SAT feasibility solver for GREEN nanocapsule manufacturing constraints.

Maps nanocapsule architecture choices (V1 LNP, V2 Bucky Mesh, V2.2 Janus Hollow Shell)
to a constraint satisfaction problem. Each manufacturing decision is a boolean variable.
The solver determines which combinations of materials, processes, and conditions are
simultaneously satisfiable.

This is a design tool, not a runtime component.
"""

from __future__ import annotations
from dataclasses import dataclass
from itertools import product
from typing import Optional


@dataclass
class Constraint:
    """A single manufacturing constraint in CNF form."""
    name: str
    variables: list[str]
    # Each clause is a list of (variable, negated) tuples
    clauses: list[list[tuple[str, bool]]]
    source: str  # Which nanocapsule version introduced this constraint


# Manufacturing variables — each is True (available/chosen) or False
VARIABLES = {
    # Materials
    "lipid_nanoparticle": "LNP manufacturing infrastructure available",
    "dxylose_functionalization": "D-Xylose surface ligand attachment process",
    "ph_trigger_polymer": "pH-responsive polymer (6.2-6.8 range)",
    "chromophore_payload": "Cancer-type-specific chromophore synthesis",
    "plga_encapsulation": "PLGA microsphere secondary encapsulation (7-day)",
    "fullerene_mesh": "Fullerene-derived mesh cage synthesis",
    "janus_shell": "Asymmetric hydrophilic/hydrophobic shell fabrication",

    # Process capabilities
    "microfluidic_mixing": "Microfluidic reactor for size-controlled particles",
    "self_assembly": "Self-assembly conditions achievable at scale",
    "cold_chain": "Cold chain logistics available",
    "lyophilization": "Freeze-drying for shelf stability",
    "quality_control_hplc": "HPLC quality control for chromophore purity",

    # Regulatory
    "gras_components_only": "All components have GRAS status",
    "fda_ivd_pathway": "FDA IVD regulatory pathway feasible",
    "gmp_facility": "GMP-certified manufacturing facility access",
}


def build_v1_constraints() -> list[Constraint]:
    """V1 LNP: simplest architecture, most manufacturing precedent."""
    return [
        Constraint(
            name="V1 requires LNP infrastructure",
            variables=["lipid_nanoparticle"],
            clauses=[[("lipid_nanoparticle", False)]],
            source="V1-LNP"
        ),
        Constraint(
            name="V1 requires D-Xylose functionalization",
            variables=["dxylose_functionalization"],
            clauses=[[("dxylose_functionalization", False)]],
            source="V1-LNP"
        ),
        Constraint(
            name="V1 requires pH trigger",
            variables=["ph_trigger_polymer"],
            clauses=[[("ph_trigger_polymer", False)]],
            source="V1-LNP"
        ),
        Constraint(
            name="V1 requires chromophore payload",
            variables=["chromophore_payload"],
            clauses=[[("chromophore_payload", False)]],
            source="V1-LNP"
        ),
        Constraint(
            name="V1 requires either cold chain or lyophilization",
            variables=["cold_chain", "lyophilization"],
            clauses=[[("cold_chain", False), ("lyophilization", False)]],
            source="V1-LNP"
        ),
    ]


def build_v2_constraints() -> list[Constraint]:
    """V2 Bucky Mesh: requires fullerene mesh + self-assembly."""
    v1 = build_v1_constraints()
    return v1 + [
        Constraint(
            name="V2 requires fullerene mesh",
            variables=["fullerene_mesh"],
            clauses=[[("fullerene_mesh", False)]],
            source="V2-Bucky"
        ),
        Constraint(
            name="V2 requires self-assembly conditions",
            variables=["self_assembly"],
            clauses=[[("self_assembly", False)]],
            source="V2-Bucky"
        ),
    ]


def build_v22_constraints() -> list[Constraint]:
    """V2.2 Janus Hollow Shell: requires asymmetric shell + microfluidics."""
    v2 = build_v2_constraints()
    return v2 + [
        Constraint(
            name="V2.2 requires Janus shell fabrication",
            variables=["janus_shell"],
            clauses=[[("janus_shell", False)]],
            source="V2.2-Janus"
        ),
        Constraint(
            name="V2.2 requires microfluidic mixing for asymmetry",
            variables=["microfluidic_mixing"],
            clauses=[[("microfluidic_mixing", False)]],
            source="V2.2-Janus"
        ),
    ]


def build_watch_tier_constraints() -> list[Constraint]:
    """WATCH (7-day) tier: adds PLGA encapsulation requirement."""
    return [
        Constraint(
            name="WATCH tier requires PLGA encapsulation",
            variables=["plga_encapsulation"],
            clauses=[[("plga_encapsulation", False)]],
            source="WATCH-7day"
        ),
    ]


def build_regulatory_constraints() -> list[Constraint]:
    """Regulatory constraints that apply to all versions."""
    return [
        Constraint(
            name="All components must be GRAS or have regulatory pathway",
            variables=["gras_components_only", "fda_ivd_pathway"],
            clauses=[[("gras_components_only", False), ("fda_ivd_pathway", False)]],
            source="Regulatory"
        ),
        Constraint(
            name="GMP facility required for any clinical product",
            variables=["gmp_facility"],
            clauses=[[("gmp_facility", False)]],
            source="Regulatory"
        ),
        Constraint(
            name="QC required for chromophore purity",
            variables=["quality_control_hplc"],
            clauses=[[("quality_control_hplc", False)]],
            source="Regulatory"
        ),
    ]


def solve_sat(constraints: list[Constraint]) -> Optional[dict[str, bool]]:
    """
    Brute-force 3-SAT solver for manufacturing feasibility.
    With ~15 variables, 2^15 = 32768 combinations — trivially searchable.
    """
    all_vars = sorted(set(
        v for c in constraints for v in c.variables
    ))

    for assignment_tuple in product([True, False], repeat=len(all_vars)):
        assignment = dict(zip(all_vars, assignment_tuple))

        if all(
            evaluate_constraint(constraint, assignment)
            for constraint in constraints
        ):
            return assignment

    return None


def evaluate_constraint(constraint: Constraint, assignment: dict[str, bool]) -> bool:
    """Evaluate a CNF constraint against an assignment."""
    for clause in constraint.clauses:
        clause_satisfied = False
        for var_name, is_negated in clause:
            val = assignment.get(var_name, False)
            if is_negated:
                val = not val
            if val:
                clause_satisfied = True
                break
        if not clause_satisfied:
            return False
    return True


def run_feasibility_analysis() -> None:
    """Run feasibility analysis for all nanocapsule versions + tiers."""
    configs = {
        "V1 LNP + FLASH": build_v1_constraints() + build_regulatory_constraints(),
        "V1 LNP + WATCH": build_v1_constraints() + build_watch_tier_constraints() + build_regulatory_constraints(),
        "V2 Bucky + FLASH": build_v2_constraints() + build_regulatory_constraints(),
        "V2 Bucky + WATCH": build_v2_constraints() + build_watch_tier_constraints() + build_regulatory_constraints(),
        "V2.2 Janus + FLASH": build_v22_constraints() + build_regulatory_constraints(),
        "V2.2 Janus + WATCH": build_v22_constraints() + build_watch_tier_constraints() + build_regulatory_constraints(),
    }

    for name, constraints in configs.items():
        result = solve_sat(constraints)
        if result:
            required = [k for k, v in sorted(result.items()) if v]
            print(f"\n✅ {name}: FEASIBLE")
            print(f"   Required capabilities ({len(required)}):")
            for r in required:
                print(f"     - {r}: {VARIABLES.get(r, '?')}")
        else:
            print(f"\n❌ {name}: NOT FEASIBLE")


if __name__ == "__main__":
    run_feasibility_analysis()
