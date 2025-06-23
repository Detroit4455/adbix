import { NextResponse } from 'next/server';

export async function GET() {
  // Sample config.json content
  const sampleConfig = {
    "index.html": {
      "siteTitle": "Dynamic Menu Site",
      "font": "Montserrat",
      "backgroundColor": "#f0f6ff",
      "textColor": "#222e3a",
      "headerColor": "#26408b",
      "headerTextColor": "#fff",
      "components": [
        {
          "name": "Welcome Banner",
          "content": "Welcome to our dynamic site! Menu and components load from JSON."
        },
        {
          "name": "Feature Card",
          "content": "This card is loaded from <code>config.json</code>."
        }
      ]
    },
    "about.html": {
      "siteTitle": "About Us",
      "font": "Roboto",
      "backgroundColor": "#fff8e7",
      "textColor": "#523100",
      "headerColor": "#e8b24a",
      "headerTextColor": "#fff",
      "components": [
        {
          "name": "About Section",
          "content": "We are a team dedicated to building dynamic, data-driven websites."
        },
        {
          "name": "Contact Info",
          "content": "Email us at <a href='mailto:info@example.com'>info@example.com</a>."
        }
      ]
    },
    "contact.html": {
      "siteTitle": "Contact Page",
      "font": "Arial",
      "backgroundColor": "#eef6ff",
      "textColor": "#2a3b5a",
      "headerColor": "#6f8ad6",
      "headerTextColor": "#fff",
      "components": [
        {
          "name": "Contact Form",
          "content": "Fill out the form below and we'll get back to you soon."
        }
      ]
    }
  };

  // Return as downloadable JSON file
  return new NextResponse(JSON.stringify(sampleConfig, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="sample-config.json"',
    },
  });
} 