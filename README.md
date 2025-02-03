# Telegram Support Bot

A serverless Telegram bot that forwards customer inquiries to a support staff's Telegram chat.

## Features

- Receives messages from customers via Telegram bot
- Forwards messages to designated support staff
- Logs interactions in AWS CloudWatch
- Serverless architecture using AWS Lambda

## Prerequisites

- Node.js 18.x or later
- AWS Account and credentials
- Telegram Bot Token (from @BotFather)
- Support Staff's Telegram Chat ID

## Installation

Clone the repository:

    git clone <repository-url>

Install dependencies:

    npm install

## Configuration

1. Copy `.env.example` to `.env`
2. Configure environment variables:

   TELEGRAM_BOT_TOKEN=<your-bot-token>
   SUPPORT_CHAT_ID=<support-chat-id>
   AWS_ACCESS_KEY_ID=<aws-access-key>
   AWS_SECRET_ACCESS_KEY=<aws-secret-key>

## Development

Run locally:

    npm start

## Deployment

Deploy to AWS:

    npm run deploy

Set up Telegram webhook:

    curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_API_GATEWAY_URL>/webhook

## Project Structure

    ├── src/
    │   └── handler.ts         # Main Lambda function
    ├── .github/
    │   └── workflows/
    │       └── deploy.yml     # GitHub Actions workflow
    ├── .env.example          # Environment variables template
    ├── serverless.yml        # Serverless Framework config
    ├── tsconfig.json         # TypeScript config
    ├── .eslintrc.json       # ESLint config
    └── package.json         # Project dependencies

## Available Scripts

- `npm start`: Run locally with serverless offline
- `npm run deploy`: Deploy to AWS
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## License

MIT
