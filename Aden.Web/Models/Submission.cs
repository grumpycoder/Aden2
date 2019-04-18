﻿using Glimpse.Core.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Aden.Web.Models
{
    public class Submission
    {
        public int Id { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? SubmissionDate { get; set; }
        public DateTime? NextDueDate { get; set; }
        public int DataYear { get; set; }
        public bool IsSEA { get; set; }
        public bool IsLEA { get; set; }
        public bool IsSCH { get; set; }
        public SubmissionState SubmissionState { get; set; }
        public DateTime? LastUpdated { get; set; }
        public List<Report> Reports { get; set; }
        public List<SubmissionAudit> SubmissionAudits { get; set; }
        public byte[] SpecificationDocument { get; set; }
        public int FileSpecificationId { get; set; }
        public FileSpecification FileSpecification { get; set; }
        public int? CurrentAssigneeId { get; set; }
        public UserProfile CurrentAssignee { get; set; }
        public int? CurrentReportId { get; internal set; }

        public Submission()
        {
            Reports = new List<Report>();
            SubmissionAudits = new List<SubmissionAudit>();
        }

        public void Waive(string message, string userFullName)
        {
            SubmissionState = SubmissionState.Waived;
            LastUpdated = DateTime.Now;

            var report = new Report
            {
                SubmissionId = Id,
                DataYear = DataYear,
                ReportState = ReportState.Waived
            };
            Reports.Add(report);

            //TODO: ReportId not available yet
            CurrentReportId = 0;

            //Create audit record
            var msg = $"{userFullName} waived submission: {message}";
            var audit = new SubmissionAudit(Id, msg);
            SubmissionAudits.Add(audit);

        }

        public WorkItem Reopen(string currentUser, string message, UserProfile assignee, DateTime dueDate)
        {

            //Create Audit record
            var msg = $"{currentUser} reopened submission: { message }";
            var audit = new SubmissionAudit(Id, msg);
            SubmissionAudits.Add(audit);

            //Create report
            var report = new Report
            {
                SubmissionId = Id,
                DataYear = DataYear,
                ReportState = ReportState.AssignedForGeneration
            };
            Reports.Add(report);

            //Change state
            SubmissionState = SubmissionState.AssignedForGeneration;
            CurrentAssignee = assignee;
            LastUpdated = DateTime.Now;
            NextDueDate = dueDate;
            CurrentReportId = report.Id;

            //Create work item
            var workItem = new WorkItem()
            {
                WorkItemAction = WorkItemAction.Generate,
                WorkItemState = WorkItemState.NotStarted,
                AssignedDate = DateTime.Now,
                AssignedUser = assignee
            };
            report.WorkItems.Add(workItem);

            return workItem;
        }

        public void Cancel(string currentUser)
        {

            //Set Submission State and clear assignee
            SubmissionState = SubmissionState.NotStarted;

            CurrentAssignee = null;

            var lastReport = Reports.LastOrDefault();

            if (lastReport != null)
            {
                CurrentReportId = lastReport.Id;

                if (lastReport.ReportState == ReportState.Waived) SubmissionState = SubmissionState.Waived;
            }

            //Create Audit record
            var msg = $"{currentUser} cancelled submission";
            var audit = new SubmissionAudit(Id, msg);
            SubmissionAudits.Add(audit);

        }

        public WorkItem Start(UserProfile assignee, string userFullName)
        {
            //Create audit record
            var msg = $"{userFullName} started submission";
            var audit = new SubmissionAudit(Id, msg);
            SubmissionAudits.Add(audit);

            //Change state
            SubmissionState = SubmissionState.AssignedForGeneration;
            CurrentAssignee = assignee;
            LastUpdated = DateTime.Now;

            //Create report
            var report = new Report() { SubmissionId = Id, DataYear = DataYear, ReportState = ReportState.AssignedForGeneration };
            Reports.Add(report);

            //Create work item
            var workItem = new WorkItem()
            {
                WorkItemAction = WorkItemAction.Generate,
                WorkItemState = WorkItemState.NotStarted,
                AssignedDate = DateTime.Now,
                AssignedUser = assignee
            };
            report.WorkItems.Add(workItem);

            return workItem;
        }

        public void Reassign(string currentUser, WorkItem workItem, UserProfile assignee, string reason)
        {

            //Create Audit record
            var message = $"{currentUser} reassigned from {workItem.AssignedUser.FullName} to {assignee.FullName}: {reason}";
            var audit = new SubmissionAudit(Id, message);
            SubmissionAudits.Add(audit);

            //Update assigned user
            workItem.AssignedUser = assignee;
            workItem.WorkItemState = WorkItemState.Reassigned;

            CurrentAssignee = assignee;
        }

        public WorkItem Reject(WorkItem workItem)
        {
            //Create Audit record
            var message = $"{workItem.AssignedUser.FullName} rejected {workItem.WorkItemAction.ToDescription()}";
            var audit = new SubmissionAudit(Id, message);
            SubmissionAudits.Add(audit);

            workItem.WorkItemState = WorkItemState.Reject;
            workItem.CompletedDate = DateTime.Now;

            LastUpdated = DateTime.Now;

            var wi = new WorkItem()
            {
                WorkItemState = WorkItemState.NotStarted,
                AssignedDate = DateTime.Now,
                WorkItemAction = WorkItemAction.Generate,
                AssignedUser = workItem.AssignedUser
            };

            var report = Reports.SingleOrDefault(x => x.Id == CurrentReportId);
            report.GeneratedDate = null;
            report.ApprovedDate = null;
            report.SubmittedDate = null;

            report.ReportState = ReportState.AssignedForGeneration;
            report.Submission.SubmissionState = SubmissionState.AssignedForGeneration;

            report.Submission.CurrentAssignee = wi.AssignedUser;

            report.WorkItems.Add(wi);

            return wi;
        }

        public WorkItem CompleteWork(WorkItem workItem, UserProfile nextAssignee, bool generateErrorTask = false)
        {
            //Create Audit record
            var message = $"{workItem.AssignedUser.FullName} completed {workItem.WorkItemAction.ToDescription()}";
            var audit = new SubmissionAudit(Id, message);
            SubmissionAudits.Add(audit);


            var report = Reports.FirstOrDefault(x => x.Id == CurrentReportId);
            workItem.CompletedDate = DateTime.Now;
            workItem.WorkItemState = WorkItemState.Completed;

            //Start new work item
            var wi = new WorkItem() { WorkItemState = WorkItemState.NotStarted, AssignedDate = DateTime.Now, AssignedUser = nextAssignee };

            if (generateErrorTask)
            {
                wi.WorkItemAction = WorkItemAction.ReviewError;
                report.ReportState = ReportState.CompleteWithError;
                report.Submission.SubmissionState = SubmissionState.CompleteWithError;
                report.SubmittedDate = DateTime.Now;
                wi.AssignedUser = CurrentAssignee = nextAssignee;
                report.WorkItems.Add(wi);
                return wi;
            }

            switch (workItem.WorkItemAction)
            {
                case WorkItemAction.Generate:
                    wi.WorkItemAction = WorkItemAction.Review;
                    report.ReportState = ReportState.AssignedForReview;
                    report.Submission.SubmissionState = SubmissionState.AssignedForReview;
                    wi.AssignedUser = CurrentAssignee = workItem.AssignedUser;
                    break;
                case WorkItemAction.Review:
                    wi.WorkItemAction = WorkItemAction.Approve;
                    report.ReportState = ReportState.AwaitingApproval;
                    report.Submission.SubmissionState = SubmissionState.AwaitingApproval;
                    wi.AssignedUser = CurrentAssignee = nextAssignee;
                    break;
                case WorkItemAction.Approve:
                    wi.WorkItemAction = WorkItemAction.Submit;
                    report.ReportState = ReportState.AssignedForSubmission;
                    report.Submission.SubmissionState = SubmissionState.AssignedForSubmission;
                    report.ApprovedDate = DateTime.Now;
                    wi.AssignedUser = CurrentAssignee = nextAssignee;
                    break;
                case WorkItemAction.Submit:
                    report.ReportState = ReportState.Complete;
                    report.Submission.SubmissionState = SubmissionState.Complete;
                    report.SubmittedDate = report.Submission.SubmissionDate = DateTime.Now;
                    wi.AssignedUser = CurrentAssignee = workItem.AssignedUser;
                    break;
                case WorkItemAction.ReviewError:
                    wi.WorkItemAction = WorkItemAction.Generate;
                    report.ReportState = ReportState.AssignedForGeneration;
                    report.Submission.SubmissionState = SubmissionState.AssignedForGeneration;
                    wi.AssignedUser = CurrentAssignee = nextAssignee;
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }

            LastUpdated = DateTime.Now;

            if (wi.WorkItemAction != 0)
            {
                report.WorkItems.Add(wi);
            }

            return wi;
        }

    }
}
