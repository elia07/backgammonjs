/*----------------------------
 Loading Document
------------------------------*/
$(document).ready(function () {
    try {
        Themes();
    } catch (e) {

    }

});

/*----------------------------
 All Require Function
------------------------------*/
function Themes() {
    // Tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Popover
    $('[data-toggle="popover"]').popover();


}

function OpenSideNavMenu() {
    document.getElementById("SideNavMenu").style.width = "250px";
}

function CloseSideNavMenu() {
    document.getElementById("SideNavMenu").style.width = "0";
}

function OpenSideNavHeros() {
    document.getElementById("SideNavHeros").style.width = "250px";
}

function CloseSideNavHeros() {
    document.getElementById("SideNavHeros").style.width = "0";
}

/*----------------------------
 Toggle View For List and Grid
------------------------------*/
function toggle_view_list() {
    $('#view-list').addClass('active');
    $('#view-grid').removeClass('active');
    $('#view-item').removeClass('view-grid');
    $('#view-item').addClass('view-list');
}

function toggle_view_grid() {
    $('#view-grid').addClass('active');
    $('#view-list').removeClass('active');
    $('#view-item').removeClass('view-list');
    $('#view-item').addClass('view-grid');
}