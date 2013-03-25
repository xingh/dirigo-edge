﻿/// ===========================================================================================
/// This currently serves as both the blog admin, user admin, and content admin Javascript area
/// ===========================================================================================

blog_class = function() {
    // Track whether the blog has been saved or not on the add Blog page
    this.blogIsSaved = false;
    this.blogId = -1;
    this.blogSpaceReplacementChar = '-';
};

blog_class.prototype.initPageEvents = function() {
    this.editBlogEvents();
    this.addBlogEvents();
    this.initPermaLinkEvents();
    this.manageBlogEvents();
    //this.initTinyMCEEvents();
    this.initPreviewEvent();
    this.initPublishDateEvents();

    // Sidebar menu
    $("#sidebar ul > li.has-dropdown > a").click(function(e) {
        e.preventDefault();
        $(this).parent().toggleClass("active");
        $(this).parent().find("ul.dropdown").slideToggle("fast");
    });

    // Ckeditor instances
    if ($('#CKEDITBLOG').length > 0) {
        this.CKPageEditor = CKEDITOR.replace('CKEDITBLOG', {
            // options here
        });
    }

    if ($('#ShortDescription').length > 0) {
        this.CKShortDescEditor = CKEDITOR.replace('ShortDescription', {
            toolbar: [['Source', '-', 'Bold', 'Italic']]
        });
    }
};

blog_class.prototype.initPermaLinkEvents = function() {
    // Edit Permalink on edit blog page

    $("#EditPermaLink, #PermaLinkEnd").click(function() {
        var textVal = $("#PermaLinkEnd").text();
        $("#PermaLinkEditPane").removeClass("hide").show().attr("value", textVal);
        $(this).hide();
        $("#PermaLinkEnd").hide();

        $("#PermaLinkEditPane").focus();
    });

    // Hide the edit pane and update permalink
    $("#PermaLinkEditPane").blur(function() {
        $("#PermaLinkEnd").text($(this).attr("value"));
        $(this).hide();
        $("#EditPermaLink , #PermaLinkEnd").show();
        $("#PermaLinkEnd").attr("data-modified", "true");
    });

};

blog_class.prototype.initPublishDateEvents = function() {
    $("#PublishDate").datepicker();
};

blog_class.prototype.initPreviewEvent = function() {
    $("#PreviewBlogButton").click(function() {
        var title = $("#PermaLinkEnd").text().toLowerCase();
        var host = 'http://' + window.location.host + '/Blog/';

        // Open the blog in a new window
        window.open(host + title + '/' + '?debug=true');
    });
};

blog_class.prototype.manageBlogEvents = function() {
    var self = this;

    // Delete blog pop up
    $("div.manageBlogs a.button.delete").live("click", function() {
        self.manageBlogId = $(this).attr("data-id");
        self.$manageBlogRow = $(this).parent().parent();
        var title = '"' + self.$manageBlogRow.find("td.title a").text() + '"';
        $("#popTitle").text(title);
        $("#DeleteModal").reveal();
    });

    // Confirm Delete Blog
    $("#ConfirmBlogDelete").live("click", function() {
        var id = self.manageBlogId;
        $.ajax({
            url: "/BlogAdmin/DeleteBlog",
            type: "POST",
            data: {
                id: self.manageBlogId
            },
            success: function(data) {
                var noty_id = noty({ text: 'Blog Successfully Deleted.', type: 'success', timeout: 3000 });
                self.$manageBlogRow.remove();
                $('#DeleteModal').trigger('reveal:close');
            },
            error: function(data) {
                $('#DeleteModal').trigger('reveal:close');
                var noty_id = noty({ text: 'There was an error processing your request.', type: 'error' });
            }
        });
    });
};

blog_class.prototype.editBlogEvents = function() {
    var self = this;

    // Set startup information
    if ($("div.editBlog").length > 0) {
        self.blogId = $("div.editBlog").attr("data-id");
        self.blogIsSaved = true;
    }

    // Lazy Load Stock Images in
    $("#ChooseStockLink").click(function() {
        var $holder = $("#StockImageHolder");
        var hasContent = $holder.find("img").length > 0;

        if (!hasContent) {

            var $container = $("#StockImageHolder");

            common.showAjaxLoader($container);

            $container.load("/blogadmin/loadStockImages/", function(data) {
                common.hideAjaxLoader($container);
            });
        }
    });

    // Click on Stock Images to populate stock dropdown
    $("#StockImagesModal a.stockImage").live("click", function() {
        var src = $(this).find("img").attr("src");
        $("#FeaturedImage").attr("value", src);
        $("#FeaturedImageModal").reveal();

    });
};

