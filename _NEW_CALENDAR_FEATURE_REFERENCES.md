# New Calendar Feature: Master Reference List

This document serves as a central hub for all key reference materials related to the new calendar redesign project. Use these links to access detailed information on design, technical specifications, component plans, and more.

## 1. High-Level Design & Vision

*   **[High-Fidelity Design Proposal](./high_fidelity_calendar_design_proposal.md)**
    *   **Purpose**: The primary design document outlining the overall vision, layout, user experience, and key visual elements of the new calendar interface. Includes mockups and layout diagrams.

*   **[New Calendar Design (Wireframes)](./newCalendarDesign.md)**
    *   **Purpose**: Contains detailed wireframes and ASCII diagrams for the new layout, including the right-hand sidebar, header controls, and main content area.

## 2. Component & Technical Specifications

*   **[Calendar Component Specifications](./calendar_component_specifications.md)**
    *   **Purpose**: Details the functional requirements and specifications for each new UI component (e.g., `CalendarPageLayout`, `CalendarRightSidebar`, etc.).

*   **[Calendar Card Specifications](./calendar_card_specifications.md)**
    *   **Purpose**: Provides detailed specifications for the content, structure, and behavior of the individual event cards for both recipes and cleaning tasks.

*   **[Calendar Card Mockups](./calendar_card_mockups.md)**
    *   **Purpose**: Visual mockups of the event cards, illustrating the use of Material UI icons and the desired aesthetic.

## 3. Technical Planning & Audit

*   **[Calendar Technical Audit](./calendar_technical_audit.md)**
    *   **Purpose**: An in-depth analysis of the existing `ProductionSchedulerCalendar.jsx` and `TaskSchedulerCalendar.jsx` components, covering their structure, data flow, and dependencies. This is crucial for the refactoring process.

*   **[Legacy Component Deprecation Plan](./legacy_component_deprecation_plan.md)**
    *   **Purpose**: A running list of old components, files, and CSS that are slated for removal or significant refactoring as part of this project.

## 4. Development Tracking

*   **[Component Development Tracking Folder](./component_dev_tracking/)**
    *   **Purpose**: This directory contains individual markdown files for each new React component being built. Each file tracks the status, props, state, and development notes for that specific component.
