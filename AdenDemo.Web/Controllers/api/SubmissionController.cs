﻿using AdenDemo.Web.Data;
using AdenDemo.Web.Models;
using AdenDemo.Web.Services;
using AdenDemo.Web.ViewModels;
using AutoMapper.QueryableExtensions;
using DevExtreme.AspNet.Data;
using DevExtreme.AspNet.Mvc;
using System;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;

namespace AdenDemo.Web.Controllers.api
{
    [RoutePrefix("api/submission")]
    public class SubmissionController : ApiController
    {
        private AdenContext _context;
        public SubmissionController()
        {
            _context = new AdenContext();
        }

        [HttpGet]
        public async Task<object> Get(DataSourceLoadOptions loadOptions)
        {
            var dto = await _context.Submissions.ProjectTo<SubmissionViewDto>().ToListAsync();

            return Ok(DataSourceLoader.Load(dto.OrderBy(x => x.DueDate).ThenByDescending(x => x.Id), loadOptions));
        }

        [HttpPost, Route("waive/{id}")]
        public async Task<object> Waive(int id, SubmissionWaiveAuditEntryDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Message)) return BadRequest("No message provided");

            var submission = await _context.Submissions.FirstOrDefaultAsync(s => s.Id == id);
            if (submission == null) return NotFound();

            //TODO: Refactor model
            //Change state
            submission.SubmissionState = SubmissionState.Waived;
            submission.LastUpdated = DateTime.Now;

            //Create waived report
            var report = new Report() { SubmissionId = submission.Id, DataYear = submission.DataYear, ReportState = ReportState.Waived };
            submission.Reports.Add(report);

            //Create Audit record
            var user = "mark@mail.com";
            var message = $"Waived by {user}: {model.Message}";
            var audit = new SubmissionAudit(submission.Id, message);
            submission.SubmissionAudits.Add(audit);

            //Save changes
            _context.SaveChanges();

            return Ok("Success");
        }

        [HttpPost, Route("start/{id}")]
        public async Task<object> Start(int id)
        {
            var submission = await _context.Submissions.Include(f => f.FileSpecification).FirstOrDefaultAsync(x => x.Id == id);
            if (submission == null) return NotFound();

            if (string.IsNullOrWhiteSpace(submission.FileSpecification.GenerationUserGroup))
                return BadRequest($"No generation group defined for File { submission.FileSpecification.FileNumber }");

            //TODO: Get next assignee
            var assignee = "mark@mail.com";

            //Change state
            submission.SubmissionState = SubmissionState.AssignedForGeneration;
            submission.CurrentAssignee = assignee;
            submission.LastUpdated = DateTime.Now;

            //Create report
            var report = new Report() { SubmissionId = submission.Id, DataYear = submission.DataYear, ReportState = ReportState.AssignedForGeneration };
            submission.Reports.Add(report);

            //Create work item
            var workItem = new WorkItem()
            {
                WorkItemAction = WorkItemAction.Generate,
                WorkItemState = WorkItemState.NotStarted,
                AssignedDate = DateTime.Now,
                AssignedUser = assignee
            };
            report.WorkItems.Add(workItem);

            WorkEmailer.Send(workItem, submission);

            _context.SaveChanges();

            submission.CurrentReportId = report.Id;

            _context.SaveChanges();

            return Ok(submission);
        }

        [HttpPost, Route("cancel/{id}")]
        public async Task<object> Cancel(int id)
        {
            var submission = await _context.Submissions.Include(f => f.FileSpecification).FirstOrDefaultAsync(x => x.Id == id);
            if (submission == null) return NotFound();

            var workItem = _context.WorkItems.SingleOrDefault(x => x.ReportId == submission.CurrentReportId && x.WorkItemState == WorkItemState.NotStarted);

            //Set Submission State and clear assignee
            submission.SubmissionState = SubmissionState.NotStarted;
            submission.CurrentAssignee = string.Empty;

            //Create Audit record
            var user = "mark@mail.com";
            var message = $"Cancelled by {user}";
            var audit = new SubmissionAudit(submission.Id, message);
            submission.SubmissionAudits.Add(audit);

            //Remove Reports/Documents/WorkItems
            var report = await _context.Reports.FirstOrDefaultAsync(r => r.SubmissionId == id);
            if (report != null)
            {
                var workItems = _context.WorkItems.Where(w => w.ReportId == report.Id);
                _context.WorkItems.RemoveRange(workItems);

                var docs = _context.ReportDocuments.Where(d => d.ReportId == report.Id);
                _context.ReportDocuments.RemoveRange(docs);

                _context.Reports.Remove(report);
            }

            WorkEmailer.Send(workItem, submission);
            _context.SaveChanges();

            return Ok();

        }

        //[HttpPost, Route("restart")]
        [HttpPost, Route("reopen/{id}")]
        public async Task<object> ReOpen(int id, SubmissionReOpenAuditEntryDto model)
        {

            if (model == null) return BadRequest("No audit entry found in request");

            var submission = await _context.Submissions.Include(f => f.FileSpecification).FirstOrDefaultAsync(x => x.Id == id);
            if (submission == null) return NotFound();

            if (string.IsNullOrWhiteSpace(submission.FileSpecification.GenerationUserGroup))
                return BadRequest($"No generation group defined for File { submission.FileSpecification.FileNumber }");

            //Create Audit record
            var user = "mark@mail.com";
            var message = $"ReOpened by { user}: { model.Message }";
            var audit = new SubmissionAudit(submission.Id, message);
            submission.SubmissionAudits.Add(audit);

            //TODO: Get next assignee
            var assignee = "mark@mail.com";

            //Change state
            submission.SubmissionState = SubmissionState.AssignedForGeneration;
            submission.CurrentAssignee = assignee;
            submission.LastUpdated = DateTime.Now;
            submission.NextDueDate = model.NextSubmissionDate;

            //Create report
            var report = new Report() { SubmissionId = submission.Id, DataYear = submission.DataYear, ReportState = ReportState.AssignedForGeneration };
            submission.Reports.Add(report);

            //Create work item
            var workItem = new WorkItem()
            {
                WorkItemAction = WorkItemAction.Generate,
                WorkItemState = WorkItemState.NotStarted,
                AssignedUser = assignee
            };
            report.WorkItems.Add(workItem);

            WorkEmailer.Send(workItem, submission);

            _context.SaveChanges();

            return Ok("Successfully repopened");

        }


    }
}
