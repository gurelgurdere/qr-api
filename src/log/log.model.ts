export interface ServiceUsageLog {
  serviceUsageLogId?: number;
  serviceName: string;
  serviceData?: string;
  userId?: number;
  usageTime: Date;
  resultMessage?: string;
}
