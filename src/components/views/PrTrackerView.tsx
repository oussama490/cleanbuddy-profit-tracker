"use client";

import { deleteJob, saveJob, savePrCriteria } from "@/app/actions/life";
import { usePrefs } from "@/components/PrefsProvider";
import { EmptyState, ExtrasBanner, KpiCard, PageHeader, Section } from "@/components/ui";
import { formatDisplayDate, formatNumber, todayIsoDate } from "@/lib/format";
import {
  estimateCrs,
  EXPERIENCE_HOURS_TARGET,
  EXPERIENCE_MONTHS_TARGET,
  jobDurationMonths,
  jobHoursWorked,
  jobIsQualifying,
  summarizeExperience,
} from "@/lib/life";
import type {
  Currency,
  EducationLevel,
  Job,
  JobStatus,
  PrCriteria,
  TeerLevel,
} from "@/lib/types";
import { EDUCATION_LEVELS, JOB_STATUSES, TEER_LEVELS } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";

const CLB_OPTIONS = Array.from({ length: 13 }, (_, index) => index);

const emptyJobForm = {
  job_title: "",
  employer: "",
  start_date: todayIsoDate(),
  end_date: "",
  stillThere: true,
  noc_code: "",
  teer: "3" as TeerLevel,
  hours_per_week: "30",
  hourly_wage: "",
  annual_salary: "",
  wage_currency: "CAD" as Currency,
  status: "active" as JobStatus,
  notes: "",
};

