
(function () {

    var uriCurrent = "/api/workitem";
    var uriComplete = "/api/workitem/finished";

    var $gridCurrent = $('#gridCurrent').dxDataGrid({
        dataSource: DevExpress.data.AspNet.createStore({
            key: 'id',
            loadUrl: uriCurrent
        }),
        remoteOperations: true,
        allowColumnResizing: true,
        showBorders: true,
        scrolling: { mode: "infinite" },
        paging: { pageSize: 20 },
        columnResizingMode: "nextColumn",
        columnMinWidth: 50,
        columnAutoWidth: true,
        wordWrapEnabled: true,
        height: 300,
        columns: [
            { dataField: 'displayFileName', caption: 'File Name' },
            { dataField: 'dataYear', caption: 'Data Year', width: 75 },
            { dataField: 'assignedDate', caption: 'Assigned', dataType: 'datetime', width: 150 },
            { dataField: 'dueDate', caption: 'Due', dataType: 'datetime', width: 150 },
            {
                width: 375,
                alignment: 'center',
                cellTemplate: function (container, options) {

                    if (!options.data.canGenerate) {
                        $('<a/>').addClass('btn btn-primary btn-sm btn-grid')
                            .text('Review File')
                            .attr('href', '/review/' + options.data.dataYear + '/' + options.data.fileNumber)
                            .attr('aria-label', 'Review generated file ' + options.data.fileName)
                            .attr('target', '_blank')
                            .appendTo(container);
                    }

                    var actionName = options.data.actionName;
                    if (options.data.isManualUpload && options.data.canGenerate) actionName = 'Upload';

                    $('<a/>').addClass('btn btn-success btn-sm btn-grid')
                        .text(actionName)
                        .attr('aria-label', options.data.actionName + ' ' + options.data.fileName)
                        .on('dxclick',
                            function (e) {
                                complete($(this), options.data);
                            })
                        .appendTo(container);

                    if (options.data.canReject) {
                        $('<a/>').addClass('btn btn-danger btn-sm btn-grid')
                            .text('Reject File')
                            .attr('aria-label', 'Reject generated file ' + options.data.fileName)
                            .on('dxclick',
                                function (e) {
                                    reject($(this), options.data);
                                })
                            .appendTo(container);
                    }

                    if (options.data.canSubmit) {
                        $('<a/>').addClass('btn btn-danger btn-sm btn-grid')
                            .text('Report Errors')
                            .attr('aria-label', 'Confirm file submitted ' + options.data.fileName)
                            .on('dxclick',
                                function (e) {
                                    showReportErrors($(this), options.data);
                                })
                            .appendTo(container);
                    }

                    if (options.data.canReviewError) {
                        $('<a/>').addClass('btn btn-danger btn-sm btn-grid')
                            .text('View Errors')
                            .attr('aria-label', 'Review submission errors ' + options.data.fileName)
                            .on('dxclick',
                                function (e) {
                                    showErrorDetails($(this), options.data);
                                })
                            .appendTo(container);
                    }

                }
            }
        ],
        onToolbarPreparing: function (e) {
            var currentGrid = e.component;

            e.toolbarOptions.items.unshift(
                {
                    location: "after",
                    widget: "dxButton",

                    options: {
                        icon: "refresh",
                        hint: 'Refresh',
                        onClick: function () {
                            currentGrid.refresh();
                        }
                    }
                }
            );
        }
    }).dxDataGrid("instance");

    var $gridComplete = $('#gridComplete').dxDataGrid({
        dataSource: DevExpress.data.AspNet.createStore({
            key: 'id',
            loadUrl: uriComplete
        }),
        remoteOperations: true,
        allowColumnResizing: true,
        showBorders: true,
        scrolling: { mode: "infinite" },
        paging: { pageSize: 20 },
        columnResizingMode: "nextColumn",
        columnMinWidth: 50,
        columnAutoWidth: true,
        wordWrapEnabled: true,
        height: 300,
        columns: [
            { dataField: 'displayFileName', caption: 'File Name' },
            { dataField: 'dataYear', caption: 'Data Year' },
            { dataField: 'assignedDate', caption: 'Assigned', dataType: 'datetime' },
            { dataField: 'completedDate', caption: 'Completed', dataType: 'datetime' },
            { dataField: 'actionName', caption: 'Action' },
            {
                width: 150,
                alignment: 'center',
                cellTemplate: function (container, options) {

                    if (options.data.canCancel) {
                        $('<a/>').addClass('btn btn-default btn-sm btn-grid')
                            .text('Cancel')
                            .on('dxclick',
                                function (e) {
                                    cancel($(this), options.data);
                                })
                            .appendTo(container);
                    }
                }
            }
        ],
        onToolbarPreparing: function (e) {
            var historyGrid = e.component;

            e.toolbarOptions.items.unshift(
                {
                    location: "after",
                    widget: "dxButton",

                    options: {
                        icon: "refresh",
                        hint: 'Refresh',
                        onClick: function () {
                            historyGrid.refresh();
                        }
                    }
                }
            );
        }
    }).dxDataGrid("instance");

    function complete(container, data) {
        var uri = '/api/workitem/complete/' + data.id;
        if (data.isManualUpload && data.canGenerate) {
            showUpload(container, data);
        }
        else {
            if (data.actionName === 'Review Error') {
                var message = '';
                if (data.isManual) {
                    message = 'Have you resolved the existing errors in the manual file?';
                } else {
                    message = 'Have you resolved the error generating the file?';
                }
                BootstrapDialog.confirm({
                    title: 'Confirm Error Review',
                    type: BootstrapDialog.TYPE_WARNING,
                    message: '<p class="lead">' + message + '</p> ' +
                        '<p>Selecting "Ok" will assign a task to begin the process again.</p>',
                    callback: function (result) {
                        if (result) {
                            $toggleWorkingButton(container);
                            $.ajax({
                                url: uri,
                                type: 'POST',
                                success: function (data) {
                                    $gridCurrent.refresh();
                                    $gridComplete.refresh();
                                    toastr.success('Completed task for ' +
                                        data.fileName +
                                        ' (' +
                                        data.fileNumber +
                                        ')');
                                },
                                error: function (err) {
                                    toastr.error('Error completing task: ' + err.responseJSON.exceptionMessage);
                                }
                            }).always(function () {
                                $toggleWorkingButton(container);
                            });
                        } else {
                            return;
                        }
                    }
                });

            }
            else {
                //Generate files from defined report action
                $toggleWorkingButton(container);
                $.ajax({
                    url: uri,
                    type: 'POST',
                    success: function (data) {
                        $gridCurrent.refresh();
                        $gridComplete.refresh();
                        toastr.success('Completed task for ' + data.fileName + ' (' + data.fileNumber + ')');
                    },
                    error: function (err) {
                        toastr.error('Error completing task: ' + err.responseJSON.exceptionMessage);
                    }
                }).always(function () {
                    $toggleWorkingButton(container);
                });

            }

        }

    }


    function myFunction() {
        console.log('my function call');
    }

    function reject(container, data) {
        var uri = '/api/workitem/reject/' + data.id;

        BootstrapDialog.confirm('Reject File, are you sure?', function (result) {
            if (result) {
                window.$showModalWorking();
                $.ajax({
                    url: uri,
                    type: 'POST',
                    success: function (data) {
                        $gridCurrent.refresh();
                        $gridComplete.refresh();
                        toastr.warning('Rejected file for ' + data.fileName + ' (' + data.fileNumber + ')');

                    },
                    error: function (err) {
                        toastr.error('Error rejecting file');
                    }
                }).always(function () {
                    window.$hideModalWorking();
                });
            }
        });
    }

    function cancel(container, data) {
        var uri = '/api/workitem/cancel/' + data.id;
        $toggleWorkingButton(container);
        $.ajax({
            url: uri,
            type: 'POST',
            success: function (data) {
                $gridCurrent.refresh();
                $gridComplete.refresh();
                toastr.success('Cancelled task for ' + data.fileName + ' (' + data.fileNumber + ')');
            },
            error: function (err) {
                toastr.error('Error cancelling task');
            }
        }).always(function () {
            $toggleWorkingButton(container);
        });
    }

    function showReportErrors(container, data) {
        var title = 'Submission Errors';
        var url = '/home/errorreport/' + data.id;
        var postUrl = '/home/reporterror'; // + data.id;

        BootstrapDialog.show({
            size: window.BootstrapDialog.SIZE_WIDE,
            draggable: true,
            title: title,
            onshown: function (dialog) {
                var btn = dialog.getButton(dialog.getButtons()[1].id);
                $(document).on('change', '#form', function () {
                    $('#form').validate({
                        rules: {
                            description: {
                                required: true
                            },
                            errorFiles: {
                                required: true,
                                fileType: 'png'
                            }
                        },
                        messages: {
                            description: { required: 'Error description is required' },
                            errorFiles: {
                                required: 'Image files are required',
                                fileType: 'Wrong file type. Should be png file.'
                            }
                        },
                        onfocusout: function (element) {
                            this.element(element);
                        }
                    });
                    var form = $('#form');

                    if (form.valid()) {
                        btn.enable();
                    } else {
                        btn.disable();
                    }
                });
            },

            message: $('<div></div>').load(url, function (resp, status, xhr) {
                if (status === 'error') {
                    toastr.error('Error retrieving reporting errors form');
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
                    label: 'Save',
                    cssClass: 'btn-primary',
                    action: function (dialogRef) {
                        dialogRef.enableButtons(false);
                        dialogRef.setClosable(false);
                        $showModalWorking($('.panel-body'));

                        $('#errorMessage').text('');

                        var formData = new FormData($('form')[0]);

                        var files = $('#errorFiles')[0].files;

                        if (files.length > 0) {
                            for (var i = 0; i < files.length; i++) {
                                formData.append('files', files[i]);
                            }
                        }
                        $.ajax({
                            type: "POST",
                            url: postUrl,
                            data: formData,
                            contentType: false,
                            processData: false,
                            success: function (response) {
                                $gridCurrent.refresh();
                                $gridComplete.refresh();
                                dialogRef.close();
                                toastr.success('Saved errors and created task for ' + data.fileName + ' (' + data.fileNumber + ')');
                            },
                            error: function (error) {
                                toastr.error('Error saving reporting errors for ' + data.fileName + ' (' + data.fileNumber + ')');
                            },
                            complete: function () {
                                dialogRef.close();
                            }
                        });

                    }
                }
            ]
        });

    }

    function showErrorDetails(container, data) {
        var title = 'Error Details';
        var url = '/home/workitemimages/' + data.id;

        BootstrapDialog.show({
            size: window.BootstrapDialog.SIZE_WIDE,
            draggable: true,
            title: title,
            message: $('<div></div>').load(url, function (resp, status, xhr) {
                if (status === 'error') {
                    //TODO: toast error message
                }
            }),
            buttons: [
                {
                    label: 'Close',
                    action: function (dialogRef) {
                        dialogRef.close();
                    }
                }
            ]
        });

    }

    function showUpload(container, data) {
        var loadUrl = '/uploadreport/' + data.id;
        var postUrl = '/api/workitem/submitreport/' + data.id;
        var title = 'File Upload';

        BootstrapDialog.show({
            size: window.BootstrapDialog.SIZE_WIDE,
            draggable: true,
            title: title,
            onshown: function (dialog) {
                var btn = dialog.getButton(dialog.getButtons()[1].id);
                var btn2 = dialog.getButton(dialog.getButtons()[0].id);

                btn.disable();
                $(document).on('change', '#form', function () {
                    $('#form').validate({
                        rules: {
                            uploadFiles: {
                                required: true,
                                fileType: 'csv'
                            }
                        },
                        messages: {
                            uploadFiles: {
                                required: 'This is required',
                                fileType: 'Wrong file type. Should be csv file.'
                            }
                        },
                        onfocusout: function (element) {
                            this.element(element);
                        }
                    });
                    var form = $('#form');
                    btn2.enable();
                    if (form.valid()) {
                        btn.enable();
                    } else {
                        btn.disable();
                    }
                });

            },
            message: $('<div></div>').load(loadUrl, function (resp, status, xhr) {
                if (status === 'error') {
                    toastr.error('Error retrieving reporting errors form');
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
                    label: 'Save',
                    cssClass: 'btn-primary',
                    action: function (dialogRef) {
                        dialogRef.enableButtons(false);
                        dialogRef.setClosable(true);

                        var $button = this;
                        $button.disable();
                        var formData = new FormData();

                        var files = $('#uploadFiles')[0].files;

                        for (var f = 0; f < files.length; f++) {
                            formData.append(files[f].name, files[f]);
                        }

                        var reportLevels = ['sch', 'lea', 'sea'];
                        var errors = [];

                        if (files.length > 0) {
                            for (var i = 0; i < files.length; i++) {
                                var found = reportLevels.find(function (item) { return files[i].name.toLowerCase().includes(item) });
                                if (found === undefined) errors.push(files[i].name + ' not properly named');

                            }
                        }
                        if (errors.length > 0) {

                            var errorMessage = '<strong>File names must contain ' + reportLevels.join(', ') + '</strong><br />';
                            errorMessage += errors.join('<br />');
                            BootstrapDialog.alert({
                                title: 'WARNING',
                                message: errorMessage,
                                type: BootstrapDialog.TYPE_WARNING,
                                closable: true,
                                draggable: true
                            });
                            dialogRef.getButton(dialogRef.getButtons()[0].id).enable();
                        } else {

                            $showModalWorking($('.panel-body'));
                            $.ajax({
                                type: "POST",
                                url: postUrl,
                                data: formData,
                                contentType: false,
                                processData: false,
                                success: function (response) {
                                    $gridCurrent.refresh();
                                    $gridComplete.refresh();
                                    dialogRef.close();
                                    toastr.success('Uploaded files for ' + data.fileName + ' (' + data.fileNumber + ')');
                                },
                                error: function (error) {
                                    toastr.error('Error saving files for ' + data.fileName + ' (' + data.fileNumber + ')');
                                },
                                complete: function () {
                                    dialogRef.close();
                                }
                            });
                        }


                    }
                }
            ]
        });

    }


})();

$.validator.addMethod("fileType", function (value, element, param) {
    return value.split('.')[1].toLowerCase() === param.toLowerCase();
}, "Invalid file type");


jQuery.validator.addMethod("myRule", function (value, element, options) {
    return value === options.data;
}, "My Rule says no!");
