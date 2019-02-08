using System.Data.Entity.ModelConfiguration;
using Aden.Web.Models;

namespace Aden.Web.Data.Configuration
{
    public class PerformanceLogDetailConfiguration : EntityTypeConfiguration<PerformanceLogDetail>
    {
        public PerformanceLogDetailConfiguration()
        {
            ToTable("Perf", "Log");
            Property(s => s.Id).HasColumnName("Id");
            Property(s => s.ElapsedMilliseconds).HasColumnType("bigint");
        }
    }
}