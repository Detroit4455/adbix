# Image Gallery Widget 🖼️

A beautiful, responsive sliding image gallery widget that can be embedded in any static HTML website. This widget displays different style categories with smooth transitions and interactive navigation. **Now with advanced customization and dynamic position management!**

## Features

- ✨ **Responsive Design**: Automatically adapts to different screen sizes
- 🎯 **Smooth Navigation**: Arrow buttons, dot indicators, and touch/swipe support
- 🖼️ **High-Quality Images**: Uses Unsplash images with automatic fallbacks
- 🎨 **Beautiful Styling**: Modern gradient backgrounds and smooth animations
- 📱 **Mobile Friendly**: Optimized for touch devices
- ⚡ **Fast Loading**: Optimized performance with lazy loading
- 🛠️ **Easy Embedding**: Simple iframe embed code
- 🔧 **Advanced Customization**: Add, edit, and delete your own gallery images
- 💾 **Database Storage**: All customizations are saved to your account
- 🔄 **Real-time Updates**: Changes appear instantly in your widget
- 📊 **Dynamic Position Management**: Control exact display order with position numbers

## Advanced Customization Features

### Gallery Management Dashboard
- **Add Custom Images**: Upload images via public URLs
- **Edit Existing Items**: Change titles, descriptions, and image URLs
- **Delete Items**: Remove unwanted gallery images
- **🆕 Position Control**: Set exact display order with position numbers
- **🆕 Quick Reordering**: Use ↑↓ buttons for instant position changes
- **Image Validation**: Automatic checking to ensure images load properly
- **Live Preview**: See changes instantly in the widget preview
- **Reset to Defaults**: Restore original gallery items anytime

