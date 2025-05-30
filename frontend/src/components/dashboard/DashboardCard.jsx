import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

/**
 * A reusable card component for dashboard sections
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon to display in the card header
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {Array} props.tags - Array of tag objects with label and color properties
 * @param {Object} props.sx - Additional styles to apply to the card
 * @param {React.ReactNode} props.children - Additional content to render inside the card
 */
function DashboardCard({ icon, title, description, tags = [], sx = {}, children }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', ...sx }}>
      <CardContent>
        {(icon || title) && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon && React.cloneElement(icon, { sx: { mr: 1 } })}
            {title && <Typography variant="h6">{title}</Typography>}
          </Box>
        )}
        
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}
        
        {tags.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag.label}
                size="small"
                color={tag.color || "default"}
                variant={tag.variant || "outlined"}
              />
            ))}
          </Box>
        )}
        
        {children}
      </CardContent>
    </Card>
  );
}

export default DashboardCard;
