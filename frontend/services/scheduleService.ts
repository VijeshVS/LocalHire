import { API_BASE_URL } from './api';
import { getToken } from './authService';

export interface ScheduleConflict {
  application_id: string;
  job_posting_id: string;
  job_title: string;
  status: string;
  work_status: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  conflicting_application_ids: string[];
  has_conflicts: boolean;
  can_confirm: boolean;
}

export interface ScheduleDay {
  date: string;
  jobs: ScheduleConflict[];
  has_conflicts: boolean;
}

const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  
  return data;
};

/**
 * Get worker's schedule organized by date
 */
export const getWorkerSchedule = async (): Promise<ScheduleDay[]> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/job-applications/my-applications-with-conflicts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const applications = await handleResponse(response);

  // Filter to only show accepted jobs with schedule info
  const scheduledJobs = applications.filter((app: any) => 
    app.status === 'accepted' &&
    app.work_status !== 'completed' &&
    app.job_postings?.scheduled_date
  );

  // Group by date
  const groupedByDate = scheduledJobs.reduce((acc: any, app: any) => {
    const date = app.job_postings.scheduled_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    
    acc[date].push({
      application_id: app.id,
      job_posting_id: app.job_posting_id,
      job_title: app.job_postings.title,
      status: app.status,
      work_status: app.work_status,
      scheduled_date: app.job_postings.scheduled_date,
      scheduled_start_time: app.job_postings.scheduled_start_time,
      scheduled_end_time: app.job_postings.scheduled_end_time,
      conflicting_application_ids: app.conflicting_application_ids || [],
      has_conflicts: app.has_conflicts || false,
      can_confirm: app.can_confirm !== false,
    });
    
    return acc;
  }, {});

  // Convert to array and sort by date
  const schedule: ScheduleDay[] = Object.keys(groupedByDate)
    .sort()
    .map(date => ({
      date,
      jobs: groupedByDate[date].sort((a: any, b: any) => 
        a.scheduled_start_time.localeCompare(b.scheduled_start_time)
      ),
      has_conflicts: groupedByDate[date].some((job: any) => job.has_conflicts),
    }));

  return schedule;
};

/**
 * Get conflicts for a specific date
 */
export const getConflictsForDate = async (date: string): Promise<ScheduleConflict[]> => {
  const schedule = await getWorkerSchedule();
  const day = schedule.find(d => d.date === date);
  
  if (!day) {
    return [];
  }
  
  return day.jobs.filter(job => job.has_conflicts);
};

/**
 * Check if worker has any schedule conflicts
 */
export const hasAnyConflicts = async (): Promise<boolean> => {
  const schedule = await getWorkerSchedule();
  return schedule.some(day => day.has_conflicts);
};

/**
 * Get upcoming schedule (next 7 days)
 */
export const getUpcomingSchedule = async (): Promise<ScheduleDay[]> => {
  const schedule = await getWorkerSchedule();
  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(today.getDate() + 7);
  
  return schedule.filter(day => {
    const date = new Date(day.date);
    return date >= today && date <= next7Days;
  });
};

/**
 * Format time for display
 */
export const formatTime = (time: string): string => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: string): string => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Get conflict warning message
 */
export const getConflictMessage = (conflicts: ScheduleConflict[]): string => {
  if (conflicts.length === 0) return '';
  if (conflicts.length === 1) return 'You have 1 scheduling conflict';
  return `You have ${conflicts.length} scheduling conflicts`;
};
