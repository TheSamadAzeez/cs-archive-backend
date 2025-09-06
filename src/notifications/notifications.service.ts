import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dtos/notification.dto';
import { DrizzleService } from 'src/database/drizzle.service';
import { notifications } from 'src/database/schema';
import { and, count, desc, eq } from 'drizzle-orm';

export enum NotificationType {
  STUDENT_CREATED = 'student_created',
  SUPERVISOR_ASSIGNED = 'supervisor_assigned',
  TASK_ASSIGNED = 'task_assigned',
  TASK_SUBMITTED = 'task_submitted',
  TASK_REVIEWED = 'task_reviewed',
  TASK_APPROVED = 'task_approved',
  TASK_REJECTED = 'task_rejected',
  PROJECT_SUBMITTED = 'project_submitted',
  SCHEDULE_CREATED = 'schedule_created',
}

@Injectable()
export class NotificationsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async createNotification(userId: number, userType: 'student' | 'supervisor', type: NotificationType, title: string, message: string, relatedId?: number, relatedType?: string) {
    await this.drizzle.db.insert(notifications).values({
      userId,
      userType,
      type,
      title,
      message,
      relatedId,
      relatedType,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getNotifications(userId: number, userType: 'student' | 'supervisor') {
    return this.drizzle.db.query.notifications.findMany({
      where: and(eq(notifications.userId, userId), eq(notifications.userType, userType)),
      orderBy: [desc(notifications.createdAt)],
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    await this.drizzle.db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async getUnreadCount(userId: number, userType: 'student' | 'supervisor') {
    const result = await this.drizzle.db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.userType, userType), eq(notifications.isRead, false)));
    return Number(result[0]?.count || 0);
  }

  createNotificationWithDto(createNotificationDto: CreateNotificationDto) {
    return this.createNotification(
      createNotificationDto.userId,
      createNotificationDto.userType,
      createNotificationDto.type,
      createNotificationDto.title,
      createNotificationDto.message,
      createNotificationDto.relatedId,
      createNotificationDto.relatedType,
    );
  }
}
