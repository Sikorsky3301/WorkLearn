"""Starter templates for the Simulation CMS builder — one module per domain,
each exporting a TEMPLATE dict shaped as {key, label, description, simulation,
tasks}, where `simulation` matches SimulationCreate (minus `id`) and each
entry in `tasks` matches SimulationTaskCreate. See
app/routes/v1/admin_simulations.py's create_from_template for how these are
instantiated into a real DRAFT simulation."""
from app.cms_templates import (
    customer_support, marketing_content, finance_accounting,
    hr_recruiting, product_management, healthcare_admin, it_engineering,
)

TEMPLATES: dict[str, dict] = {
    m.TEMPLATE["key"]: m.TEMPLATE
    for m in (
        customer_support, marketing_content, finance_accounting,
        hr_recruiting, product_management, healthcare_admin, it_engineering,
    )
}
