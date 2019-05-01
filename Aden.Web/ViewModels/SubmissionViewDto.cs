using Aden.Web.Helpers;
using Aden.Web.Models;
using Humanizer;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Web;

namespace Aden.Web.ViewModels
{
    public class SubmissionViewDto
    {
        public int Id { get; set; }
        public string FileNumber { get; set; }
        public string FileName { get; set; }
        public DateTime? SubmissionDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? NextDueDate { get; set; }

        public DateTime? DeadlineDate => NextDueDate ?? DueDate;

        public int? DataYear { get; set; }
        public string DisplayDataYear => $"{DataYear - 1}-{DataYear}";

        public DateTime? LastUpdated { get; set; }
        public string LastUpdatedFriendly => $"{LastUpdated.Humanize(false)}";

        public string Section { get; set; }
        public string DataGroups { get; set; }
        public string Application { get; set; }
        public string Collection { get; set; }
        public string SupportGroup { get; set; }

        public string ReportAction { get; set; }
        public List<string> Generators { get; set; }
        public List<string> Approvers { get; set; }
        public List<string> Submitters { get; set; }
        public string GenerationUserGroup { get; set; }
        public string ApprovalUserGroup { get; set; }
        public string SubmissionUserGroup { get; set; }

        public string CurrentAssignment { get; set; }

        public bool IsSEA { get; set; }
        public bool IsLEA { get; set; }
        public bool IsSCH { get; set; }

        public SubmissionState SubmissionState { get; set; }

        public bool CanStart => (SubmissionState == SubmissionState.NotStarted) && (HasAdmin || IsGroupMember);

        public bool CanWaiver => CanStart && HasAdmin;


        public bool CanCancel =>
            (SubmissionState != SubmissionState.Waived && SubmissionState != SubmissionState.Complete &&
             SubmissionState != SubmissionState.NotStarted) && (HasAdmin || IsGroupMember);

        public bool CanReopen =>
            (SubmissionState == SubmissionState.Complete || SubmissionState == SubmissionState.Waived) && (HasAdmin || IsGroupMember);

        public bool CanReview => CurrentReportId != null;



        public string SubmissionStateDisplay => SubmissionState.GetDisplayName();

        public bool HasStarted => SubmissionState != SubmissionState.NotStarted;


        public bool StartDisabled => CanStart && (string.IsNullOrWhiteSpace(GenerationUserGroup) ||
                                                  string.IsNullOrWhiteSpace(ApprovalUserGroup) ||
                                                  string.IsNullOrWhiteSpace(SubmissionUserGroup));

        public bool ReopenDisabled => CanReopen && (string.IsNullOrWhiteSpace(GenerationUserGroup) ||
                                                    string.IsNullOrWhiteSpace(ApprovalUserGroup) ||
                                                    string.IsNullOrWhiteSpace(SubmissionUserGroup));



        public bool HasAdmin =>
            (HttpContext.Current.User as ClaimsPrincipal).HasClaim(ClaimTypes.Role,
                Constants.GlobalAdministrators); //claim != null;

        public bool IsGroupMember
        {
            get
            {
                var list = GeneratorEmailAddresses.Concat(ApproverEmailAddresses);
                var email = (HttpContext.Current.User as ClaimsPrincipal).Identity.GetEmailAddressClaim();
                var isMatch = list.Contains(email);
                return isMatch;

            }
        }

        public int? CurrentReportId { get; set; }
        public List<string> GeneratorEmailAddresses { get; set; }
        public List<string> ApproverEmailAddresses { get; set; }
    }
}