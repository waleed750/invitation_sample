export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export interface EndReminderTemplateData {
  invitationId: string;
  onlineUntil: Date | string;
}

export interface PaymentConfirmedTemplateData {
  orderId: string;
}

export interface PaymentRejectedTemplateData {
  orderId: string;
  reason: string;
}

export interface OrderExpiredTemplateData {
  orderId: string;
}

export interface NotificationTemplates {
  endReminder(data: EndReminderTemplateData): RenderedEmail;
  paymentConfirmed(data: PaymentConfirmedTemplateData): RenderedEmail;
  paymentRejected(data: PaymentRejectedTemplateData): RenderedEmail;
  orderExpired(data: OrderExpiredTemplateData): RenderedEmail;
}