### Custom Image Fields
- **Title**: Custom name for your gallery item
- **Description**: Detailed description of the style/image
- **Image URL**: Public URL to your image (https:// recommended)
- **Category**: Organize images by type (Party, Bridal, Urban, etc.)
- **🆕 Position**: Numeric position controlling display order (1, 2, 3, etc.)

### Position Management System
- **Dynamic Positioning**: Set any position number (1, 2, 3, etc.)
- **Automatic Reordering**: System automatically adjusts other items when positions change
- **Visual Indicators**: Clear position display with "Position: X" badges
- **Quick Controls**: ↑↓ buttons for easy position adjustments
- **Intelligent Insertion**: Add items at specific positions without manual reordering
- **Gap Handling**: System automatically fills gaps when items are deleted

## Default Gallery Styles

The widget comes with 5 pre-configured style categories:

1. **Party Ready** - Vibrant and festive party styles (Position: 1)
2. **Bridal Magic** - Graceful looks for special wedding days (Position: 2)
3. **Urban Chic** - Trendy modern city styles (Position: 3)
4. **Elegant Waves** - Soft and sophisticated hairstyles (Position: 4)
5. **Radiant Glow** - Natural radiant makeup looks (Position: 5)

## How to Use

### 1. Access the Widget

1. Log into your account at `/widgets`
2. You'll see the "Image Gallery" widget with a 🖼️ thumbnail
3. Click "Preview Widget" to see it in action
4. Click "Manage Widget" to customize your gallery

### 2. Customize Your Gallery

1. Click **"Manage Widget"** from the widgets page
2. Use the **"Add New Image"** button to add custom images
3. Fill in the required fields:
   - **Title**: Short, descriptive name
   - **Description**: Brief explanation of the style
   - **Image URL**: Direct link to your image
   - **Category**: Choose from predefined categories or "Custom"
   - **🆕 Position**: Set display order (1 = first, 2 = second, etc.)
4. Click **"Add Image"** (system will validate the URL)
5. **Edit** existing items by clicking the "Edit" button
6. **🆕 Reorder** items using ↑↓ buttons or edit position numbers
7. **Delete** items you no longer want
8. Use **"Reset to Defaults"** to restore original images

### 3. Position Management

**Setting Positions:**
- Enter any position number (1, 2, 3, etc.) when adding/editing items
- Position 1 = first image, Position 2 = second image, etc.
- System automatically handles conflicts and reordering

**Quick Reordering:**
- Use ↑ button to move item up one position
- Use ↓ button to move item down one position
- Changes save automatically and update the preview instantly

**How It Works:**
- When you set a position that's already taken, other items shift automatically
- When you delete an item, positions auto-adjust to fill gaps
- Items are always displayed in numerical order (1, 2, 3, 4, 5...)

### 4. Embed in Your Website

Copy the provided iframe code and paste it into your HTML:

```html
<iframe 
  src="http://localhost:3000/widget-preview/YOUR_MOBILE_NUMBER/image-gallery" 
  width="600" 
  height="400" 
  frameborder="0"
  style="border: none; border-radius: 12px;">
</iframe>
```

Replace `YOUR_MOBILE_NUMBER` with your actual mobile number.

### 5. Customize the Size

You can adjust the widget dimensions by modifying the `width` and `height` attributes:

```html
<!-- Small widget -->
<iframe src="..." width="400" height="250" ...></iframe>

<!-- Medium widget -->
<iframe src="..." width="600" height="400" ...></iframe>

<!-- Large widget -->
<iframe src="..." width="800" height="500" ...></iframe>

<!-- Full-width responsive -->
<div style="width: 100%; max-width: 1000px;">
  <iframe src="..." width="100%" height="400" ...></iframe>
</div>
```

## Position Management Examples

### Adding Items at Specific Positions

```
Current gallery: [1: Party, 2: Bridal, 3: Urban]
Add new item at position 2:
Result: [1: Party, 2: New Item, 3: Bridal, 4: Urban]
```

### Moving Items Up/Down

```
Current: [1: Party, 2: Bridal, 3: Urban]
Move "Bridal" down (↓):
Result: [1: Party, 2: Urban, 3: Bridal]
```

### Editing Positions

```
Current: [1: Party, 2: Bridal, 3: Urban]
Edit "Urban" position to 1:
Result: [1: Urban, 2: Party, 3: Bridal]
```

## Image Requirements & Tips

### Recommended Image Specifications
- **Format**: JPEG, PNG, WebP, or GIF
- **Size**: 800x600 pixels or larger (maintains quality)
- **Aspect Ratio**: 4:3 or 16:9 works best
- **File Size**: Under 2MB for fast loading
- **URL**: Must be publicly accessible (https:// preferred)

### Best Image Sources
- **Unsplash**: `https://images.unsplash.com/...`
- **Imgur**: `https://i.imgur.com/...`
- **Your own CDN/website**: `https://yourdomain.com/images/...`
- **Cloud storage**: Public links from Google Drive, Dropbox, etc.

### Image URL Examples
```
✅ Good URLs:
https://images.unsplash.com/photo-1234567890?w=800&h=600
https://i.imgur.com/abcd123.jpg
https://yourdomain.com/gallery/image1.jpg

❌ Avoid:
http://localhost/image.jpg (not publicly accessible)
file:///C:/Users/image.jpg (local file path)
www.example.com/private/image.jpg (requires authentication)
```

## Widget Management

### Live Preview
- Navigate to `/widgets/manage/YOUR_MOBILE_NUMBER/image-gallery`
- See real-time preview of your customized gallery
- Changes appear instantly as you edit
- Use the refresh button for manual updates
- **Position changes reflect immediately** in the preview

### Database Storage
All your customizations are stored securely in the database:
- Gallery items persist across sessions
- **Position data is preserved** and maintained
- Changes sync automatically to embedded widgets
- No risk of losing your custom images or ordering
- Account-specific data protection

## Technical Details

### Widget Specifications
- **Technology**: React with TypeScript
- **Styling**: Inline CSS with responsive design
- **Images**: Optimized loading with fallbacks
- **Performance**: Lazy loading and optimized animations
- **Compatibility**: Works in all modern browsers
- **Database**: MongoDB for storing custom gallery items and positions
- **🆕 Position Engine**: Intelligent position management system

### Navigation Features
- **Arrow Navigation**: Left/right arrow buttons
- **Dot Indicators**: Click to jump to specific slides
- **Touch Support**: Swipe gestures on mobile devices
- **Keyboard Support**: Arrow keys for navigation
- **Auto-loop**: Seamlessly loops from last to first slide
- **Smart Hiding**: Navigation hides when only one image
- **🆕 Position-Based Display**: Items always display in numerical order

### Responsive Breakpoints
- **Desktop**: Full features, 400px height
- **Tablet**: Optimized layout, 350px height
- **Mobile**: Touch-optimized, 300px height

### Data Management
- **CRUD Operations**: Create, Read, Update, Delete gallery items
- **🆕 Position Operations**: Set, move, reorder, auto-adjust positions
- **Image Validation**: Automatic URL validation before saving
- **Real-time Sync**: Changes appear instantly in embedded widgets
- **Error Handling**: Comprehensive error messages and fallbacks
- **Data Security**: User-specific data isolation
- **🆕 Position Integrity**: Automatic position conflict resolution

## Position Management API

The system provides robust position management:

### Position Rules
1. **Minimum Position**: 1 (cannot be less than 1)
2. **No Gaps**: System automatically fills gaps when items are deleted
3. **Auto-Increment**: New items get next available position by default
4. **Conflict Resolution**: Inserting at existing position shifts others down
5. **Validation**: Position changes are validated before saving

### Position Operations
- **Insert**: Add item at specific position, shift others as needed
- **Move**: Change item position, reorder others automatically
- **Delete**: Remove item, adjust remaining positions to fill gaps
- **Reorder**: Use ↑↓ buttons for quick adjacent swaps

## Use Cases

Perfect for:
- 💄 **Beauty Salons** - Showcase different makeup styles with custom ordering
- 💇 **Hair Salons** - Display various hairstyles in preferred sequence
- 👗 **Fashion Boutiques** - Show clothing collections in seasonal order
- 📸 **Photography Studios** - Display portfolio categories by priority
- 🎨 **Art Studios** - Showcase different art styles in chronological order
- 🏢 **Any Business** - Display product/service categories by importance
- 🏠 **Real Estate** - Property image galleries with featured listings first
- 🍕 **Restaurants** - Food photo galleries with signature dishes first

## Future Enhancements

Coming soon:
- 📤 **Direct File Upload**: Upload images directly (no URL needed)
- 🎨 **Theme Customization**: Custom colors and styling options
- 📊 **Click Analytics**: Track which images get the most views
- 🔗 **Custom Link Destinations**: Make images clickable
- 📱 **Enhanced Mobile Gestures**: Pinch to zoom, better touch controls
- 🔄 **Drag & Drop Reordering**: Visual drag and drop position management
- 🎵 **Background Music**: Optional ambient music for galleries
- 📋 **Bulk Import**: Import multiple images at once with position settings
- 🎯 **Position Templates**: Save and apply common position arrangements

## Troubleshooting

### Common Issues

**Image not loading:**
- Check if the URL is publicly accessible
- Ensure the URL starts with `https://` (not `http://`)
- Verify the image format is supported (JPEG, PNG, WebP, GIF)
- Test the URL in a new browser tab

**Position not updating:**
- Refresh the widget preview using the ↻ button
- Check that position numbers are valid (1 or greater)
- Ensure you clicked "Save Changes" after editing

**Changes not appearing:**
- Click the refresh button in the widget preview
- Check that you're logged into the correct account
- Ensure your mobile number matches the embed code

**Position conflicts:**
- The system automatically resolves conflicts
- If positions seem incorrect, try refreshing the page
- Use ↑↓ buttons for simple position adjustments

**Widget not embedding:**
- Verify the iframe code is copied correctly
- Check that your mobile number is in the URL
- Ensure your website allows iframe embedding

## Support

If you need help with the Image Gallery Widget:
1. Check the management dashboard for embed code
2. Test the preview URL in your browser
3. Ensure your mobile number is correct in the embed code
4. Verify iframe dimensions work with your website layout
5. Use the image validation feature to test URLs
6. **Try the ↑↓ position buttons** for quick reordering
7. **Check position numbers** in the management interface

## Example Implementation

See `test-gallery-widget.html` for a complete example of how to integrate the widget into a beauty salon website with proper styling and responsive design.

---

**Note**: Replace `YOUR_MOBILE_NUMBER` with your actual mobile number in all embed codes. The widget will automatically load your custom gallery images in the positions you've set, otherwise it displays the default styling categories.

## Changelog

### Version 2.1 - Dynamic Position Management
- 🆕 **Position Control**: Set exact display order with numeric positions
- 🆕 **Quick Reordering**: ↑↓ buttons for instant position changes
- 🆕 **Intelligent Positioning**: Automatic conflict resolution and gap filling
- 🆕 **Position Validation**: Ensures position integrity and prevents errors
- 🆕 **Visual Position Indicators**: Clear position badges in management interface
- 🆕 **Seamless Integration**: Position changes reflect instantly in widget preview

### Version 2.0 - Advanced Customization
- ✅ Added gallery management dashboard
- ✅ Custom image upload via URLs
- ✅ Edit and delete functionality
- ✅ Real-time preview updates
- ✅ Image URL validation
- ✅ Database storage for custom items
- ✅ Enhanced error handling and user feedback

### Version 1.0 - Initial Release
- ✅ Basic sliding gallery widget
- ✅ Default style categories
- ✅ Responsive design
- ✅ Embed functionality 