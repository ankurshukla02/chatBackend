import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import * as fs from 'node:fs';

export const FIRESTORE = 'FIRESTORE';
export const firestoreProvider: Provider = {
  provide: FIRESTORE,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Firestore => {
    if (!getApps().length) {
      const serviceAccountPath = config.get<string>(
        'firebase.serviceAccountPath',
      );
      const app =
        serviceAccountPath && fs.existsSync(serviceAccountPath)
          ? initializeApp({
              credential: cert(
                JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')),
              ),
            })
          : initializeApp({ credential: applicationDefault() });
      return getFirestore(app);
    }
    return getFirestore();
  },
};
