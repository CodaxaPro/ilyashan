/** Staff / field team member for scheduling. */
export interface StaffMember {
  id: string;
  name: string;
  color: string;
  active: boolean;
  /** ISO weekday 1=Mon … 6=Sat (no Sunday jobs in work week). */
  workDays: number[];
  maxJobsPerDay: number;
  /** Max concurrent jobs in same time slot (vormittag/nachmittag). */
  maxJobsPerSlot: number;
}

export interface StaffConfig {
  members: StaffMember[];
  /** When true, booking assigns least-loaded active staff automatically. */
  autoAssign: boolean;
  /** Team-wide fallback when no staff assigned on appointment. */
  teamMaxJobsPerDay: number;
  teamMaxJobsPerSlot: number;
  updatedAt?: string;
}
