# Recipe Versioning and Scaling Integration

## Overview

This document outlines the implementation of recipe versioning and scaling functionality in the CleanTrac system. The integration enables production tasks to reference specific recipe versions and scale ingredient quantities based on target production amounts.

## 1. Core Components

### 1.1 Recipe Versioning

Recipe versioning allows tracking changes to recipes over time, ensuring production tasks use consistent recipe specifications regardless of future modifications.

#### Key Features:
- **Version Tracking**: Each recipe can have multiple versions with incremental version numbers
- **Change History**: Records who made changes, when changes were made, and notes about the changes
- **Version Selection**: Production tasks can specify which recipe version to use
- **Default Latest**: Automatically uses the latest recipe version if none is specified

#### Implementation:
- `RecipeVersion` model linked to `Recipe` via foreign key
- `recipe_version` field added to `RecipeProductionTask` model
- Signal handlers ensure production tasks always have a recipe version assigned

### 1.2 Recipe Scaling

Recipe scaling enables automatic calculation of ingredient quantities based on target production amounts.

#### Key Features:
- **Dynamic Scaling**: Adjust ingredient quantities based on target production quantity
- **Precision Control**: Maintain proper precision for measurements
- **Rounding Rules**: Apply appropriate rounding for different ingredient types
- **Cost Calculation**: Update cost estimates based on scaled quantities

#### Implementation:
- `RecipeScalingService` provides scaling calculations
- Decimal arithmetic ensures precise calculations
- API endpoints for previewing scaled recipes

## 2. Technical Architecture

### 2.1 Data Models

```python
# Key model relationships
Recipe (1) --< RecipeVersion (1) --< RecipeProductionTask
```

### 2.2 Services

#### RecipeScalingService
- `scale_recipe(recipe_version, target_quantity)`: Scales a recipe to a target quantity
- `calculate_ingredient_requirements(production_task)`: Calculates ingredients needed for a task

#### ProductionTaskService
- `create_task_with_version(data, user)`: Creates a production task with version handling

### 2.3 API Endpoints

- `GET /api/production-tasks/{id}/ingredient_requirements/`: Get scaled ingredients for a task
- `POST /api/production-tasks/scale_recipe/`: Preview a scaled recipe
- `POST /api/production-tasks/create_with_version/`: Create a task with version handling

## 3. Advanced Versioning Capabilities

### 3.1 Version Comparison

The system supports comparing different recipe versions to identify changes in:
- Ingredient lists
- Quantities and proportions
- Preparation methods
- Costs

### 3.2 Version Tagging

Versions can be tagged with descriptive labels:
- "Production Ready"
- "Cost Optimized"
- "Seasonal Variant"

### 3.3 Rollback Capability

Production managers can revert to previous recipe versions when needed.

## 4. Scaling Intelligence

### 4.1 Scaling Algorithms

Different scaling approaches are applied based on ingredient types:
- Linear scaling for most ingredients
- Step-function scaling for certain additives
- Custom scaling rules for special ingredients

### 4.2 Rounding Rules

Ingredient-specific rounding rules ensure practical measurements:
- Round to nearest whole unit for countable items
- Round to appropriate decimal places for liquids
- Round to standard measurement units (teaspoons, cups, etc.)

### 4.3 Scaling Constraints

The system enforces constraints to maintain recipe integrity:
- Minimum effective amounts
- Maximum safe quantities
- Equipment capacity limits

## 5. Integration with Other Modules

### 5.1 Inventory Management

- Check ingredient availability before scheduling
- Reserve ingredients for scheduled production
- Update inventory when production is completed

### 5.2 Staff Scheduling

- Calculate labor requirements based on recipe complexity and batch size
- Assign appropriate staff based on recipe requirements

### 5.3 Quality Control

- Version-specific quality control checkpoints
- Expected measurements and acceptable ranges
- Pass/fail criteria for each production step

## 6. User Experience Considerations

### 6.1 Production Staff View

- Clear presentation of scaled ingredient quantities
- Step-by-step instructions with version-specific details
- Mobile-friendly interface for on-floor use

### 6.2 Management View

- Version history and comparison tools
- Scaling simulation for production planning
- Cost impact analysis for different batch sizes

## 7. Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Recipe Version Model | ✅ Complete | Includes version tracking and metadata |
| Production Task Integration | ✅ Complete | Tasks reference specific versions |
| Scaling Service | ✅ Complete | Handles quantity calculations |
| API Endpoints | ✅ Complete | Supports frontend integration |
| Admin Interface | ✅ Complete | Manages versions and tasks |
| Frontend Components | 🔄 In Progress | Calendar view and task details |
| Inventory Integration | ⏳ Planned | Will check ingredient availability |

## 8. Future Enhancements

### 8.1 Advanced Scaling Features

- Interactive scaling calculator with real-time updates
- Scaling presets for common batch sizes
- Visual indicators for scaling constraints

### 8.2 Version Management

- Visual diff tool for version comparison
- Automated version creation based on significant changes
- Version approval workflows

### 8.3 Production Intelligence

- Yield prediction based on historical data
- Quality variance analysis by recipe version
- Cost optimization suggestions

## 9. References

### 9.1 Libraries and Tools

- **Django Simple History**: Version tracking and history management
- **Decimal**: Python's decimal module for precise arithmetic
- **Django REST Framework**: API endpoints for frontend integration

### 9.2 Related Documentation

- Recipe Models Documentation
- Production Scheduling System
- Inventory Management Integration
