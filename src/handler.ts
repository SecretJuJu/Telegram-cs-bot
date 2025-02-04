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
  photo?: Array<{
    file_id: string;
  }>;
  video?: {
    file_id: string;
  };
  document?: {
    file_id: string;
  };
  sticker?: {
    file_id: string;
  };
  caption?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
}

// AWS SDK 클라이언트 초기화
const logsClient = new CloudWatchLogsClient({ region: 'ap-northeast-2' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string);
const SUPPORT_CHAT_ID = process.env.SUPPORT_CHAT_ID as string;

const forwardMediaMessage = async (
  message: TelegramMessage
): Promise<string> => {
  let mediaInfo = '';

  if (message.photo) {
    // 가장 큰 해상도의 사진 선택
    const photo = message.photo[message.photo.length - 1];
    await bot.sendPhoto(SUPPORT_CHAT_ID, photo.file_id, {
      caption: message.caption,
    });
    mediaInfo = '📷 사진';
  } else if (message.video) {
    await bot.sendVideo(SUPPORT_CHAT_ID, message.video.file_id, {
      caption: message.caption,
    });
    mediaInfo = '🎥 비디오';
  } else if (message.document) {
    await bot.sendDocument(SUPPORT_CHAT_ID, message.document.file_id, {
      caption: message.caption,
    });
    mediaInfo = '📎 문서';
  } else if (message.sticker) {
    await bot.sendSticker(SUPPORT_CHAT_ID, message.sticker.file_id);
    mediaInfo = '😀 스티커';
  }

  return mediaInfo;
};

export const webhook = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}') as TelegramUpdate;

    if (body.message) {
      const { message } = body;

      // 지원팀이 보낸 답변 처리
      if (message.from.id.toString() === SUPPORT_CHAT_ID && message.text) {
        const match = message.text.match(/^@(\d+)\s+(.+)$/);
        if (match) {
          const [, userId, replyText] = match;
          await bot.sendMessage(userId, replyText);
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Reply sent' }),
          };
        }
      }

      // 사용자가 보낸 메시지 처리
      let mediaInfo = '';
      if (
        message.photo ||
        message.video ||
        message.document ||
        message.sticker
      ) {
        mediaInfo = await forwardMediaMessage(message);
      }

      const forwardMessage =
        '새로운 문의가 도착했습니다!' +
        '\n' +
        `보낸 사람: ${message.from.first_name} ${message.from.last_name || ''}` +
        '\n' +
        `사용자 ID: ${message.from.id}` +
        '\n' +
        (mediaInfo ? `미디어 타입: ${mediaInfo}\n` : '') +
        (message.caption ? `캡션: ${message.caption}\n` : '') +
        (message.text ? `메시지: ${message.text}` : '');

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
