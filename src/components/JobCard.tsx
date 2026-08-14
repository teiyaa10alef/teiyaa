import { Link } from "@tanstack/react-router";
import { Briefcase, MapPin, Users } from "lucide-react";
import {
  formatSalary,
  jobAreaEmoji,
  jobAreaLabel,
  JOB_CONTRACT_LABELS,
  JOB_WORK_MODE_LABELS,
  timeAgo,
  type Job,
} from "@/lib/jobs-api";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link
      to="/vagas/$jobId"
      params={{ jobId: job.id }}
      className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-2 hover:border-cat-vaga/50 transition-colors"
    >
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="px-2 py-0.5 rounded-full bg-cat-vaga-soft text-cat-vaga border border-cat-vaga/25 font-semibold">
          {jobAreaEmoji(job.area)} {jobAreaLabel(job.area)}
        </span>
        <span className="px-2 py-0.5 rounded-full border border-border text-muted-foreground font-semibold">
          {JOB_CONTRACT_LABELS[job.contract_type]}
        </span>
        <span className="px-2 py-0.5 rounded-full border border-border text-muted-foreground font-semibold">
          {JOB_WORK_MODE_LABELS[job.work_mode]}
        </span>
      </div>

      <h3 className="font-bold leading-tight line-clamp-2">{job.title}</h3>
      {job.company_name && (
        <p className="text-sm font-semibold text-muted-foreground inline-flex items-center gap-1.5">
          <Briefcase className="size-3.5" /> {job.company_name}
        </p>
      )}
      <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

      <p className="text-lg font-bold text-cat-vaga">{formatSalary(job)}</p>

      <div className="mt-auto pt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        {job.community?.name && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {job.community.name}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" /> {job.applications_count}{" "}
          {job.applications_count === 1 ? "candidato" : "candidatos"}
        </span>
        <span className="ml-auto">{timeAgo(job.created_at)}</span>
      </div>
    </Link>
  );
}
