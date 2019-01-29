﻿using AdenDemo.Web.Data;
using AdenDemo.Web.Helpers;
using AdenDemo.Web.Models;
using AdenDemo.Web.Services;
using AdenDemo.Web.ViewModels;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using DevExtreme.AspNet.Data;
using DevExtreme.AspNet.Mvc;
using System;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;

namespace AdenDemo.Web.Controllers.api
{
    [RoutePrefix("api/workitem")]
    public class WorkItemController : ApiController
    {
        private AdenContext _context;
        public WorkItemController()
        {
            _context = new AdenContext();
        }

        [HttpGet, Route("{username}")]
        public async Task<object> Get(string username, DataSourceLoadOptions loadOptions)
        {
            if (username == null) return NotFound();

            var dto = await _context.WorkItems
                .Where(u => u.AssignedUser == username && u.WorkItemState == WorkItemState.NotStarted)
                .ProjectTo<WorkItemViewDto>().ToListAsync();

            return Ok(DataSourceLoader.Load(dto.OrderBy(x => x.AssignedDate), loadOptions));
        }

        [HttpGet, Route("finished/{username}")]
        public async Task<object> Finished(string username, DataSourceLoadOptions loadOptions)
        {
            if (username == null) return NotFound();

            var dto = await _context.WorkItems
                .Where(u => u.AssignedUser == username && u.WorkItemState == WorkItemState.Completed)
                .ProjectTo<WorkItemViewDto>().ToListAsync();

            return Ok(DataSourceLoader.Load(dto.OrderByDescending(x => x.CompletedDate).ThenByDescending(d => d.Action), loadOptions));
        }

        [HttpGet, Route("history/{id}")]
        public async Task<object> History(int id, DataSourceLoadOptions loadOptions)
        {
            var dto = await _context.WorkItems.Where(w => w.ReportId == id)
                            .ProjectTo<WorkItemHistoryDto>().ToListAsync();

            //TODO: Set GlobalAdmin variable
            var IsAdmin = true;
            foreach (var item in dto)
            {
                if ((item.WorkItemState == WorkItemState.NotStarted || item.WorkItemState == WorkItemState.Reassigned) && IsAdmin) item.CanReassign = true;
            }
            return Ok(DataSourceLoader.Load(dto.OrderByDescending(x => x.Id), loadOptions));
        }

        [HttpPost, Route("assign")]
        public async Task<object> Assign(AssignmentDto model)
        {
            var workItem = await _context.WorkItems.Include(r => r.Report).FirstOrDefaultAsync(x => x.Id == model.WorkItemId);
            if (workItem == null) return NotFound();

            var submission = await _context.Submissions.FindAsync(workItem.Report.SubmissionId);

            //Update assigned user
            workItem.AssignedUser = model.AssignedUser;
            workItem.WorkItemState = WorkItemState.Reassigned; 


            //Create Audit record
            //TODO: Get current user
            var user = "mark@mail.com";
            var message = $"Reassigned from {workItem.AssignedUser} to {model.AssignedUser} by {user}: {model.Reason}";
            var audit = new SubmissionAudit(submission.Id, message);
            submission.SubmissionAudits.Add(audit);

            submission.CurrentAssignee = model.AssignedUser;

            _context.SaveChanges();

            //Send assignment notification
            //TODO: Send notification


            return Ok(model);
        }


