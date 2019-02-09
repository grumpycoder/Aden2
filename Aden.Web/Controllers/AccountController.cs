using Aden.Web.Data;
using Aden.Web.Services;
using Alsde.Security.Identity;
using System;
using System.Linq;
using System.Security.Claims;
using System.Web.Mvc;

namespace Aden.Web.Controllers
{
    public class AccountController : Controller
    {
        private readonly AdenContext _context;
        private readonly MembershipService _membershipService;

        public AccountController()
        {
            _context = new AdenContext();
            _membershipService = new MembershipService(_context);
        }

        //Callback url from TPA login
        public ActionResult LoginCallback(string token)
        {
            var tokenKey = new TokenKey(token, Constants.TpaAccessKey);

            var result = IdentityManager.TokenSignin(Constants.WebServiceUrl, tokenKey);

            Session["LoginFailureMessage"] = string.Empty;
            if (result.IsFailure)
            {
                Session["LoginFailureMessage"] = result.Error;
                return RedirectToAction("LoginFailure", "Account");
            }

            var identity = result.Value;
            if (identity == null) throw new Exception("No identity returned from Token signin");
            
            var claim = identity.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier).Value;
            var user = _membershipService.GetUserProfile(new Guid(claim));

            user.EmailAddress = identity.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Email).Value;
            user.LastName = identity.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Surname).Value;
            user.FirstName = identity.Claims.FirstOrDefault(x => x.Type == ClaimTypes.GivenName).Value;
            user.FullName = identity.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Name).Value;

            _context.SaveChanges();

            var groups = _membershipService.GetUserGroups(user.EmailAddress);
            foreach (var @group in groups)
            {
                identity.AddClaim(new Claim(ClaimTypes.Role, @group.Name));
                identity.AddClaim(new Claim(ClaimsIdentity.DefaultNameClaimType, @group.Name));
            }


            return RedirectToAction(identity.Claims.Any(x => x.Type == ClaimTypes.Role && x.Value.Contains("Administrators")) ? "Submissions" : "Assignments", "Home");
        }


        public ActionResult Signout()
        {
            IdentityManager.IdentitySignout();

            var logoutUrl = $"https://{Constants.LogoutUrl}{Constants.AimApplicationViewKey}";

            return Redirect(logoutUrl);
        }

        public ActionResult Unauthorized()
        {
            return View();
        }

        public ActionResult LoginFailure(string message)
        {
            ViewBag.Message = Session["LoginFailureMessage"];
            return View();
        }
    }
}