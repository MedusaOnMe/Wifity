# NeuralCanvas AI - System Documentation

## Overview

NeuralCanvas AI is a web application for AI-powered image generation. It allows users to create images from text prompts using OpenAI's DALL-E 3 API. The application features a modern UI with a React frontend and an Express backend, connected to a PostgreSQL database through Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a client-server architecture with clear separation of concerns:

1. **Frontend**: React application with a modern UI built using shadcn/ui components and Tailwind CSS for styling.
2. **Backend**: Express.js server that handles API requests, interacts with the database, and communicates with the OpenAI API.
3. **Database**: PostgreSQL database managed through Drizzle ORM for type-safe database operations.
4. **API Integration**: Integration with OpenAI's DALL-E 3 API for image generation.

### Technology Stack

- **Frontend**:
  - React for UI rendering
  - Tailwind CSS for styling
  - shadcn/ui for UI components
  - Wouter for client-side routing
  - TanStack Query for data fetching and state management
  
- **Backend**:
  - Express.js for the server
  - Drizzle ORM for database operations
  - OpenAI SDK for API communication
  
- **Database**:
  - PostgreSQL (through Drizzle)
  
- **Build & Dev Tools**:
  - Vite for frontend building and development
  - TypeScript for type safety
  - ESBuild for server-side bundling

## Key Components

### Backend Components

1. **Server Setup** (`server/index.ts`):
   - Express server initialization
   - Request logging middleware
   - Error handling

2. **Routes** (`server/routes.ts`):
   - API endpoints definition
   - Request validation
   - Response handling

3. **Storage** (`server/storage.ts`):
   - Database operations abstraction
   - Currently implemented as in-memory storage, but designed to be replaced with Drizzle/PostgreSQL

4. **OpenAI Integration** (`server/openai.ts`):
   - Handles communication with the OpenAI API
   - Provides error handling for API calls

### Frontend Components

1. **App Structure**:
   - Main App component (`client/src/App.tsx`)
   - Router setup with Wouter
   - ThemeProvider for dark/light theme support

2. **Pages**:
   - Home page with hero section and image generator
   - Gallery page to view generated images
   - Not Found page for invalid routes

3. **UI Components**:
   - A comprehensive set of UI components from shadcn/ui
   - Custom components like Header, Footer, ImageGenerator, etc.
   - AnimatedBackground for visual appeal

4. **Utilities**:
   - Query client setup for data fetching
   - Image utility functions (download, sharing)
   - Theme management

### Shared Components

1. **Database Schema** (`shared/schema.ts`):
   - Defines database tables structure
   - Provides validation schemas with Zod
   - Exports TypeScript types for type safety

## Data Flow

1. **Image Generation Flow**:
   - User enters a text prompt, selects options (size, quality, style)
   - Frontend sends request to `/api/images/generate` endpoint
   - Backend validates the request using Zod schemas
   - Backend calls OpenAI API to generate the image
   - Image URL and metadata are stored in the database
   - Response is sent back to the frontend
   - Frontend displays the generated image and updates the gallery

2. **Gallery View Flow**:
   - Frontend fetches images from `/api/images` endpoint
   - Backend retrieves images from the database
   - Frontend displays images in a grid layout
   - User can download or share images

## External Dependencies

The application depends on the following external services:

1. **OpenAI API**:
   - Used for image generation (DALL-E 3)
   - Requires an API key stored in the `OPENAI_API_KEY` environment variable

2. **PostgreSQL**:
   - Used for data persistence
   - Connection string is expected in the `DATABASE_URL` environment variable

## Deployment Strategy

The application is set up for deployment on Replit with:

1. **Build Process**:
   - Vite builds the frontend into static assets
   - ESBuild bundles the server code
   - Both outputs go to the `dist` directory

2. **Runtime**:
   - Node.js serves the Express application
   - Static assets are served from the `dist/public` directory
   - Environment variables must be set on the deployment platform

3. **Database**:
   - PostgreSQL database is provisioned through Replit
   - Drizzle handles schema migrations with `drizzle-kit`

## Development Workflow

1. **Development Mode**:
   - Run `npm run dev` to start the development server
   - Vite provides hot module replacement for frontend code
   - Server runs in development mode with live reloading

2. **Database Operations**:
   - Run `npm run db:push` to apply schema changes to the database
   - Drizzle will sync the database schema with the code definition

3. **Building for Production**:
   - Run `npm run build` to create production-ready bundles
   - Run `npm run start` to run the production server

## Current Implementation Status

1. **Implemented Features**:
   - Basic UI layout with theme support
   - Image generation form with OpenAI integration
   - Image display and gallery view
   - Backend API routes for image generation and fetching

2. **Pending Implementation**:
   - User authentication system
   - Persistent database storage with Drizzle/PostgreSQL (currently in-memory)
   - Image sharing capabilities
   - User dashboard for managing generated images

## Next Steps for Development

1. **Database Integration**:
   - Complete the Drizzle + PostgreSQL integration
   - Implement proper data persistence and migrations

2. **User Authentication**:
   - Add user registration and login functionality
   - Secure API routes for authenticated users only

3. **Enhanced Features**:
   - Add more AI model options
   - Implement additional image editing capabilities
   - Add social sharing features