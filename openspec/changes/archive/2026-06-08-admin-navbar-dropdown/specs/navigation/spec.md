# Navigation Specification

## Purpose

Defines the structure and behavior of the application's primary navigation system (the lateral navbar), including direct links to major domains and nested dropdowns for management options.

## Requirements

### Requirement: Direct Navigation Links

The system MUST provide direct navigation links for top-level operational areas, preferring direct buttons over single-option menu sections.

#### Scenario: Navigating to Monitoreo
- GIVEN the user is authenticated and viewing the navigation bar
- WHEN the user looks for live monitoring
- THEN they MUST see a direct link labeled "Monitoreo"
- AND it MUST route to the corresponding live monitoring view

#### Scenario: Navigating to Planta
- GIVEN the user is authenticated and viewing the navigation bar
- WHEN the user looks for operational management
- THEN they MUST see a direct link labeled "Planta"
- AND it MUST route to the corresponding plant operations view

#### Scenario: Navigating to Reportes
- GIVEN the user is authenticated and viewing the navigation bar
- WHEN the user looks for reports
- THEN they MUST see a direct link labeled "Reportes"
- AND it MUST route to the corresponding reports view

### Requirement: Management Dropdown (Gestión)

The system MUST consolidate management-related links under a state-driven collapsible dropdown labeled "Gestión".

#### Scenario: Expanding the Dropdown Manually
- GIVEN the "Gestión" dropdown is currently collapsed
- WHEN the user clicks on the "Gestión" toggle
- THEN the dropdown MUST expand to reveal its child links
- AND the toggle indicator MUST update to reflect the expanded state

#### Scenario: Collapsing the Dropdown Manually
- GIVEN the "Gestión" dropdown is currently expanded
- WHEN the user clicks on the "Gestión" toggle
- THEN the dropdown MUST collapse, hiding its child links

#### Scenario: Auto-expanding on Load Based on Route
- GIVEN the user navigates directly to a management sub-route (e.g., via bookmark or page refresh)
- WHEN the DashboardLayout loads
- THEN the "Gestión" dropdown MUST automatically initialize in the expanded state

#### Scenario: Maintaining State During Sub-navigation
- GIVEN the "Gestión" dropdown is expanded
- WHEN the user clicks a sub-link within the dropdown
- THEN the navigation MUST occur to the target route
- AND the dropdown MUST remain in the expanded state
