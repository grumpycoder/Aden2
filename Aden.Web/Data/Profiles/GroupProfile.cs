using Aden.Web.Models;
using Aden.Web.ViewModels;
using AutoMapper;

namespace Aden.Web.Data.Profiles
{
    public class GroupProfile : Profile
    {
        public GroupProfile()
        {

            CreateMap<Group, GroupViewDto>()
                .ForMember(d => d.Id, opt => opt.MapFrom(s => s.Id))
                .ForMember(d => d.Name, opt => opt.MapFrom(s => s.Name))
                .ForMember(d => d.Items, opt => opt.MapFrom(s => s.Users))
                .ForAllOtherMembers(d => d.Ignore())
                ;


        }
    }

}
