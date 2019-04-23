

(function () {
    console.log('review ready');

    $(document).on('click', 'a[data-doc-id]', function (e) {
        var id = $(this).data('doc-id');
        var $currentTarget = $(this);
        var title = $currentTarget.data('title');
        var url = $currentTarget.data('url');

        BootstrapDialog.show({
            size: BootstrapDialog.SIZE_WIDE,
            draggable: true,
            title: title,
            message: $('<div></div>').load(url, function (resp, status, xhr) {
                if (status === 'error') {
                    toastr.error('Error showing history');
                }
            }),
            buttons: [
                {
                    label: 'Close',
                    action: function (dialogRef) {
                        dialogRef.close();
                    }
                },
                {
                    label: 'Download',
                    cssClass: 'btn-primary',
                    action: function (dialogRef) {
                        var downloadUrl = '/download/' + id;
                        window.downloadFile(downloadUrl);
                        toastr.info('Your file is being downloaded');
                        dialogRef.close();
                    }
                }
            ]
        });
    });

    var auditUri = '/api/audit/submission/' + submissionId;

    $('#gridAuditReview').dxDataGrid(
        {
            dataSource: DevExpress.data.AspNet.createStore({
                key: 'id',
                loadUrl: auditUri
            }),
            remoteOperations: true,
            allowColumnResizing: true,
            noDataText: 'No Audits',
            showBorders: true,
            columnResizingMode: "nextColumn",
            columnMinWidth: 50,
            columnAutoWidth: false,
            height: 200,
            wordWrapEnabled: true,
            scrolling: { mode: "virtual", rowRenderingMode: "virtual" },
            columns: [
                { dataField: 'auditDate', caption: 'Date', dataType: 'datetime', width: 50 },
                { dataField: 'message', caption: 'Message', width:250 }
            ]
        }).dxDataGrid('instance');
    
})();
