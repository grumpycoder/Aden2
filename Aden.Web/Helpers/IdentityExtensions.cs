using System.Linq;
using System.Security.Claims;
using System.Security.Principal;

namespace Aden.Web.Helpers
{
    public static class IdentityExtensions
    {
        public static void AddUpdateClaim(this IIdentity currentPrincipal, string key, string value)
        {
            var identity = currentPrincipal as ClaimsIdentity;
            if (identity == null)
                return;

            // check for existing claim and remove it
            var existingClaim = identity.FindFirst(key);
            if (existingClaim != null)
                identity.RemoveClaim(existingClaim);

            // add new claim
            identity.AddClaim(new Claim(key, value));
            //var authenticationManager = HttpContext.Current.GetOwinContext().Authentication;
            //authenticationManager.AuthenticationResponseGrant = new AuthenticationResponseGrant(new ClaimsPrincipal(identity), new AuthenticationProperties() { IsPersistent = true });
        }

        public static string GetClaimValue(this IIdentity currentPrincipal, string key)
        {
            var identity = currentPrincipal as ClaimsIdentity;
            if (identity == null)
                return null;

            var claim = identity.Claims.FirstOrDefault(c => c.Type == key);
            return claim.Value;
        }

        public static string GetClaimValue(this ClaimsPrincipal currentPrincipal, string key)
        {
            var identity = currentPrincipal;
            var claim = identity?.Claims.FirstOrDefault(c => c.Type == key);
            return claim?.Value;
        }

        public static string GetEmailAddressClaim(this IIdentity currentPrincipal)
        {
            const string key = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
            return GetClaimValue(ClaimsPrincipal.Current, key).ToLower();

            //var identity = currentPrincipal as ClaimsIdentity;
            //if (identity == null)
            //    return null;

            //var claim = identity?.Claims.FirstOrDefault(c => c.Type == key);
            //return claim?.Value;
        }
    }
}
