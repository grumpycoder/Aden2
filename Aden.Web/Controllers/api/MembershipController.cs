using Aden.Web.Data;
using Aden.Web.Models;
using Aden.Web.Services;
using DevExtreme.AspNet.Data;
using DevExtreme.AspNet.Mvc;
using System.Data.Entity;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web.Http;

namespace Aden.Web.Controllers.api
{
    [RoutePrefix("api/membership")]
    [Authorize(Roles = "AdenAppUsers")]
    public class MembershipController : ApiController
    {
        private AdenContext _context;
        private readonly MembershipService _membershipService;
        private string _currentUsername;

        public MembershipController()
        {
            _context = new AdenContext();
            _membershipService = new MembershipService(_context);
            _currentUsername = ((ClaimsIdentity)User.Identity).Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

        }

        [HttpGet, Route("groups")]
        public async Task<object> Groups(DataSourceLoadOptions loadOptions)
        {
            var dto = await _context.Groups.ToListAsync();

            return Ok(DataSourceLoader.Load(dto, loadOptions));
        }

        [HttpPost, Route("creategroup/{groupName}")]
        public object AddGroup(string groupName)
        {
            var model = new Group() { Name = groupName };

            _context.Groups.Add(model);
            _context.SaveChanges();
            return Ok(groupName);
        }


        //[HttpDelete, Route("groupmembers/{groupId}/{identityGuid}")]
        //public async Task<object> DeleteGroupMember(int groupId, Guid identityGuid)
        //{
        //    var dto = await _context.Groups.Include(u => u.Users).FirstOrDefaultAsync(g => g.Id == groupId);

        //    dto.Users.RemoveAll(x => x.IdentityGuid == identityGuid);
        //    _context.SaveChanges();

        //    return Ok(dto);
        //}

        //[HttpGet, Route("{username}")]
        //public object Users(string username = null)
        //{
        //    var users = new IdemService().FindUsers(username);
        //    return Ok(users);

        //}

        //[HttpGet, Route("groupmembers/{groupId}")]
        //public async Task<object> GroupMembers(int groupId)
        //{
        //    var dto = await _context.Groups.Include(u => u.Users).FirstOrDefaultAsync(x => x.Id == groupId);

        //    return Ok(dto.Users);
        //}



        //[HttpPost, Route("AddGroupUser")]
        //public object AddGroupUser(UpdateGroupMemberDto model)
        //{
        //    var group = _context.Groups.Include(u => u.Users).FirstOrDefault(x => x.Id == model.GroupId);

        //    if (group == null) return BadRequest("Group does not exists");

        //    var user = _context.Users.FirstOrDefault(x => x.IdentityGuid == model.IdentityGuid) ?? new UserProfile();

        //    var idemUser = new IdemService().GetUser(model.IdentityGuid);

        //    if (idemUser != null)
        //    {
        //        user.EmailAddress = idemUser.EmailAddress;
        //        user.FirstName = idemUser.Firstname;
        //        user.LastName = idemUser.Lastname;
        //        user.IdentityGuid = idemUser.IdentityGuid;
        //        user.FullName = $"{user.FirstName} {user.LastName}";
        //    }

        //    _context.Users.AddOrUpdate(user);

        //    group.Users.Add(user);

        //    _context.SaveChanges();

        //    var applications = new IdemService().GetUserApplications(user.EmailAddress);
        //    if (!applications.Any(x => x.ApplicationViewKey == Constants.ApplicationName)) WorkEmailer.RequestAccess(user, _currentUsername);


        //    return Ok(user);
        //}

        //[HttpPost, Route("DeleteGroupMember")]
        //public object DeleteGroupMember(UpdateGroupMemberDto model)
        //{
        //    var group = _context.Groups.Include(u => u.Users).FirstOrDefault(x => x.Id == model.GroupId);

        //    if (group == null) return BadRequest("Group does not exists");

        //    var user = group.Users.FirstOrDefault(x => x.IdentityGuid == model.IdentityGuid);

        //    group.Users.Remove(user);

        //    _context.SaveChanges();

        //    return Ok($"Deleted {user.FullName} to {group.Name}");
        //}

    }

}
