import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Slider, 
  TextField, 
  Paper, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Divider,
  InputAdornment,
  Tooltip,
  IconButton
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import * as math from 'mathjs';

// Helper functions for calculations
const calculateScaleFactor = (originalYield, newYield) => {
  if (!originalYield || !newYield || originalYield === 0) return 1;
  return math.evaluate(`${newYield} / ${originalYield}`);
};

const scaleIngredientQuantities = (ingredients, scaleFactor) => {
  if (!ingredients || !Array.isArray(ingredients)) return [];
  
  return ingredients.map(ingredient => {
    const originalQuantity = parseFloat(ingredient.quantity) || 0;
    const unitCost = parseFloat(ingredient.unit_cost) || 0;
    const newQuantity = math.evaluate(`${originalQuantity} * ${scaleFactor}`);
    const newTotalCost = math.evaluate(`${newQuantity} * ${unitCost}`);
    
    return {
      ...ingredient,
      original_quantity: originalQuantity,
      quantity: newQuantity,
      total_cost: newTotalCost
    };
  });
};

const calculateTotalCost = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return 0;
  
  return ingredients.reduce((sum, ingredient) => {
    const totalCost = parseFloat(ingredient.total_cost) || 0;
    return math.evaluate(`${sum} + ${totalCost}`);
  }, 0);
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'R 0.00';
  return `R ${parseFloat(value).toFixed(2)}`;
};

