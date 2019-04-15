using System;

namespace Aden.Web.Models
{
    public class GroupUserView
    {
        public Int64 Id { get; set; }
        public int GroupId { get; set; }
        public int UserProfileId { get; set; }
        public string GroupName { get; set; }
        public string FullName { get; set; }
        public string Firstname { get; set; }
        public string Lastname { get; set; }
        public string EmailAddress { get; set; }
        public Guid IdentityGuid { get; set; }
    }
}