blog_class.prototype.addBlogEvents = function() {
    var self = this;

    // Set blog title permalink hint on keypress
    $("#BlogTitle").keyup(function() {
        // Only update permalink if it hasn't been touched yet
        var permLinkModified = $("#PermaLinkEnd").attr("data-modified").toLowerCase() == "true";
        if (!permLinkModified) {
            var val = $(this).val();
            val = val.replace(/ /g, self.blogSpaceReplacementChar);
            $("#PermaLinkEditPane").text(val);
        }
    });

    // Fix spacing issues on page load
    $("#BlogTitle").trigger("keyup");

    // Save Blog from edit / add blog page
    $("#SaveBlog").click(function() {
        var mainCategory = $("div.panel.categories ul li.catListing span.radio.checked").first().parent().text();
        var content = CKEDITOR.instances.CKEDITBLOG.getData();
        var featText = CKEDITOR.instances.ShortDescription.getData();
        var data = {
            entity: {
                Title: $("#BlogTitle").attr("value"),
                HtmlContent: content,
                ImageUrl: $("#FeaturedImage").attr("value"),
                IsActive: $("#SpanCheckPublic").hasClass("checked"),
                IsFeatured: $("#SpanIsFeaturedCheck").hasClass("checked"),
                Author: $("#Author option:selected").text(),
                AuthorId: $("#Author option:selected").attr("data-id"),
                BlogID: self.blogId,
                MainCategory: mainCategory,
                Tags: $("#BlogTags").attr("value"),
                ShortDesc: featText,
                MetaDescription: $("#MetaDescription").attr("value"),
                OGTitle: $("#MetaDescription").attr("value"),
                OGImage: $("#OGImage").attr("value"),
                OGType: $("#OGType").attr("value"),
                OGUrl: $("#OGUrl").attr("value"),
                Canonical: $("#Canonical").attr("value"),
                Date: $("#PublishDate").attr("value"),
                PermaLink: $("#PermaLinkEnd").text()
            }
        };

        // Currently all we really need is a title for validation
        if ($("#BlogTitle").attr("value").length < 1) {
            alert("Please enter a title.");
            return false;
        }
        
        $("#SaveSpinner").show();
        var postUrl = self.blogIsSaved ? "/BlogAdmin/ModifyBlog" : "/BlogAdmin/AddBlog";
        $.ajax({
            url: postUrl,
            type: "POST",
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(data, null, 2),
            success: function(data) {
                self.blogIsSaved = true;
                self.blogId = data.id;

                var noty_id = noty({ text: 'Changes saved successfully.', type: 'success', timeout: 3000 });
                $("#SaveSpinner").hide();
            },
            error: function(data) {
                var noty_id = noty({ text: 'There was an error processing your request.', type: 'error' });
                $("#SaveSpinner").hide();
            }
        });
    });
};

blog_class.prototype.initTinyMCEEvents = function() {
    //tinymce on blog editor
    $('div.editArea textarea').tinymce({
        // Location of TinyMCE script
        script_url: '/Scripts/tinyMCE/tiny_mce.js',
        height: "450px",
        // General options
        theme: "advanced",
        skin: "o2k7",
        skin_variant: "silver",
        plugins: "autolink,spellchecker,lists,save,advimage,advlink,iespell,inlinepopups,insertdatetime,media,searchreplace,contextmenu,directionality,noneditable,template,safari,xhtmlxtras",

        // Theme options
        theme_advanced_buttons1: "bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,bullist,numlist,|,outdent,indent,|,forecolor,backcolor,|,fontselect,fontsizeselect,link,|,code,|,blockquote,|,image,|,insertdate,inserttime,|,sub,sup,spellchecker",
        theme_advanced_buttons2: "",
        theme_advanced_buttons3: "",

        theme_advanced_toolbar_location: "top",
        theme_advanced_toolbar_align: "left",
        theme_advanced_statusbar_location: "bottom",
        theme_advanced_resizing: false,

        // Example content CSS (should be your site CSS)
        content_css: "/CSS/site.css",

        // Drop lists for link/image/media/template dialogs
        template_external_list_url: "lists/template_list.js",
        external_link_list_url: "lists/link_list.js",
        external_image_list_url: "lists/image_list.js",
        media_external_list_url: "lists/media_list.js",
    });

};
// Keep at the bottom
$(document).ready(function() {
    blog = new blog_class();
    blog.initPageEvents();
});