const RecipeYieldCalculator = ({ recipe }) => {
  const [originalYield, setOriginalYield] = useState(0);
  const [newYield, setNewYield] = useState(0);
  const [originalIngredients, setOriginalIngredients] = useState([]);
  const [scaledIngredients, setScaledIngredients] = useState([]);
  const [originalTotalCost, setOriginalTotalCost] = useState(0);
  const [newTotalCost, setNewTotalCost] = useState(0);
  const [yieldUnit, setYieldUnit] = useState('kg');
  const [chartType, setChartType] = useState('bar');

  // Initialize with recipe data
  useEffect(() => {
    if (recipe && recipe.yield) {
      const yieldValue = parseFloat(recipe.yield.split(' ')[0]) || 1;
      const unit = recipe.yield.split(' ')[1] || 'kg';
      
      setOriginalYield(yieldValue);
      setNewYield(yieldValue);
      setYieldUnit(unit);
      
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        setOriginalIngredients(recipe.ingredients);
        setScaledIngredients(recipe.ingredients);
        
        const totalCost = calculateTotalCost(recipe.ingredients);
        setOriginalTotalCost(totalCost);
        setNewTotalCost(totalCost);
      }
    }
  }, [recipe]);

  // Update calculations when yield changes
  useEffect(() => {
    const scaleFactor = calculateScaleFactor(originalYield, newYield);
    const newScaledIngredients = scaleIngredientQuantities(originalIngredients, scaleFactor);
    setScaledIngredients(newScaledIngredients);
    
    const newCost = calculateTotalCost(newScaledIngredients);
    setNewTotalCost(newCost);
  }, [newYield, originalYield, originalIngredients]);

  // Handle yield input change
  const handleYieldChange = (event, newValue) => {
    setNewYield(newValue);
  };

  // Handle yield text input change
  const handleYieldInputChange = (event) => {
    const value = parseFloat(event.target.value) || 0;
    setNewYield(value);
  };

  // Reset to original values
  const handleReset = () => {
    setNewYield(originalYield);
  };

  // Handle ingredient unit cost change
  const handleUnitCostChange = (index, value) => {
    const updatedIngredients = [...scaledIngredients];
    const parsedValue = parseFloat(value) || 0;
    
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      unit_cost: parsedValue,
      total_cost: math.evaluate(`${updatedIngredients[index].quantity} * ${parsedValue}`)
    };
    
    setScaledIngredients(updatedIngredients);
    setNewTotalCost(calculateTotalCost(updatedIngredients));
  };

  // Prepare chart data
  const costComparisonData = [
    { name: 'Original Recipe', cost: originalTotalCost },
    { name: 'Adjusted Recipe', cost: newTotalCost }
  ];

  const ingredientCostData = scaledIngredients.map(ingredient => ({
    name: ingredient.name || 'Unknown',
    value: parseFloat(ingredient.total_cost) || 0
  })).filter(item => item.value > 0);

  // Calculate cost difference percentage
  const costDifference = newTotalCost - originalTotalCost;
  const costPercentChange = originalTotalCost !== 0 
    ? (costDifference / originalTotalCost) * 100 
    : 0;

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Recipe Yield and Cost Calculator
      </Typography>
      
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography id="yield-slider" gutterBottom>
              Adjust Yield ({yieldUnit})
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Slider
                  value={newYield}
                  onChange={handleYieldChange}
                  aria-labelledby="yield-slider"
                  min={originalYield * 0.1}
                  max={originalYield * 5}
                  step={originalYield * 0.05}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value.toFixed(2)} ${yieldUnit}`}
                />
              </Grid>
              <Grid item>
                <TextField
                  value={newYield}
                  onChange={handleUnitCostChange}
                  inputProps={{
                    step: 0.1,
                    min: 0,
                    type: 'number',
                    'aria-labelledby': 'yield-slider',
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{yieldUnit}</InputAdornment>,
                  }}
                  sx={{ width: 120 }}
                />
              </Grid>
              <Grid item>
                <Tooltip title="Reset to original yield">
                  <IconButton onClick={handleReset} size="small">
                    <RestartAltIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              Original Yield: {originalYield} {yieldUnit}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Scale Factor: {(newYield / originalYield).toFixed(2)}x
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
              Cost Impact: 
              <span style={{ 
                color: costDifference > 0 ? '#d32f2f' : costDifference < 0 ? '#388e3c' : 'inherit',
                marginLeft: '8px'
              }}>
                {costDifference > 0 ? '+' : ''}{formatCurrency(costDifference)} 
                ({costPercentChange > 0 ? '+' : ''}{costPercentChange.toFixed(2)}%)
              </span>
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Typography variant="h6" gutterBottom>
            Ingredients
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Pack Size</TableCell>
                  <TableCell>Original Qty</TableCell>
                  <TableCell>New Qty</TableCell>
                  <TableCell>
                    Unit Cost
                    <Tooltip title="Edit unit costs to see how price changes affect the total">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>Total Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scaledIngredients.map((ingredient, index) => (
                  <TableRow key={index}>
                    <TableCell>{ingredient.code || '-'}</TableCell>
                    <TableCell>{ingredient.name || 'Unknown'}</TableCell>
                    <TableCell>{ingredient.pack_size || '-'}</TableCell>
                    <TableCell>{ingredient.original_quantity?.toFixed(2) || '-'} {ingredient.unit || 'kg'}</TableCell>
                    <TableCell>{ingredient.quantity?.toFixed(2) || '-'} {ingredient.unit || 'kg'}</TableCell>
                    <TableCell>
                      <TextField
                        value={ingredient.unit_cost || ''}
                        onChange={(e) => handleUnitCostChange(index, e.target.value)}
                        inputProps={{
                          step: 0.01,
                          min: 0,
                          type: 'number',
                        }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R</InputAdornment>,
                        }}
                        size="small"
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(ingredient.total_cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Total Recipe Cost: {formatCurrency(newTotalCost)}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              disabled={true} // Enable in phase 2 with backend integration
            >
              Save Scenario
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Cost Comparison</Typography>
              <Box>
                <Button 
                  size="small" 
                  variant={chartType === 'bar' ? 'contained' : 'outlined'} 
                  onClick={() => setChartType('bar')}
                  sx={{ mr: 1 }}
                >
                  Bar
                </Button>
                <Button 
                  size="small" 
                  variant={chartType === 'pie' ? 'contained' : 'outlined'} 
                  onClick={() => setChartType('pie')}
                >
                  Pie
                </Button>
              </Box>
            </Box>
            
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'bar' ? (
                <BarChart data={costComparisonData}>
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Cost (R)', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="cost" fill="#8884d8">
                    {costComparisonData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#8884d8' : (newTotalCost > originalTotalCost ? '#d32f2f' : '#388e3c')} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={ingredientCostData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ingredientCostData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
            
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              Note: This is a prototype for visualization purposes. Saving scenarios will be available in a future update.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecipeYieldCalculator;
