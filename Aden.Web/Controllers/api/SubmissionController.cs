using Aden.Web.Data;
using Aden.Web.Models;
using Aden.Web.Services;
using Aden.Web.ViewModels;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using DevExtreme.AspNet.Data;
using DevExtreme.AspNet.Mvc;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using Z.EntityFramework.Plus;

namespace Aden.Web.Controllers.api
{
    [RoutePrefix("api/submission")]
    [Authorize(Roles = "AdenAppUsers")]
    public class SubmissionController : ApiController
    {
        private AdenContext _context;
        private MembershipService _membershipService;
        private string _currentUserFullName;

        public SubmissionController()
        {
            _context = new AdenContext();
            _membershipService = new MembershipService(_context);
            _currentUserFullName = User.Identity.Name;
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

            var submission = await _context.Submissions
                .Include(f => f.FileSpecification)
                .Include(r => r.Reports)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (submission == null) return NotFound();

            submission.Waive(model.Message, _currentUserFullName);

            _context.SaveChanges();

            //TODO: Refactor. Do not have access to new report until after save
            if (submission.CurrentReportId == 0) submission.CurrentReportId = submission.Reports.LastOrDefault()?.Id;

            _context.SaveChanges();

            var dto = Mapper.Map<SubmissionViewDto>(submission);

            return Ok(dto);
        }

        [HttpPost, Route("start/{id}")]
        public async Task<object> Start(int id)
        {
            var submission = await _context.Submissions
                .Include(f => f.FileSpecification.GenerationGroup).Include(r => r.Reports)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (submission == null) return NotFound();

            if (submission.FileSpecification.GenerationGroup == null)
                return BadRequest($"No generation group defined for File { submission.FileSpecification.FileNumber }");

            var group = _context.Groups.Include(x => x.Users).FirstOrDefault(x => x.Id == submission.FileSpecification.GenerationGroupId);
            var assignedUser = _membershipService.GetAssignee(group);

            if (assignedUser == null)
                return BadRequest($"No group members to assign next task. ");

            var workItem = submission.Start(assignedUser, _currentUserFullName);

            WorkEmailer.Send(workItem, submission);

            _context.SaveChanges();

            if (submission.CurrentReportId == null)
            {
                submission.CurrentReportId = submission.Reports.LastOrDefault().Id;
                _context.SaveChanges();
            }


            var dto = Mapper.Map<SubmissionViewDto>(submission);

            return Ok(dto);
        }

        [HttpPost, Route("cancel/{id}")]
        public async Task<object> Cancel(int id)
        {
            var submission = await _context.Submissions
                .Include(f => f.FileSpecification).Include(x => x.Reports)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (submission == null) return NotFound();

            _context.WorkItems
                .Where(r => r.ReportId == submission.CurrentReportId && r.WorkItemState != WorkItemState.Completed)
                .Update(x => new WorkItem() { WorkItemState = WorkItemState.Cancelled });

            var report = _context.Reports.FirstOrDefault(x => x.Id == submission.CurrentReportId);
            report.ReportState = ReportState.NotStarted;

            submission.Cancel(_currentUserFullName);

            _context.SaveChanges();

            var dto = Mapper.Map<SubmissionViewDto>(submission);

            return Ok(dto);

        }

        [HttpPost, Route("reopen/{id}")]
        public async Task<object> ReOpen(int id, SubmissionReOpenAuditEntryDto model)
        {

            if (model == null) return BadRequest("No audit entry found in request");

            //TODO: Pulling too much data here
            var submission = await _context.Submissions
                .Include(r => r.Reports)
                .Include(f => f.FileSpecification.GenerationGroup)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (submission == null) return NotFound();

            if (submission.FileSpecification.GenerationGroup == null)
                return BadRequest($"No generation group defined for File { submission.FileSpecification.FileNumber }");

            var group = _context.Groups.Include(x => x.Users)
                .FirstOrDefault(x => x.Id == submission.FileSpecification.GenerationGroupId);

            var assignedUser = _membershipService.GetAssignee(group);
            if (assignedUser == null)
                return BadRequest($"No group members to assign next task. ");

            var workItem = submission.Reopen(_currentUserFullName, model.Message, assignedUser, model.NextSubmissionDate);

            _context.SaveChanges();

            //TODO: Refactor. Do not have access to new report until after save
            submission.CurrentReportId = submission.Reports.LastOrDefault().Id;

            _context.SaveChanges();

            WorkEmailer.Send(workItem, submission);

            var dto = Mapper.Map<SubmissionViewDto>(submission);

            return Ok(dto);

        }

    }
}
