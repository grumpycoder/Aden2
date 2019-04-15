using Aden.Web.Models;
using System.Data.Entity.ModelConfiguration;

namespace Aden.Web.Data.Configuration
{
    public class GroupUserViewConfiguration : EntityTypeConfiguration<GroupUserView>
    {
        public GroupUserViewConfiguration()
        {
            ToTable("v_GroupUsers", "Aden");
        }
    }
}
