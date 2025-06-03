# Recipe Yield and Cost Adjustment Calculator - Implementation Checklist

## Phase 1: Client-Side Prototype

### Setup and Dependencies
- [ ] Install required libraries:
  - [ ] math.js for formula calculations
  - [ ] recharts for data visualization
  - [ ] material-ui components for UI elements

### Core Components
- [ ] Create `RecipeYieldCalculator.jsx` component
  - [ ] Design responsive layout with Material UI
  - [ ] Implement yield input control (slider and/or numeric input)
  - [ ] Add reset button to return to original values
  - [ ] Include save/export functionality placeholders

- [ ] Create `IngredientScalingTable.jsx` component
  - [ ] Build editable table for ingredients
  - [ ] Implement real-time quantity scaling based on yield factor
  - [ ] Add unit cost input fields with validation
  - [ ] Calculate and display total cost per ingredient

- [ ] Create `CostComparisonChart.jsx` component
  - [ ] Implement bar chart comparing original vs. adjusted costs
  - [ ] Add pie/donut chart showing ingredient cost breakdown
  - [ ] Include toggle for different visualization options

### Math and Calculation Logic
- [ ] Implement core calculation functions:
  - [ ] `calculateScaleFactor(originalYield, newYield)`
  - [ ] `scaleIngredientQuantities(ingredients, scaleFactor)`
  - [ ] `calculateTotalCost(ingredients)`
  - [ ] `formatCurrency(value)` with proper handling for null/undefined

### UI/UX Elements
- [ ] Design modal or tab interface for calculator
  - [ ] Create tab within RecipeDetailModal
  - [ ] Ensure responsive design for all screen sizes
  - [ ] Implement loading states for calculations

- [ ] Add visual feedback for changes
  - [ ] Color coding for cost increases/decreases
  - [ ] Animated transitions for value changes
  - [ ] Tooltips explaining calculations

### State Management
- [ ] Implement local state management:
  - [ ] Track original recipe data
  - [ ] Manage adjusted recipe data
  - [ ] Handle temporary scenarios (before saving)
  - [ ] Implement undo/redo functionality

### Validation and Error Handling
- [ ] Add input validation:
  - [ ] Prevent negative yields or quantities
  - [ ] Validate numeric inputs
  - [ ] Handle edge cases (zero values, very large numbers)
  - [ ] Display appropriate error messages

### Integration with Existing Components
- [ ] Connect to RecipeDetailModal
  - [ ] Add calculator tab or button
  - [ ] Pass recipe data to calculator
  - [ ] Handle recipe updates

- [ ] Ensure compatibility with RecipeList
  - [ ] Update list when scenarios are saved
  - [ ] Consider adding indicator for recipes with saved scenarios

### Testing
- [ ] Manual testing:
  - [ ] Verify calculations with different yield values
  - [ ] Test edge cases (very small/large yields)
  - [ ] Ensure UI responsiveness on different devices
  - [ ] Validate error handling

## Phase 2: Future Enhancements (Post-Prototype)
- [ ] Backend integration for saving scenarios
- [ ] User permissions for scenario management
- [ ] Ingredient substitution modeling
- [ ] Batch size optimization
- [ ] Cost trend analysis over time
- [ ] PDF/Excel export functionality
- [ ] Email sharing of scenarios

## Notes
- The prototype should focus on client-side functionality only
- Use existing recipe and ingredient data structures
- Calculations should be accurate to 2 decimal places
- UI should match existing CleanTrac design system
- Consider performance optimizations for recipes with many ingredients
