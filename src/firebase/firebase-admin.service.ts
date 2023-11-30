import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private readonly adminApp: admin.app.App;

  constructor() {
    this.adminApp = admin.initializeApp({
      // Firebase Admin SDK 설정
      credential: admin.credential.applicationDefault(),
      // ...
    });
  }

  // FCM 토큰 가져오기 (사용자 ID를 기반으로)
  async getFCMToken(userId: string): Promise<string | null> {
    // 사용자 ID를 기반으로 FCM 토큰을 조회하는 로직 추가
    // ...

    // 조회한 토큰 반환 (또는 null)
    return null;
  }

  // FCM 푸시 알림 전송
  async sendFCMNotification(token: string, message: string) {
    const payload: admin.messaging.MessagingPayload = {
      notification: {
        title: '알림 제목',
        body: message,
      },
    };

    await this.adminApp.messaging().sendToDevice(token, payload);
  }
}
