import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import type { FocusMode, UnlockQRCode } from '@/types';

const QR_STORAGE_KEY = 'focusvault_active_qr';
const QR_CODE_LENGTH = 32;

class QRUnlockService {
  async generateQRCode(
    sessionId: string,
    mode: FocusMode,
    expiresInMinutes: number = 60
  ): Promise<UnlockQRCode> {
    const code = this.generateSecureCode();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const qrData: UnlockQRCode = {
      sessionId,
      code,
      expiresAt,
      mode,
    };

    await supabase.from('qr_codes').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      session_id: sessionId,
      code,
      mode,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    await SecureStore.setItemAsync(QR_STORAGE_KEY, JSON.stringify(qrData));

    return qrData;
  }

  private generateSecureCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomValues = new Uint8Array(QR_CODE_LENGTH);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < QR_CODE_LENGTH; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    
    return result;
  }

  async validateQRCode(inputCode: string): Promise<{
    valid: boolean;
    sessionId?: string;
    mode?: FocusMode;
  }> {
    try {
      const { data: qrRecord, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('code', inputCode)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !qrRecord) {
        return { valid: false };
      }

      await supabase
        .from('qr_codes')
        .update({ is_active: false, used_at: new Date().toISOString() })
        .eq('id', qrRecord.id);

      await SecureStore.deleteItemAsync(QR_STORAGE_KEY);

      return {
        valid: true,
        sessionId: qrRecord.session_id,
        mode: qrRecord.mode as FocusMode,
      };
    } catch {
      return { valid: false };
    }
  }

  async getStoredQR(): Promise<UnlockQRCode | null> {
    try {
      const stored = await SecureStore.getItemAsync(QR_STORAGE_KEY);
      if (!stored) return null;

      const qrData = JSON.parse(stored) as UnlockQRCode;
      
      if (new Date(qrData.expiresAt) < new Date()) {
        await SecureStore.deleteItemAsync(QR_STORAGE_KEY);
        return null;
      }

      return qrData;
    } catch {
      return null;
    }
  }

  async invalidateQR(): Promise<void> {
    try {
      const stored = await this.getStoredQR();
      if (stored) {
        await supabase
          .from('qr_codes')
          .update({ is_active: false })
          .eq('session_id', stored.sessionId);
      }
    } catch {
    } finally {
      await SecureStore.deleteItemAsync(QR_STORAGE_KEY);
    }
  }

  formatQRForDisplay(code: string): string {
    return code.match(/.{1,4}/g)?.join(' ') || code;
  }

  parseQRInput(input: string): string {
    return input.replace(/\s/g, '').toUpperCase();
  }
}

export const qrUnlockService = new QRUnlockService();
