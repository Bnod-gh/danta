# Danta

Danta is a multi-tenant Dental Practice Management SaaS designed to streamline clinical and administrative workflows for dental practices.

## 🚀 Project Structure

Danta is built as a monorepo using **Turborepo** and **pnpm**, allowing for shared logic and efficient builds across multiple applications.

### 📱 Applications (`/apps`)
- **`api`**: The core backend service built with NestJS, handling business logic, data persistence, and API endpoints.
- **`web`**: The administrative and clinical frontend dashboard.
- **`mobile`**: The mobile application for practitioners and staff.
- **`identity`**: Dedicated identity and access management service.
- **`gateway`**: API Gateway for routing and request orchestration.
- **`practice`**: Specialized practice management modules.
- **`worker`**: Background job processing and asynchronous tasks.

### 📦 Packages (`/packages`)
- **`database`**: Centralized database schema, migrations, and Prisma client.
- **`ui`**: Shared UI component library (based on Radix UI and Tailwind CSS).

## 🛠 Tech Stack

- **Monorepo Tooling**: [Turborepo](https://turbo.build/), [pnpm](https://pnpm.io/)
- **Backend**: [NestJS](https://nestjs.com/), [Prisma](https://www.prisma.io/)
- **Frontend**: React, [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🏁 Getting Started

### Prerequisites
- Node.js $\ge$ 20.0.0
- pnpm $\ge$ 10.0.0

### Installation
```bash
pnpm install
```

### Development
Run the entire stack in development mode:
```bash
pnpm dev
```

Alternatively, run specific services:
```bash
pnpm dev:api    # Start the API
pnpm dev:web    # Start the Web frontend
pnpm dev:worker # Start the Worker
```

### Database Setup
```bash
pnpm db:generate # Generate Prisma client
pnpm db:migrate  # Apply migrations
pnpm db:seed     # Seed the database with initial data
```

## 🧪 Testing & Quality
- **Linting**: `pnpm lint`
- **Typechecking**: `pnpm typecheck`
- **Testing**: `pnpm test` (Unit and Integration tests)

## 📜 License
Private - All rights reserved.
