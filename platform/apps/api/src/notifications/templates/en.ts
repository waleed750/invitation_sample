import type {NotificationTemplates} from './types';

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0] ?? '';
}

export const enTemplates: NotificationTemplates = {
  endReminder({invitationId, onlineUntil}) {
    const formattedDate = formatDate(onlineUntil);
    const subject = 'Reminder: Your invitation is ending soon';
    const text = `Hello,\n\nThis is a reminder that your invitation (${invitationId}) will expire on ${formattedDate}.\nIf you wish to extend the online visibility, you can renew it at any time from your account.\n\nThank you for choosing our platform.`;
    const html = `<div dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
  <h2 style="color: #111827;">Your invitation is ending soon</h2>
  <p>Hello,</p>
  <p>This is a friendly reminder that your invitation will expire on <strong>${formattedDate}</strong>.</p>
  <p>If you wish to extend the online visibility of your invitation, you can renew it at any time from your account dashboard.</p>
  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 24px;">Warm regards,<br>The Team</p>
</div>`;
    return {subject, text, html};
  },

  paymentConfirmed({orderId}) {
    const subject = 'Payment Confirmed Successfully';
    const text = `Hello,\n\nYour payment for order (${orderId}) has been confirmed successfully. Your invitation features are now fully unlocked.\n\nThank you for your order!`;
    const html = `<div dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
  <h2 style="color: #059669;">Payment Confirmed</h2>
  <p>Hello,</p>
  <p>Your payment for order <code>${orderId}</code> has been confirmed successfully.</p>
  <p>Your invitation and all entitlements are now active. You can now share it with your guests and manage RSVPs.</p>
  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 24px;">Warm regards,<br>The Team</p>
</div>`;
    return {subject, text, html};
  },

  paymentRejected({orderId, reason}) {
    const subject = 'Payment Verification Failed';
    const text = `Hello,\n\nUnfortunately, your payment for order (${orderId}) could not be confirmed.\nReason: ${reason}\n\nPlease check your payment details or contact our support team.`;
    const html = `<div dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
  <h2 style="color: #dc2626;">Payment Verification Failed</h2>
  <p>Hello,</p>
  <p>Unfortunately, your payment verification for order <code>${orderId}</code> was not successful.</p>
  <p style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; padding: 12px; color: #991b1b;">
    <strong>Reason:</strong> ${reason}
  </p>
  <p>Please review your payment submission or contact support if you believe this is an error.</p>
  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 24px;">Warm regards,<br>The Team</p>
</div>`;
    return {subject, text, html};
  },

  orderExpired({orderId}) {
    const subject = 'Your order has expired';
    const text = `Hello,\n\nYour pending order (${orderId}) has expired due to non-payment within the allowed timeframe.\n\nYou may place a new order at any time.`;
    const html = `<div dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
  <h2 style="color: #d97706;">Order Expired</h2>
  <p>Hello,</p>
  <p>Your pending order <code>${orderId}</code> has expired and was cancelled because payment was not received in time.</p>
  <p>You are welcome to submit a new order whenever you are ready.</p>
  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 24px;">Warm regards,<br>The Team</p>
</div>`;
    return {subject, text, html};
  }
};
