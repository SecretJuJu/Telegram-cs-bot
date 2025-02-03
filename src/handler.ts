import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import TelegramBot from 'node-telegram-bot-api';

interface TelegramMessage {
  from: {
    first_name: string;
    last_name?: string;
    id: number;
  };
  text?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
}

// AWS SDK 클라이언트 초기화
const logsClient = new CloudWatchLogsClient({ region: 'ap-northeast-2' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string);
const SUPPORT_CHAT_ID = process.env.SUPPORT_CHAT_ID as string;

export const webhook = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}') as TelegramUpdate;

    if (body.message) {
      const { message } = body;
      const forwardMessage =
        '새로운 문의가 도착했습니다!' +
        '\n' +
        `보낸 사람: ${message.from.first_name} ${message.from.last_name || ''}` +
        '\n' +
        `사용자 ID: ${message.from.id}` +
        '\n' +
        `메시지: ${message.text || '(텍스트 없음)'}`;

      await bot.sendMessage(SUPPORT_CHAT_ID, forwardMessage);

      // 예시: CloudWatch에 로그 추가
      try {
        await logsClient.send(
          new PutLogEventsCommand({
            logGroupName: '/aws/lambda/telegram-support-bot',
            logStreamName: new Date().toISOString().split('T')[0],
            logEvents: [
              {
                timestamp: Date.now(),
                message: `New message from user ${body.message.from.id}`,
              },
            ],
          })
        );
      } catch (logError) {
        console.error('Logging error:', logError);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'OK' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
