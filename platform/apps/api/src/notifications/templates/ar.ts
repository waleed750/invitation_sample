import type {NotificationTemplates} from './types';

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0] ?? '';
}

export const arTemplates: NotificationTemplates = {
  endReminder({invitationId, onlineUntil}) {
    const formattedDate = formatDate(onlineUntil);
    const subject = 'تذكير: اقتراب موعد انتهاء صلاحية دعوتك';
    const text = `مرحبًا،\n\nنود تذكيرك بأن دعوتك (${invitationId}) ستنتهي صلاحيتها في ${formattedDate}.\nإذا كنت ترغب في تمديد ظهور الدعوة، يمكنك تجديدها من خلال حسابك.\n\nشكرًا لاستخدامك منصتنا.`;
    const html = `<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
  <h2 style="color: #111827;">تذكير باقتراب انتهاء الدعوة</h2>
  <p>مرحبًا،</p>
  <p>نود تذكيرك بأن دعوتك ستنتهي صلاحيتها بتاريخ <strong>${formattedDate}</strong>.</p>
  <p>إذا كنت ترغب في تمديد فترة ظهور الدعوة، يمكنك التجديد في أي وقت من خلال لوحة التحكم.</p>
  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 24px;">مع تحيات فريق العمل</p>
</div>`;
    return {subject, text, html};
  },

  paymentConfirmed({orderId}) {
    const subject = 'تم تأكيد الدفع بنجاح';
    const text = `مرحبًا،\n\nتم تأكيد استلام دفعتك للطلب (${orderId}) بنجاح، وتم تفعيل دعوتك ومميزاتها بالكامل.\n\nشكرًا لثقتك بنا!`;
    const html = `<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
  <h2 style="color: #059669;">تم تأكيد الدفع بنجاح</h2>
  <p>مرحبًا،</p>
  <p>تم استلام وتأكيد دفعتك للطلب رقم <code>${orderId}</code> بنجاح.</p>
  <p>تم تفعيل دعوتك ومميزاتها بالكامل، ويمكنك الآن مشاركتها مع ضيوفك ومتابعة الردود.</p>
  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 24px;">مع تحيات فريق العمل</p>
</div>`;
    return {subject, text, html};
  },

  paymentRejected({orderId, reason}) {
    const subject = 'تعذر تأكيد الدفع للطلب';
    const text = `مرحبًا،\n\nنأسف لإبلاغك بأنه تعذر تأكيد عملية الدفع للطلب (${orderId}).\nسبب الرفض: ${reason}\n\nيرجى مراجعة تفاصيل التحويل أو التواصل مع فريق الدعم للمساعدة.`;
    const html = `<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
  <h2 style="color: #dc2626;">تعذر تأكيد الدفع</h2>
  <p>مرحبًا،</p>
  <p>نأسف لإبلاغك بأنه تعذر تأكيد عملية الدفع للطلب رقم <code>${orderId}</code>.</p>
  <p style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; padding: 12px; color: #991b1b;">
    <strong>السبب:</strong> ${reason}
  </p>
  <p>يرجى التأكد من تفاصيل التحويل أو إعادة المحاولة، كما يسعدنا مساعدتك عبر فريق الدعم.</p>
  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 24px;">مع تحيات فريق العمل</p>
</div>`;
    return {subject, text, html};
  },

  orderExpired({orderId}) {
    const subject = 'انتهت مهلة سداد الطلب';
    const text = `مرحبًا،\n\nنود إبلاغك بأن مهلة سداد الطلب (${orderId}) قد انتهت، وتم إلغاء الطلب تلقائيًا.\n\nيمكنك إنشاء طلب جديد في أي وقت من خلال المنصة.`;
    const html = `<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px;">
  <h2 style="color: #d97706;">انتهت صلاحية الطلب</h2>
  <p>مرحبًا،</p>
  <p>نود إبلاغك بأن مهلة سداد الطلب رقم <code>${orderId}</code> قد انتهت وتم إلغاؤه تلقائيًا لعدم استلام السداد في الوقت المحدد.</p>
  <p>يمكنك إنشاء طلب جديد في أي وقت عبر الموقع.</p>
  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 24px;">مع تحيات فريق العمل</p>
</div>`;
    return {subject, text, html};
  }
};
