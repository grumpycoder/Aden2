using System.Web.Mvc;
using Aden.Web.Data;
using Aden.Web.Filters;
using Aden.Web.Services;

namespace Aden.Web.Controllers
{
    [RoutePrefix("Report")]
    [CustomAuthorize(Roles = "AdenAppUsers")]
    public class ReportController : Controller
    {
        private AdenContext _context;
        private MembershipService _membershipService;

        public ReportController()
        {
            _context = new AdenContext();
            _membershipService = new MembershipService(_context);
        }
        // GET: Report
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Submission()
        {
            return View();
        }

        public ActionResult FileAssignment()
        {
            return View();
        }

    }
}