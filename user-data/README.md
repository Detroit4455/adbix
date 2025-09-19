# User Data Directory

This directory contains user-specific settings and data files organized by mobile number.

## Structure

```
user-data/
├── {mobileNumber}/
│   └── settings.json
└── README.md
```

## Settings File Format

The `settings.json` file contains business-specific configurations:

```json
{
  "beauty-salon": {
    "parlour_info": { ... },
    "contact_details": { ... },
    "services": [ ... ],
    "testimonials": [ ... ],
    "gallery_images": [ ... ]
  },
  "restaurant": {
    // Restaurant template data
  }
}
```

## Security Note

This directory should be properly secured and not exposed to public access. User data is organized by mobile number for easy retrieval and management.
