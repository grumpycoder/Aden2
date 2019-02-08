using Aden.Web.Models;
using System.Data.Entity.ModelConfiguration;

namespace Aden.Web.Data.Configuration
{
    public class ErrorLogDetailConfiguration : EntityTypeConfiguration<ErrorLogDetail>
    {
        public ErrorLogDetailConfiguration()
        {
            ToTable("Error", "Log");
            Property(s => s.Id).HasColumnName("Id");
        }
    }
}