        [HttpPost, Route("complete/{id}")]
        public async Task<object> Complete(int id)
        {
            var workItem = await _context.WorkItems.FindAsync(id);

            if (workItem == null) return NotFound();

            var report = await _context.Reports.Include(s => s.Submission.FileSpecification).SingleOrDefaultAsync(r => r.Id == workItem.ReportId);

            //TODO: Handle null report

            if (workItem.WorkItemAction == WorkItemAction.Generate)
            {
                //Create documents
                //TODO: Flesh out Generate documents from stored procdure
                //report.Documents.Add(new ReportDocument() { ReportLevel = ReportLevel.SCH, Version = 1 });
                //_context.SaveChanges();
                var version = 1;
                string filename;
                if (report.Submission.FileSpecification.IsSCH)
                {
                    filename = report.Submission.FileSpecification.FileNameFormat.Replace("{level}", ReportLevel.SCH.GetDisplayName()).Replace("{version}", string.Format("v{0}.csv", version));

                    var file = ExecuteDocumentCreationToFile(report, ReportLevel.SCH);
                    var doc = new ReportDocument() { FileData = file, ReportLevel = ReportLevel.SCH, Filename = filename, FileSize = file.Length };
                    report.Documents.Add(doc);

                }
                if (report.Submission.FileSpecification.IsLEA)
                {
                    filename = report.Submission.FileSpecification.FileNameFormat.Replace("{level}", ReportLevel.LEA.GetDisplayName()).Replace("{version}", string.Format("v{0}.csv", version));
                    var file = ExecuteDocumentCreationToFile(report, ReportLevel.LEA);
                    var doc = new ReportDocument() { FileData = file, ReportLevel = ReportLevel.SCH, Filename = filename, FileSize = file.Length };
                    report.Documents.Add(doc);
                }
                if (report.Submission.FileSpecification.IsSEA)
                {
                    filename = report.Submission.FileSpecification.FileNameFormat.Replace("{level}", ReportLevel.SEA.GetDisplayName()).Replace("{version}", string.Format("v{0}.csv", version));
                    var file = ExecuteDocumentCreationToFile(report, ReportLevel.SEA);
                    var doc = new ReportDocument() { FileData = file, ReportLevel = ReportLevel.SCH, Filename = filename, FileSize = file.Length };
                    report.Documents.Add(doc);
                }
            }

            //Complete work item
            workItem.CompletedDate = DateTime.Now;
            workItem.WorkItemState = WorkItemState.Completed;


            //Start new work item
            var wi = new WorkItem() { WorkItemState = WorkItemState.NotStarted, AssignedDate = DateTime.Now };
            report.Submission.LastUpdated = DateTime.Now;

            if (workItem.WorkItemAction == WorkItemAction.Generate)
            {
                wi.WorkItemAction = WorkItemAction.Review;
                report.ReportState = ReportState.AssignedForReview;
                report.Submission.SubmissionState = SubmissionState.AssignedForReview;
            }

            if (workItem.WorkItemAction == WorkItemAction.Review)
            {
                wi.WorkItemAction = WorkItemAction.Approve;
                report.ReportState = ReportState.AwaitingApproval;
                report.Submission.SubmissionState = SubmissionState.AwaitingApproval;
            }

            if (workItem.WorkItemAction == WorkItemAction.Approve)
            {
                wi.WorkItemAction = WorkItemAction.Submit;
                report.ReportState = ReportState.AssignedForSubmission;
                report.Submission.SubmissionState = SubmissionState.AssignedForSubmission;
            }

            //TODO: Why do you need a reject work item action?
            //if (workItem.WorkItemAction == WorkItemAction.Reject)
            //{
            //    wi.WorkItemAction = WorkItemAction.Generate;
            //    report.ReportState = ReportState.AssignedForGeneration;
            //    report.Submission.SubmissionState = SubmissionState.AssignedForGeneration;
            //}

            //TODO: Why do you need a submit with error work item action?
            //if (workItem.WorkItemAction == WorkItemAction.SubmitWithError)
            //{
            //    wi.WorkItemAction = WorkItemAction.ReviewError;
            //    report.ReportState = ReportState.CompleteWithError;
            //    report.Submission.SubmissionState = SubmissionState.CompleteWithError;
            //}

            if (workItem.WorkItemAction == WorkItemAction.ReviewError)
            {
                wi.WorkItemAction = WorkItemAction.Generate;
                report.ReportState = ReportState.AssignedForGeneration;
                report.Submission.SubmissionState = SubmissionState.AssignedForGeneration;
            }

            if (workItem.WorkItemAction == WorkItemAction.Submit)
            {
                report.ReportState = ReportState.Complete;
                report.Submission.SubmissionState = SubmissionState.Complete;
            }


            //TODO: Get workitem assignee
            var assignedUser = "mark@mail.com";

            wi.AssignedUser = assignedUser;
            report.Submission.CurrentAssignee = assignedUser;

            if (wi.WorkItemAction != 0) report.WorkItems.Add(wi);


            //TODO: Send notifications 
            WorkEmailer.Send(wi, report.Submission);

            _context.SaveChanges();


            return Ok("completed work item task");

        }

        [HttpPost, Route("reject/{id}")]
        public async Task<object> Reject(int id)
        {
            var workItem = await _context.WorkItems.FindAsync(id);

            if (workItem == null) return NotFound();

            var report = await _context.Reports.Include(s => s.Submission.FileSpecification).SingleOrDefaultAsync(r => r.Id == workItem.ReportId);

            workItem.WorkItemState = WorkItemState.Reject;
            workItem.CompletedDate = DateTime.Now;

            //Start new work item
            //TODO: Get workitem assignee
            var assignedUser = "mark@mail.com";

            var wi = new WorkItem()
            {
                WorkItemState = WorkItemState.NotStarted,
                AssignedDate = DateTime.Now,
                WorkItemAction = WorkItemAction.Generate,
                AssignedUser = assignedUser
            };
            report.Submission.LastUpdated = DateTime.Now;

            report.ReportState = ReportState.AssignedForGeneration;
            report.Submission.SubmissionState = SubmissionState.AssignedForGeneration;
            report.Submission.CurrentAssignee = assignedUser;

            report.WorkItems.Add(wi);

            WorkEmailer.Send(wi, report.Submission);

            await _context.SaveChangesAsync();

            //TODO Send notifications

            var dto = Mapper.Map<WorkItemViewDto>(wi);
            return Ok(dto);
        }



        private byte[] ExecuteDocumentCreationToFile(Report report, ReportLevel reportLevel)
        {
            var dataTable = new DataTable();
            var ds = new DataSet();
            using (var connection = new SqlConnection(_context.Database.Connection.ConnectionString))
            {
                using (var cmd = new SqlCommand(report.Submission.FileSpecification.ReportAction, connection))
                {
                    //TODO: Store timeout in constants
                    cmd.CommandTimeout = 300;
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@DataYear", report.Submission.DataYear);
                    cmd.Parameters.AddWithValue("@ReportLevel", reportLevel.GetDisplayName());
                    var adapter = new SqlDataAdapter(cmd);
                    adapter.Fill(dataTable);
                    adapter.Fill(ds);
                }
            }

            var version = 1; //report.GetNextFileVersionNumber(reportLevel);
            var filename = report.Submission.FileSpecification.FileNameFormat.Replace("{level}", reportLevel.GetDisplayName()).Replace("{version}", string.Format("v{0}.csv", version));

            var table1 = ds.Tables[0].UpdateFieldValue("Filename", filename).ToCsvString(false);
            var table2 = ds.Tables[1].UpdateFieldValue("Filename", filename).ToCsvString(false);


            var file = Encoding.ASCII.GetBytes(ds.Tables[0].Rows.Count > 1 ? string.Concat(table2, table1) : string.Concat(table1, table2)); ;

            return file;

        }

    }
}