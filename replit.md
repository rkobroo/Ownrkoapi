# Video Downloader & AI Analysis Platform

## Overview

This is a full-stack video downloader and AI analysis platform that extracts metadata, generates AI summaries, and provides download links for videos from multiple social media platforms including YouTube, TikTok, Instagram, Twitter/X, and Facebook. The application features a modern React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark mode)
- **Design System**: Comprehensive component library with consistent styling and accessibility features

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful API with structured error handling and response formatting
- **Rate Limiting**: In-memory rate limiting (100 requests per hour per IP) with plans for Redis in production
- **Request Logging**: Comprehensive logging middleware for API requests with response tracking
- **Video Processing**: Modular service architecture for video extraction and AI analysis

### Data Storage
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with full TypeScript support and schema validation
- **Database Schema**: 
  - `video_requests` table storing video metadata, AI summaries, and download links
  - JSON columns for complex data (thumbnails, author info, download links)
  - Automatic UUID generation for primary keys
- **Migrations**: Drizzle migrations with schema evolution support

### AI Integration
- **AI Service**: OpenAI GPT-4o integration for content analysis
- **Features**:
  - Main point extraction (5 key takeaways per video)
  - Concise summary generation (1-2 sentences)
  - Structured JSON responses with error handling
- **Fallback**: Graceful degradation when AI services are unavailable

### Video Processing Services
- **Platform Support**: Multi-platform video extractor supporting:
  - YouTube (youtube.com, youtu.be) - Full implementation with ytdl-core and oEmbed fallback
  - TikTok (tiktok.com) - oEmbed API integration
  - Instagram (instagram.com) - Basic metadata extraction
  - Twitter/X (twitter.com, x.com) - oEmbed API integration
  - Facebook (facebook.com) - Basic metadata extraction
- **Metadata Extraction**: Real video information including title, description, duration, thumbnails, view counts, and author details
- **URL Validation**: Robust URL parsing and platform detection
- **Download Links**: Dynamic download link generation based on current domain

### Authentication & Session Management
- **Session Storage**: PostgreSQL-based session storage with connect-pg-simple
- **User Management**: In-memory user storage with plans for database persistence
- **Security**: Secure session handling with proper cookie configuration

### Build & Deployment
- **Development**: Hot module replacement with Vite development server
- **Production Build**: Optimized builds with ESBuild for server-side code and Vite for client
- **Asset Management**: Proper static asset serving with development/production environment handling
- **Error Handling**: Runtime error overlay in development with Replit integration
- **Vercel Deployment**: Configured for serverless deployment with vercel.json and api/server.js
- **GitHub Integration**: Ready for GitHub repository upload and Vercel auto-deployment
- **Environment Variables**: OPENAI_API_KEY, NODE_ENV, VERCEL configuration for production

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database (development), in-memory storage for Vercel
- **AI Service**: OpenAI API for GPT-4o language model
- **Session Store**: PostgreSQL with connect-pg-simple adapter (development)
- **Deployment Platform**: Vercel serverless functions for production hosting

### Development Tools
- **Package Manager**: npm with lock file for dependency management
- **Build Tools**: Vite for frontend, ESBuild for backend compilation
- **Type Checking**: TypeScript with strict configuration across frontend, backend, and shared code

### UI & Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS for processing
- **Icons**: Lucide React for consistent iconography
- **Forms**: React Hook Form with Zod validation integration

### Utility Libraries
- **Validation**: Zod for runtime type validation and schema definition
- **Date Handling**: date-fns for date manipulation and formatting
- **HTTP Client**: Native fetch with custom query client wrapper
- **Carousel**: Embla Carousel for image/content carousels
- **Command Palette**: cmdk for search and command interfaces

### Development Environment
- **Platform**: Replit with custom development banner and cartographer integration
- **Error Handling**: Custom runtime error modal for development
- **Path Resolution**: Custom path aliases for clean imports (@, @shared, @assets)