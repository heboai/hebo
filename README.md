# Hebo Cloud

A modern web application built with Next.js, React, and TypeScript, featuring a beautiful UI powered by TailwindCSS and Shadcn components.

## 🚀 Features

- **Modern Tech Stack**: Built with Next.js 15, React 18, and TypeScript
- **Beautiful UI**: Styled with TailwindCSS and Shadcn components
- **Type Safety**: Full TypeScript support
- **Testing**: Jest and React Testing Library for comprehensive testing
- **Code Quality**: ESLint for code linting
- **Edge Deployment**: Server-side rendering at the edge using AWS Lambda@Edge
- **CI/CD**: Automated testing and linting with GitHub Actions

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 15
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **Component Library**: Shadcn
- **Language**: TypeScript
- **Testing**: Jest, React Testing Library
- **Deployment**: SST (Serverless Stack)
- **Infrastructure**: AWS (via SST)

## 🏗️ Development

### Prerequisites

- Node.js 20 or later
- npm or yarn
- AWS CLI configured (for deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hebo-cloud.git
   cd hebo-cloud
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx sst dev
   ```

The application will be available at `http://localhost:3000`.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🚀 Deployment

This project uses [SST](https://sst.dev) for deployment to AWS. SST provides a simple way to deploy serverless applications with infrastructure as code.

### Deployment Steps

1. Install SST CLI:
   ```bash
   npm install -g sst
   ```

2. Deploy to AWS:
   ```bash
   npx sst deploy --stage production
   ```

The deployment will:
- Set up AWS infrastructure using SST
- Configure CloudFront for edge deployment
- Deploy the Next.js application
- Set up Lambda@Edge for server-side rendering

## 🧪 Testing

The project uses Jest and React Testing Library for testing. Run tests using:

```bash
npm run test
```

For watch mode:
```bash
npm run test:watch
```

For coverage report:
```bash
npm run test:coverage
```

## 🔄 CI/CD

The project uses GitHub Actions for continuous integration and deployment:

- Linting and testing on every push to main and pull requests
- Automated deployment to AWS using SST
