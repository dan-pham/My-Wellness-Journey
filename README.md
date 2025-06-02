# Capstone Project - My Wellness Journey

## Overview
My Wellness Journey is a personalized health and wellness platform that combines the reliability of government health data (through MyHealthFinder and MedlinePlus APIs) with cutting-edge AI technology (powered by OpenAI) to provide users with tailored wellness recommendations and actionable health insights. The application transforms complex health information into easy-to-understand guidance, while its modern tech stack featuring Next.js, React, and MongoDB ensures a smooth, responsive user experience across all devices. With features like personalized health articles, AI-powered wellness suggestions, and secure user profiles, the platform demonstrates a practical application of modern web technologies to solve real-world health education challenges.

## Live Demo
[Check out the app - My Wellness Journey](https://my-wellness-journey.vercel.app/)

## Tech Stack
- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **APIs & Integrations**: OpenAI API with gpt-4o-mini, MyHealthFinder API, MedlinePlus API
- **Data Parsing**: xml-js (for XML to JSON conversion)
- **Caching & Performance**: Redis (for caching OpenAI results)
- **Security & Middleware**: CORS, dotenv, rate-limiting
- **Hosting**: Vercel
- **Testing**: Jest, React Testing Library

## Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** for code formatting
- **Babel** for JavaScript compilation
- **PostCSS** for CSS processing

## Features
- ✅ User authentication and authorization with JWT and bcryptjs
- ✅ Personalized health tips using OpenAI and government health APIs
- ✅ Real-time XML parsing with `xml-js` for structured health data
- ✅ API caching with Redis for performance optimization
- ✅ Environment configuration with dotenv
- ✅ API rate limiting with in-memory store for security
- ✅ Responsive design with Tailwind CSS
- ✅ Efficient state management with Zustand
- ✅ Real-time notifications with react-hot-toast

## Planning Documents
- [Project Ideas](./planning/Capstone%20Project%20Ideas.pdf)
- [Final Project Proposal](./planning/Project%20Proposal.pdf)
- [Frontend Planning](./planning/User%20Flow%20Diagrams.pdf)
- [Database Model Planning](./planning/Database%20Model%20Diagram.pdf)
- [API Planning](./planning/API.pdf)


## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account or local MongoDB instance

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dan-pham/My-Wellness-Journey.git
   cd my-wellness-journey
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the environment variables with your configuration

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure
```
src/
├── app/               # Next.js app directory and API routes
├── components/        # Reusable UI components
├── config/            # Application configuration
├── lib/               # Utility functions and API clients
├── middleware/        # Authentication and API middleware
├── models/            # MongoDB models and schemas
├── stores/            # Zustand state management stores
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
```

## Testing
Tests are written using Jest and React Testing Library. To run tests:

```bash
# Run all tests
npm test
```
