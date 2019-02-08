using Aden.Web.Data;
using DevExtreme.AspNet.Data;
using DevExtreme.AspNet.Mvc;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;

namespace Aden.Web.Controllers.api
{
    [RoutePrefix("api/log")]
    public class LogController : ApiController
    {
        private AdenContext _context;
        public LogController()
        {
            _context = new AdenContext();
        }

        [HttpGet, Route("error")]
        public async Task<object> Error(DataSourceLoadOptions loadOptions)
        {
            var dto = await _context.ErrorLogs.ToListAsync();
            return Ok(DataSourceLoader.Load(dto.OrderByDescending(x => x.Timestamp), loadOptions));
        }

        [HttpGet, Route("performance")]
        public async Task<object> Performance(DataSourceLoadOptions loadOptions)
        {
            var dto = await _context.PerformanceLogs.ToListAsync();
            return Ok(DataSourceLoader.Load(dto.OrderByDescending(x => x.Timestamp), loadOptions));
        }
    }
}
