using Aden.Web.Data;
using ALSDE.Dtos;
using ALSDE.Idem.Web.UI.AimBanner;
using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;

namespace Aden.Web.Services
{
    public class IdemService
    {
        private IdemContext _context;

        public IdemService()
        {
            _context = new IdemContext();
        }

        public List<IdemApplication> GetApplication()
        {
            var query = "select ApplicationId, ApplicationViewKey, WebsiteViewKey, Title, Description, SectionViewKey from Idem.Applications order by title";
            using (var cn = new SqlConnection(_context.Database.Connection.ConnectionString))
            {
                var list = cn.Query<IdemApplication>(query).ToList();
                return list;
            }
        }

        public AuthenticatedUserDto GetUser(Guid identityGuid)
        {
            var query = "select top 1 LastName, FirstName, EmailAddress, IdentityGuid from Idem.Identities WHERE IdentityGuid = @IdentityGuid";
            using (var cn = new SqlConnection(_context.Database.Connection.ConnectionString))
            {
                var idemUser = cn.Query<AuthenticatedUserDto>(query, new { @IdentityGuid = identityGuid }).SingleOrDefault();
                return idemUser;
            }
        }

        public List<AuthenticatedUserDto> FindUsers(string searchTerm, bool internalOnly = true)
        {
            StringBuilder query = new StringBuilder();
            query.Append("select top 15 LastName, FirstName, EmailAddress, " +
                        "IdentityGuid from Idem.Identities " +
                        "WHERE " +
                        "(LastName like '%' + @SearchString + '%' OR " +
                        "PrintName like '%' + @SearchString + '%' OR " +
                        "EmailAddress LIKE '%' + @SearchString + '%')");

            var extendedQuery = internalOnly ? " AND EmailAddress LIKE '%alsde.edu'" : "";

            query.Append(extendedQuery);

            using (var cn = new SqlConnection(_context.Database.Connection.ConnectionString))
            {
                var list = cn.Query<AuthenticatedUserDto>(query.ToString(), new { @SearchString = searchTerm }).ToList();
                return list;
            }
        }


        public List<Application> GetUserApplications(string userEmailAddress)
        {


            //var user = cnn.Query<User>("spGetUser", new { Id = 1 },
            //    commandType: CommandType.StoredProcedure).First();

            var connection = new SqlConnection(_context.Database.Connection.ConnectionString);

            var idemApplications = connection.Query<Application>("Idem.p_getApplicationsByEmailAddress",
                new { @EmailAddress = userEmailAddress },
                commandType: CommandType.StoredProcedure);

            return idemApplications.ToList();

            //var query = "Idem.p_getApplicationsByEmailAddress @EmailAddress";
            //using (var cn = new SqlConnection(_context.Database.Connection.ConnectionString))
            //{
            //    var idemApplications = cn.Query<IdemApplication>(query, new { @EmailAddress = userEmailAddress }, commandType: CommandType.StoredProcedure);
            //    return idemApplications.ToList();
            //}
        }
    }

    public class Application: IdemApplication
    {
        public string ApplicationViewKey { get; set; }
        //public string WebsiteViewKey { get; set; }

        //public string WebsiteTitle { get; set; }

        //public bool ForceSsl { get; set; }

        //public bool IsMultiTier { get; set; }

        //public string BaseUrl { get; set; }

        //public bool CanRedirect { get; set; }

        //public string OwnerEmail { get; set; }

        //public int? OwnerId { get; set; }

        //public int? ApplicationId { get; set; }

        //public bool WebsiteIsActive { get; set; }

        //public string ThirdPartyUrlIndex { get; set; }

        //public string CompleteHandshakeUrl { get; set; }

        //public string CompleteLandingUrl { get; set; }

        //public string ViewKey { get; set; }

        //public string Description { get; set; }

        //public string Title { get; set; }

        //public string HandshakeUrl { get; set; }

        //public string LandingUrl { get; set; }

        //public string DocumentationLibraryUrl { get; set; }

        //public string SectionViewKey { get; set; }

        //public bool IsActive { get; set; }

        //public bool IsHidden { get; set; }

        //public int? PiwikId { get; set; }

        //public IdemSection Section { get; set; }
    }
}
