# CLEENTRAC Landing Page

A professional landing page for **CLEENTRAC** - Food Safety & Production Compliance Management System.

## 📁 Package Contents

This folder contains all the files needed to deploy the CLEENTRAC landing page:

### Core Files
- `index.html` - Main HTML structure with CLEENTRAC branding and content
- `styles.css` - Complete CSS styling with responsive design
- `script.js` - JavaScript functionality for forms, mobile menu, and interactions

### Assets
- `piechart_icon.svg` - Material UI pie chart icon used as favicon and logo
- `❤️code.png` - DevHouse logo for footer attribution

## 🎨 Features

### Design & Branding
- **Modern glassmorphism design** with backdrop blur effects
- **CLEENTRAC branding** with pie chart icon throughout
- **Responsive layout** optimized for desktop, tablet, and mobile
- **Professional color scheme** with primary blue (#2563eb) accent
- **Smooth animations** and hover effects

### Content Sections
1. **Hero Section** - Main value proposition and call-to-action
2. **Features Accordion** - Interactive showcase of key capabilities
3. **Complete Traceability Journey** - Step-by-step workflow explanation
4. **Waitlist Form** - Lead capture with EmailJS integration
5. **Call-to-Action** - Secondary conversion section
6. **Footer** - Branding and contact information

### Technical Features
- **EmailJS Integration** - Functional contact form with email notifications
- **Mobile-first responsive design**
- **Accessibility features** - Proper ARIA labels and keyboard navigation
- **SEO optimized** - Semantic HTML structure and meta tags
- **Fast loading** - Optimized CSS and minimal dependencies

## 🚀 Quick Setup

1. **Upload all files** to your web server
2. **Update EmailJS configuration** in `script.js` (lines 3 and 55-56)
3. **Customize email addresses** in `index.html` (replace `demo@cleentrac.co.za`)
4. **Test contact form** functionality

## 📧 Email Configuration

The contact form uses EmailJS for email delivery. To configure:

1. Create an account at [EmailJS.com](https://www.emailjs.com/)
2. Update the service ID and template ID in `script.js`:
   ```javascript
   emailjs.init("YOUR_PUBLIC_KEY");
   emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', formData)
   ```
3. Update email addresses in the contact links throughout `index.html`

## 🔧 Customization

### Colors
Update CSS variables in `styles.css` (lines 1-13):
```css
:root {
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    /* ... other colors */
}
```

### Content
All content can be modified directly in `index.html`:
- Hero headline and description
- Feature descriptions
- Workflow steps
- Contact information

### Logo/Icon
Replace `piechart_icon.svg` with your own logo while maintaining the same filename.

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

Internal project - not licensed for external distribution.

---

**Built for CLEENTRAC** - Food Safety & Production Compliance Management
*Transforming food safety management through technology*
