using System.Collections.Generic;

namespace Aden.Web.ViewModels
{
    public class GroupViewDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<UserProfileDto> Items { get; set; }
    }
}
