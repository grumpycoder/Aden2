using Aden.Web.Data;
using Aden.Web.Helpers;
using Aden.Web.Models;
using CSharpFunctionalExtensions;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Text;

namespace Aden.Web.Services
{
    public class DocumentService
    {
        private readonly AdenContext _context;

        public DocumentService(AdenContext context)
        {
            _context = context;
        }

        public Result GenerateDocuments(Report report)
        {
            var version = report.CurrentDocumentVersion ?? 0;
            version += 1;

            string filename;
            report.CurrentDocumentVersion = version;
            if (string.IsNullOrEmpty(report.Submission.FileSpecification.ReportAction)) return Result.Fail($"No report action defined for this {report.Submission.FileSpecification.FileDisplayName}");
            if (report.Submission.FileSpecification.IsSCH)
            {
                filename = report.Submission.FileSpecification.FileNameFormat.Replace("{level}", ReportLevel.SCH.GetDisplayName()).Replace("{version}",
                    $"v{version}.csv");
                var result = ExecuteDocumentCreationToFile(report, ReportLevel.SCH);
                if (result.IsFailure) return result;
                var doc = new ReportDocument() { FileData = result.Value, ReportLevel = ReportLevel.SCH, Filename = filename, FileSize = result.Value.Length, Version = version };
                report.Documents.Add(doc);

            }
            if (report.Submission.FileSpecification.IsLEA)
            {
                filename = report.Submission.FileSpecification.FileNameFormat.Replace("{level}", ReportLevel.LEA.GetDisplayName()).Replace("{version}",
                    $"v{version}.csv");
                var result = ExecuteDocumentCreationToFile(report, ReportLevel.LEA);
                if (result.IsFailure) return result;
                var doc = new ReportDocument() { FileData = result.Value, ReportLevel = ReportLevel.SCH, Filename = filename, FileSize = result.Value.Length, Version = version };
                report.Documents.Add(doc);
            }
            if (report.Submission.FileSpecification.IsSEA)
            {
                filename = report.Submission.FileSpecification.FileNameFormat.Replace("{level}", ReportLevel.SEA.GetDisplayName()).Replace("{version}",
                    $"v{version}.csv");
                var result = ExecuteDocumentCreationToFile(report, ReportLevel.SEA);
                if (result.IsFailure) return result;
                var doc = new ReportDocument() { FileData = result.Value, ReportLevel = ReportLevel.SCH, Filename = filename, FileSize = result.Value.Length, Version = version };
                report.Documents.Add(doc);
            }
            report.GeneratedDate = DateTime.Now;


            return Result.Ok();
        }


        private Result<byte[]> ExecuteDocumentCreationToFile(Report report, ReportLevel reportLevel)
        {
            var dataTable = new DataTable();
            var ds = new DataSet();
            using (var connection = new SqlConnection(_context.Database.Connection.ConnectionString))
            {
                using (var cmd = new SqlCommand(report.Submission.FileSpecification.ReportAction, connection))
                {
                    cmd.CommandTimeout = Constants.CommandTimeout;
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@DataYear", report.Submission.DataYear);
                    cmd.Parameters.AddWithValue("@ReportLevel", reportLevel.GetDisplayName());
                    var adapter = new SqlDataAdapter(cmd);
                    adapter.Fill(dataTable);
                    adapter.Fill(ds);
                }
            }

            if (ds.Tables.Count < 2) return Result.Fail<byte[]>($"Report action of {reportLevel.GetDisplayName()} level report of {report.Submission.FileSpecification.FileDisplayName} does not contain header and data rows");

            var filename = report.Submission.FileSpecification.FileNameFormat.Replace("{level}", reportLevel.GetDisplayName()).Replace("{version}", $"v{report.CurrentDocumentVersion}.csv");

            var results = new StringBuilder();
            foreach (DataTable table in ds.Tables)
            {

                if (table.Columns.Contains("filename"))
                {

                    if (table.Rows.Count == 0) return Result.Fail<byte[]>($"Report action of {reportLevel.GetDisplayName()} level report of {report.Submission.FileSpecification.FileDisplayName} header table does not contain any records");

                    results.Insert(0, table.UpdateFieldValue("Filename", filename).ToCsvString(false));
                }
                else
                {
                    if (table.Rows.Count == 0) return Result.Fail<byte[]>($"Report action of {reportLevel.GetDisplayName()} level report of {report.Submission.FileSpecification.FileDisplayName} data table does not contain any records");
                    results.Append(table.ToCsvString(false));
                }
            }
            var file = Encoding.ASCII.GetBytes(results.ToString());

            return Result.Ok(file);

        }


    }
}