export function PrTrackerView({
  jobs,
  criteria,
  lifeReady,
}: {
  jobs: Job[];
  criteria: PrCriteria | null;
  lifeReady: boolean;
}) {
  const { t } = usePrefs();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [editJobId, setEditJobId] = useState<string | null>(null);
  const [age, setAge] = useState(String(criteria?.age || ""));
  const [education, setEducation] = useState<EducationLevel>(criteria?.education_level ?? "bachelor");
  const [frenchClb, setFrenchClb] = useState(String(criteria?.french_clb ?? 7));
  const [englishClb, setEnglishClb] = useState(String(criteria?.english_clb ?? 5));
  const [status, setStatus] = useState(criteria?.current_status ?? "pgwp");
  const [overrideMonths, setOverrideMonths] = useState(
    criteria?.experience_months_override != null ? String(criteria.experience_months_override) : "",
  );
  const [simMonths, setSimMonths] = useState("0");
  const [simFrench, setSimFrench] = useState(String(criteria?.french_clb ?? 7));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const experience = useMemo(
    () =>
      summarizeExperience(jobs, {
        ...(criteria ?? {
          id: "",
          age: 0,
          education_level: education,
          french_clb: Number(frenchClb) || 0,
          english_clb: Number(englishClb) || 0,
          experience_months_override: null,
          current_status: status,
          notes: "",
          created_at: "",
          updated_at: "",
        }),
        experience_months_override: overrideMonths === "" ? null : Number(overrideMonths),
      }),
    [jobs, criteria, education, frenchClb, englishClb, status, overrideMonths],
  );

  const currentScore = estimateCrs({
    age: Number(age) || 0,
    education,
    frenchClb: Number(frenchClb) || 0,
    englishClb: Number(englishClb) || 0,
    experienceMonths: experience.monthsUsed,
  });

  const simulatedScore = estimateCrs({
    age: Number(age) || 0,
    education,
    frenchClb: Number(simFrench) || 0,
    englishClb: Number(englishClb) || 0,
    experienceMonths: experience.monthsUsed + (Number(simMonths) || 0),
  });

  const scoreDelta = simulatedScore.total - currentScore.total;

  function resetJobForm() {
    setJobForm(emptyJobForm);
    setEditJobId(null);
  }

  function loadJob(job: Job) {
    setEditJobId(job.id);
    setJobForm({
      job_title: job.job_title,
      employer: job.employer,
      start_date: job.start_date,
      end_date: job.end_date ?? "",
      stillThere: job.status === "active" && !job.end_date,
      noc_code: job.noc_code,
      teer: job.teer,
      hours_per_week: String(job.hours_per_week || ""),
      hourly_wage: job.hourly_wage ? String(job.hourly_wage) : "",
      annual_salary: job.annual_salary ? String(job.annual_salary) : "",
      wage_currency: job.wage_currency,
      status: job.status,
      notes: job.notes,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSaveJob(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      setError(null);
      const result = await saveJob({
        id: editJobId || undefined,
        job_title: jobForm.job_title,
        employer: jobForm.employer,
        start_date: jobForm.start_date,
        end_date: jobForm.stillThere ? null : jobForm.end_date || null,
        noc_code: jobForm.noc_code,
        teer: jobForm.teer,
        hours_per_week: Number(jobForm.hours_per_week) || 0,
        hourly_wage: Number(jobForm.hourly_wage) || 0,
        annual_salary: Number(jobForm.annual_salary) || 0,
        wage_currency: jobForm.wage_currency,
        status: jobForm.stillThere ? "active" : jobForm.status,
        notes: jobForm.notes,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(t("common.saved"));
      resetJobForm();
      router.refresh();
    });
  }

  function onSaveCriteria(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      setError(null);
      const result = await savePrCriteria({
        id: criteria?.id,
        age: Number(age) || 0,
        education_level: education,
        french_clb: Number(frenchClb) || 0,
        english_clb: Number(englishClb) || 0,
        experience_months_override: overrideMonths === "" ? null : Number(overrideMonths),
        current_status: status,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(t("common.saved"));
      router.refresh();
    });
  }

  function onDeleteJob(id: string) {
    if (!window.confirm(t("common.confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteJob(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (editJobId === id) resetJobForm();
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        kicker={t("nav.pr")}
        title={t("pr.title")}
        description={t("pr.desc")}
      />
      <ExtrasBanner ready={lifeReady} messageKey="life.banner" />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <KpiCard
          label={t("pr.crs")}
          value={String(currentScore.total)}
          hint={t("pr.crsHint")}
          tone="gold"
        />
        <KpiCard
          label={t("pr.months")}
          value={`${formatNumber(experience.monthsUsed, 1)} / ${EXPERIENCE_MONTHS_TARGET}`}
          hint={
            experience.thresholdMet
              ? t("pr.thresholdMet")
              : experience.estimatedDate
                ? t("pr.eta", { d: formatDisplayDate(experience.estimatedDate) })
                : t("pr.etaNone")
          }
          tone={experience.thresholdMet ? "profit" : "default"}
        />
        <KpiCard
          label={t("pr.hours")}
          value={`${formatNumber(experience.hoursUsed, 0)} / ${EXPERIENCE_HOURS_TARGET}`}
          hint={t("pr.hoursHint")}
        />
      </div>

      <Section title={t("pr.experience")} hint={t("pr.experienceHint")}>
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>{t("pr.progress")}</span>
            <span>{Math.round(experience.progress * 100)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full ${experience.thresholdMet ? "bg-profit" : "bg-forest-mid"}`}
              style={{ width: `${Math.max(4, experience.progress * 100)}%` }}
            />
          </div>
        </div>

        <form className="space-y-3" onSubmit={onSaveJob}>
          <p className="font-semibold">
            {editJobId ? t("pr.editJob") : t("pr.addJob")}
          </p>
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("pr.jobTitle")}</span>
            <input
              className="cb-input"
              value={jobForm.job_title}
              onChange={(event) => setJobForm({ ...jobForm, job_title: event.target.value })}
              placeholder={t("pr.jobTitlePh")}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("pr.employer")}</span>
            <input
              className="cb-input"
              value={jobForm.employer}
              onChange={(event) => setJobForm({ ...jobForm, employer: event.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.start")}</span>
              <input
                className="cb-input"
                type="date"
                value={jobForm.start_date}
                onChange={(event) => setJobForm({ ...jobForm, start_date: event.target.value })}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.end")}</span>
              <input
                className="cb-input"
                type="date"
                value={jobForm.end_date}
                disabled={jobForm.stillThere}
                onChange={(event) => setJobForm({ ...jobForm, end_date: event.target.value })}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={jobForm.stillThere}
              onChange={(event) =>
                setJobForm({
                  ...jobForm,
                  stillThere: event.target.checked,
                  status: event.target.checked ? "active" : "ended",
                })
              }
            />
            {t("pr.stillThere")}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">TEER</span>
              <select
                className="cb-input"
                value={jobForm.teer}
                onChange={(event) => setJobForm({ ...jobForm, teer: event.target.value as TeerLevel })}
              >
                {TEER_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    TEER {level}
                    {["0", "1", "2", "3"].includes(level) ? ` — ${t("pr.qualifying")}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.noc")}</span>
              <input
                className="cb-input"
                value={jobForm.noc_code}
                onChange={(event) => setJobForm({ ...jobForm, noc_code: event.target.value })}
                placeholder="62010"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.hoursWeek")}</span>
              <input
                className="cb-input"
                inputMode="decimal"
                value={jobForm.hours_per_week}
                onChange={(event) => setJobForm({ ...jobForm, hours_per_week: event.target.value })}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.status")}</span>
              <select
                className="cb-input"
                value={jobForm.status}
                disabled={jobForm.stillThere}
                onChange={(event) => setJobForm({ ...jobForm, status: event.target.value as JobStatus })}
              >
                {JOB_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {t(`pr.status.${item}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.hourly")}</span>
              <input
                className="cb-input"
                inputMode="decimal"
                value={jobForm.hourly_wage}
                onChange={(event) => setJobForm({ ...jobForm, hourly_wage: event.target.value })}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.annual")}</span>
              <input
                className="cb-input"
                inputMode="decimal"
                value={jobForm.annual_salary}
                onChange={(event) => setJobForm({ ...jobForm, annual_salary: event.target.value })}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("common.currency")}</span>
              <select
                className="cb-input"
                value={jobForm.wage_currency}
                onChange={(event) =>
                  setJobForm({
                    ...jobForm,
                    wage_currency: event.target.value as Currency,
                  })
                }
              >
                <option value="CAD">CAD</option>
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
              </select>
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("pr.notes")}</span>
            <textarea
              className="cb-input min-h-20 py-3"
              value={jobForm.notes}
              onChange={(event) => setJobForm({ ...jobForm, notes: event.target.value })}
            />
          </label>
          <div className="flex gap-2">
            <button className="cb-btn flex-1" disabled={pending || !lifeReady} type="submit">
              {pending ? t("common.saving") : editJobId ? t("pr.updateJob") : t("pr.addJob")}
            </button>
            {editJobId ? (
              <button className="cb-btn-ghost" type="button" onClick={resetJobForm}>
                {t("close")}
              </button>
            ) : null}
          </div>
        </form>

        {jobs.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={t("pr.noJobs")} body={t("pr.noJobsBody")} />
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {jobs.map((job) => {
              const months = jobDurationMonths(job);
              const hours = jobHoursWorked(job);
              return (
                <li key={job.id} className="rounded-[1.2rem] border border-line bg-background px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{job.job_title}</p>
                      <p className="text-xs text-muted">
                        {job.employer || t("pr.noEmployer")} · TEER {job.teer}
                        {job.noc_code ? ` · ${job.noc_code}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDisplayDate(job.start_date)}
                        {" → "}
                        {job.end_date && job.status !== "active"
                          ? formatDisplayDate(job.end_date)
                          : t("pr.stillThere")}
                      </p>
                      <p className="mt-1 text-sm">
                        {formatNumber(months, 1)} {t("pr.mo")} · {formatNumber(hours, 0)} h
                        {jobIsQualifying(job) ? (
                          <span className="ms-2 text-profit">{t("pr.qualifying")}</span>
                        ) : (
                          <span className="ms-2 text-muted">{t("pr.notQualifying")}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <button className="cb-btn-ghost min-h-10 px-3" type="button" onClick={() => loadJob(job)}>
                        {t("common.edit")}
                      </button>
                      <button
                        className="cb-btn-ghost min-h-10 px-3 text-loss"
                        type="button"
                        onClick={() => onDeleteJob(job.id)}
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={t("pr.profile")} hint={t("pr.profileHint")}>
        <form className="space-y-3" onSubmit={onSaveCriteria}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.age")}</span>
              <input
                className="cb-input"
                inputMode="numeric"
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.education")}</span>
              <select
                className="cb-input"
                value={education}
                onChange={(event) => setEducation(event.target.value as EducationLevel)}
              >
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`pr.edu.${level}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.french")}</span>
              <select
                className="cb-input"
                value={frenchClb}
                onChange={(event) => {
                  setFrenchClb(event.target.value);
                  setSimFrench(event.target.value);
                }}
              >
                {CLB_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    CLB {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.english")}</span>
              <select
                className="cb-input"
                value={englishClb}
                onChange={(event) => setEnglishClb(event.target.value)}
              >
                {CLB_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    CLB {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.currentStatus")}</span>
              <input
                className="cb-input"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                placeholder="PGWP"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("pr.override")}</span>
              <input
                className="cb-input"
                inputMode="numeric"
                value={overrideMonths}
                onChange={(event) => setOverrideMonths(event.target.value)}
                placeholder={t("pr.overridePh")}
              />
            </label>
          </div>
          <button className="cb-btn w-full" disabled={pending || !lifeReady} type="submit">
            {pending ? t("common.saving") : t("pr.saveProfile")}
          </button>
        </form>
        <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li>{t("pr.break.age")}: {currentScore.age}</li>
          <li>{t("pr.break.edu")}: {currentScore.education}</li>
          <li>{t("pr.break.lang1")}: {currentScore.firstLanguage}</li>
          <li>{t("pr.break.lang2")}: {currentScore.secondLanguage}</li>
          <li>{t("pr.break.work")}: {currentScore.canadianWork}</li>
          <li>{t("pr.break.french")}: {currentScore.frenchBonus}</li>
        </ul>
      </Section>

      <Section title={t("pr.sim")} hint={t("pr.simHint")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("pr.simMonths")}</span>
            <input
              className="cb-input"
              inputMode="decimal"
              value={simMonths}
              onChange={(event) => setSimMonths(event.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("pr.simFrench")}</span>
            <select
              className="cb-input"
              value={simFrench}
              onChange={(event) => setSimFrench(event.target.value)}
            >
              {CLB_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  CLB {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <KpiCard label={t("pr.crsNow")} value={String(currentScore.total)} />
          <KpiCard label={t("pr.crsSim")} value={String(simulatedScore.total)} tone="gold" />
          <KpiCard
            label={t("pr.crsDelta")}
            value={`${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`}
            tone={scoreDelta > 0 ? "profit" : scoreDelta < 0 ? "loss" : "default"}
          />
        </div>
      </Section>

      {error ? <p className="mt-3 text-sm text-loss">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-profit">{message}</p> : null}
    </div>
  );
}
