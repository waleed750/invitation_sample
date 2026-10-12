import {arTemplates, enTemplates} from './templates';

describe('Notification email templates', () => {
  const onlineUntil = new Date('2026-12-31T12:00:00.000Z');
  const orderId = '12345678-1234-4000-8000-123456789abc';
  const invitationId = 'inv-test-id';
  const reason = 'Invalid transfer receipt';

  describe('Arabic templates (ar)', () => {
    it('renders endReminder with RTL layout and Arabic text', () => {
      const email = arTemplates.endReminder({invitationId, onlineUntil});
      expect(email.subject).toContain('تذكير');
      expect(email.text).toContain(invitationId);
      expect(email.text).toContain('2026-12-31');
      expect(email.html).toContain('dir="rtl"');
      expect(email.html).toContain('2026-12-31');
    });

    it('renders paymentConfirmed with RTL layout and order ID', () => {
      const email = arTemplates.paymentConfirmed({orderId});
      expect(email.subject).toContain('تم تأكيد الدفع');
      expect(email.text).toContain(orderId);
      expect(email.html).toContain('dir="rtl"');
      expect(email.html).toContain(orderId);
    });

    it('renders paymentRejected with RTL layout, order ID, and reason', () => {
      const email = arTemplates.paymentRejected({orderId, reason});
      expect(email.subject).toContain('تعذر تأكيد الدفع');
      expect(email.text).toContain(orderId);
      expect(email.text).toContain(reason);
      expect(email.html).toContain('dir="rtl"');
      expect(email.html).toContain(reason);
    });

    it('renders orderExpired with RTL layout and order ID', () => {
      const email = arTemplates.orderExpired({orderId});
      expect(email.subject).toContain('انتهت');
      expect(email.text).toContain(orderId);
      expect(email.html).toContain('dir="rtl"');
      expect(email.html).toContain(orderId);
    });
  });

  describe('English templates (en)', () => {
    it('renders endReminder with LTR layout and English text', () => {
      const email = enTemplates.endReminder({invitationId, onlineUntil});
      expect(email.subject).toContain('Reminder');
      expect(email.text).toContain(invitationId);
      expect(email.text).toContain('2026-12-31');
      expect(email.html).toContain('dir="ltr"');
      expect(email.html).toContain('2026-12-31');
    });

    it('renders paymentConfirmed with LTR layout and order ID', () => {
      const email = enTemplates.paymentConfirmed({orderId});
      expect(email.subject).toContain('Payment Confirmed');
      expect(email.text).toContain(orderId);
      expect(email.html).toContain('dir="ltr"');
      expect(email.html).toContain(orderId);
    });

    it('renders paymentRejected with LTR layout, order ID, and reason', () => {
      const email = enTemplates.paymentRejected({orderId, reason});
      expect(email.subject).toContain('Payment Verification Failed');
      expect(email.text).toContain(orderId);
      expect(email.text).toContain(reason);
      expect(email.html).toContain('dir="ltr"');
      expect(email.html).toContain(reason);
    });

    it('renders orderExpired with LTR layout and order ID', () => {
      const email = enTemplates.orderExpired({orderId});
      expect(email.subject).toContain('order has expired');
      expect(email.text).toContain(orderId);
      expect(email.html).toContain('dir="ltr"');
      expect(email.html).toContain(orderId);
    });
  });
});
