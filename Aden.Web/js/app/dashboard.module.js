$(function () {

    console.log('dashboard ready');

    var uri = "/api/submission";

    var pivotGridChart = $("#pivotgrid-chart").dxChart({
        commonSeriesSettings: {
            type: "bar"
        },
        tooltip: {
            enabled: true,
            customizeTooltip: function (args) {
                return {
                    html: args.seriesName + "<div class='currency'>"
                        + args.originalValue + "</div>"
                };
            }
        },
        size: {
            height: 320
        },
        adaptiveLayout: {
            width: 450
        }
    }).dxChart("instance");

    var pivotGrid = $("#pivotgrid").dxPivotGrid({
        allowSortingBySummary: true,
        allowSorting: true,
        allowFiltering: true,
        allowExpandAll: true,
        wordWrapEnabled: true,
        allowColumnResizing: true,
        columnResizingMode: "widget",

        height: 600,
        showBorders: true,
        fieldChooser: {
            enabled: true,
            applyChangesMode: "instantly",
            allowSearch: true
        },
        dataSource: {
            fields: [
                {
                    caption: "Submission State",
                    width: 120,
                    dataField: "submissionStateDisplay",
                    area: "row"
                }, {
                    caption: "Due Year",
                    dataField: "dueYear",
                    area: "column"
                }, {
                    caption: "Submission",
                    dataField: "id",
                    area: "data"
                }, {
                    dataField: "id",
                    visible: false
                }, {
                    dataField: "submissionState",
                    visible: false
                }, {
                    dataField: "$id",
                    visible: false
                }, {
                    dataField: "canCancel",
                    visible: false
                }, {
                    dataField: "canReopen",
                    visible: false
                }, {
                    dataField: "canReview",
                    visible: false
                }, {
                    dataField: "canStart",
                    visible: false
                }, {
                    dataField: "canWaiver",
                    visible: false
                }, {
                    dataField: "hasAdmin",
                    visible: false
                }, {
                    dataField: "hasStarted",
                    visible: false
                }, {
                    dataField: "isGroupMember",
                    visible: false
                }, {
                    dataField: "reportAction",
                    visible: false
                }, {
                    dataField: "reopenDisabled",
                    visible: false
                }, {
                    dataField: "startDisabled",
                    visible: false
                }, {
                    dataField: "generationUserGroup",
                    visible: false
                }, {
                    dataField: "approvalUserGroup",
                    visible: false
                }, {
                    dataField: "submissionUserGroup",
                    visible: false
                }, {
                    dataField: "submissionUserGroup",
                    visible: false
                }, {
                    dataField: "nextDueDate",
                    visible: false
                }, {
                    dataField: "approverEmailAddresses",
                    visible: false
                }, {
                    dataField: "generatorEmailAddresses",
                    visible: false
                }, {
                    dataField: "approvers",
                    visible: false
                }, {
                    dataField: "generators",
                    visible: false
                }, {
                    dataField: "submitters",
                    visible: false
                }, {
                    dataField: "currentReportId",
                    visible: false
                }, {
                    dataField: "dataGroups",
                    visible: false
                }, {
                    dataField: "displayDataYear",
                    visible: false
                }
            ],
            store: DevExpress.data.AspNet.createStore({ key: 'id', loadUrl: uri })
        },
        fieldPanel: {
            showColumnFields: true,
            showDataFields: true,
            showFilterFields: true,
            showRowFields: true,
            allowFieldDragging: true,
            visible: true
        },
        stateStoring: {
            enabled: true,
            type: "localStorage",
            storageKey: "pivotgridFilterStorage"
        },
        onContextMenuPreparing: contextMenuPreparing,
        onCellClick: function (e) {
            if (e.area === "data") {
                var pivotGridDataSource = e.component.getDataSource(),
                    rowPathLength = e.cell.rowPath.length,
                    rowPathName = e.cell.rowPath[rowPathLength - 1],
                    popupTitle = (rowPathName ? rowPathName : "Total") + " Drill Down Data";

                drillDownDataSource = pivotGridDataSource.createDrillDownDataSource(e.cell);
                detailsPopup.option("title", popupTitle);
                detailsPopup.show();
            }
        },
    }).dxPivotGrid("instance");

    pivotGrid.bindChart(pivotGridChart, {
        dataFieldsDisplayMode: "splitPanes",
        alternateDataFields: false
    });

    function contextMenuPreparing(e) {
        var dataSource = e.component.getDataSource(),
            sourceField = e.field;

        if (sourceField) {
            if (!sourceField.groupName || sourceField.groupIndex === 0) {
                e.items.push({
                    text: "Hide field",
                    onItemClick: function () {
                        var fieldIndex;
                        if (sourceField.groupName) {
                            fieldIndex = dataSource.getAreaFields(sourceField.area, true)[sourceField.areaIndex].index;
                        } else {
                            fieldIndex = sourceField.index;
                        }

                        dataSource.field(fieldIndex, {
                            area: null
                        });
                        dataSource.load();
                    }
                });
            }

            if (sourceField.dataType === "number") {
                var setSummaryType = function (args) {
                    dataSource.field(sourceField.index, {
                        summaryType: args.itemData.value
                    });

                    dataSource.load();
                },
                    menuItems = [];

                e.items.push({ text: "Summary Type", items: menuItems });

                $.each(["Sum", "Avg", "Min", "Max", "Count"], function (_, summaryType) {
                    var summaryTypeValue = summaryType.toLowerCase();

                    menuItems.push({
                        text: summaryType,
                        value: summaryType.toLowerCase(),
                        onItemClick: setSummaryType,
                        selected: e.field.summaryType === summaryTypeValue
                    });
                });
            }
        }
    }

    $("#btnReset").on('click', function (e) {
        e.preventDefault();
        pivotGrid.getDataSource().state({});

    });

    var detailsPopup = $("#detail-popup").dxPopup({
        width: 700,
        height: 600,
        dragEnabled: true,
        resizeEnabled: true,
        contentTemplate: function (contentElement) {
            $("<div />")
                .addClass("drill-down")
                .dxDataGrid({
                    width: '100%',
                    height: '100%',
                    wordWrapEnabled: true,
                    allowColumnResizing: true,
                    columnResizingMode: "widget",
                    columnAutoWidth: true,
                    showFooter: true,
                    filterRow: {
                        visible: true,
                        applyFilter: "auto"
                    },
                    filterPanel: { visible: true },
                    focusedRowEnabled: true,
                    columns: [
                        { dataField: 'fileNumber', caption: 'File Number', width: 100 },
                        { dataField: 'fileName', caption: 'File Name' },
                        { dataField: 'currentAssignment', caption: 'Assigned' },
                        { dataField: 'dueDate', caption: 'Due Date', dataType: 'date' },
                        { dataField: 'lastUpdatedFriendly', caption: 'Last Updated' }
                    ]
                })
                .appendTo(contentElement);
        },
        onShowing: function () {
            $(".drill-down")
                .dxDataGrid("instance")
                .option("dataSource", drillDownDataSource);
        },
        onShown: function () {
            $(".drill-down")
                .dxDataGrid("instance")
                .updateDimensions();
        }
    }).dxPopup("instance");

})
